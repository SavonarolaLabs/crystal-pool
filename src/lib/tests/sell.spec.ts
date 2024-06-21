import { beforeAll, describe, expect, it } from 'vitest';
import {
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	SAFE_MIN_BOX_VALUE,
	TransactionBuilder,
	type Box
} from '@fleet-sdk/core';
import { ALICE_ADDRESS, BOB_ADDRESS, DEPOSIT_ADDRESS } from '$lib/constants/addresses';
import { TOKEN } from '$lib/constants/tokens';
import { deposit, depositNoTokens } from '$lib/wallet/deposit';
import { utxos } from '$lib/data/utxos';
import { signTx, signTxInput, signTxMulti } from '$lib/wallet/multisig-server';
import { boxesAtAddress } from '$lib/utils/test-helper';
import { ALICE_MNEMONIC, BOB_MNEMONIC, SHADOW_MNEMONIC } from '$lib/constants/mnemonics';
import { createSellOrderTxR9, executeSell } from '$lib/wallet/sell';
import { compileContract } from '$lib/compiler/compile';

const CONTRACT_FOR_TEST = `{	
	def getSellerPk(box: Box)              = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
	def getPoolPk(box: Box)                = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
	def unlockHeight(box: Box)             = box.R5[Int].get
	def getTokenId(box: Box)               = box.R6[Coll[Byte]].getOrElse(Coll[Byte]()) 
	def getSellRate(box: Box)              = box.R7[Long].get
	def getSellerMultisigAddress(box: Box) = box.R8[Coll[Byte]].get

 	def tokenId(box: Box) = box.tokens(0)._1
	def tokenAmount(box: Box) = box.tokens(0)._2
  
	def isSameContract(box: Box) = 
		box.propositionBytes == SELF.propositionBytes
  
	def isSameToken(box: Box)    = 
	  	getTokenId(SELF) == getTokenId(box) &&
	  	box.tokens.size > 0 &&
		getTokenId(SELF) == tokenId(box)

  	def isGreaterZeroRate(box:Box) =
    	getSellRate(box) > 0
  
	def isSameSeller(box: Box)   = 
    	getSellerPk(SELF) == getSellerPk(box) &&
    	getPoolPk(SELF) == getPoolPk(box)

  	def isSameUnlockHeight(box: Box)  = 
    	unlockHeight(SELF) == unlockHeight(box)

  	def isSameMultisig(box: Box)    =
    	getSellerMultisigAddress(SELF) == getSellerMultisigAddress(box)

	def isLegitInputBox(b: Box) = {
	    isSameContract(b) && 
    	isSameToken(b) && 
    	isSameMultisig(b) && 
    	isSameSeller(b) && 
    	isGreaterZeroRate(b)
	}
  
	def isPaymentBox(box:Box) = {
		isSameSeller(box) &&
    	isSameUnlockHeight(box) &&
		getTokenId(SELF) == getTokenId(box) &&
		getSellerMultisigAddress(SELF) == box.propositionBytes
	}
  
	def sumTokensIn(boxes: Coll[Box]): Long = boxes
		.filter(isLegitInputBox) 
		.fold(0L, {(a:Long, b: Box) => a + b.tokens(0)._2})
  
	val tokensIn: Long = sumTokensIn(INPUTS)
  
	val avgRateInputs: Long = INPUTS
    	.filter(isLegitInputBox)
    	.fold(0L, {(a:Long, b: Box) => {
    	  a + getSellRate(b)*tokenAmount(b)
    	}}) / tokensIn 
	
	val maxSellRate = INPUTS
    	.filter(isLegitInputBox)
    	.fold(0L, {(r:Long, box:Box) => {
		    if(r > getSellRate(box)) r else getSellRate(box)
		}})
  
	def sumTokensInAtMaxRate(boxes: Coll[Box]): Long = boxes
		.filter(isLegitInputBox)
		.filter({(b: Box)=> getSellRate(b) == maxSellRate})
		.fold(0L, {(a:Long, b: Box) => a + tokenAmount(b)})
  
	def isMaxRateChangeBox(box: Box) = {
		isSameSeller(box) &&
		isSameUnlockHeight(box) &&
		isSameToken(box) &&
		maxSellRate == getSellRate(box) &&
		isSameMultisig(box) &&
		isSameContract(box)
	}
  
	def tokensRemaining(boxes: Coll[Box]): Long = boxes
		.filter(isMaxRateChangeBox)
		.fold(0L, {(a:Long, b: Box) => a + tokenAmount(b)}) 
	
	val tokensBack: Long = tokensRemaining(OUTPUTS)
	val tokensSold: Long = tokensIn - tokensBack
  
	val nanoErgsPaid: Long = OUTPUTS
		.filter(isPaymentBox)
		.fold(0L, {(a:Long, b: Box) => a + b.value})
  
  	val valueOfSoldTokens: Long  = tokensIn * avgRateInputs - tokensBack * maxSellRate
  	val amountOfSoldTokens: Long = tokensIn - tokensBack
	val avgTokenPrice: Long =  valueOfSoldTokens / amountOfSoldTokens

	val tokensInputAtMaxRate = sumTokensInAtMaxRate(INPUTS) 
	val sellOrderChangeBoxIsFine = tokensInputAtMaxRate > tokensBack 
	val sellerPaid: Boolen = tokensSold * avgTokenPrice <= nanoErgsPaid
  
	val orderFilled = sellerPaid && sellOrderChangeBoxIsFine
  
	if(HEIGHT > unlockHeight(SELF)){
		getSellerPk(SELF)
	}else{
		getSellerPk(SELF) && getPoolPk(SELF) || sigmaProp(orderFilled) && getPoolPk(SELF)
	}
}`;

const CONTRACT_WITH_R9 = compileContract(CONTRACT_FOR_TEST);

let height = 1_209_955;
let unlockHeight = 1300000;

describe('limit sell order', () => {
	let sellOrderBoxes: Box[];
	let depositsAlice: Box[];

	//To check basic contract
	const tokenForSale0 = {
		tokenId: TOKEN.rsBTC.tokenId,
		price: '2',
		amount: 1_000_000n
	};

	//To check R9 contract
	const tokenForSale = {
		tokenId: TOKEN.rsBTC.tokenId,
		price: '0.02',
		amount: 100_000_000n
	};

	//Need checks that what u pay is more than Min Safe Box
	const minimalErgo = SAFE_MIN_BOX_VALUE; //1_000_000n
	const ergoFee = RECOMMENDED_MIN_FEE_VALUE; //1_100_000n

	let paymentInErgo = 20_000_000n; //2_000_000 fair price

	beforeAll(async () => {
		//DEPOSIT
		let depositTx = deposit(
			height,
			[utxos[BOB_ADDRESS][0]],
			BOB_ADDRESS,
			BOB_ADDRESS,
			unlockHeight,
			tokenForSale
		);
		let signedDepositTx = await signTx(depositTx, BOB_MNEMONIC);
		let depositsBob = boxesAtAddress(signedDepositTx, DEPOSIT_ADDRESS);
		expect(depositsBob.length).toBe(1);

		let depositTxAlice = depositNoTokens(
			height,
			[utxos[ALICE_ADDRESS][0]],
			ALICE_ADDRESS,
			ALICE_ADDRESS,
			unlockHeight,
			2n * paymentInErgo
		);
		let signedDepositTxAlice = await signTx(depositTxAlice, ALICE_MNEMONIC);
		depositsAlice = boxesAtAddress(signedDepositTxAlice, DEPOSIT_ADDRESS);
		expect(depositsAlice.length).toBe(1);

		const sellUTx = createSellOrderTxR9(
			BOB_ADDRESS,
			depositsBob,
			tokenForSale,
			tokenForSale.price,
			height,
			CONTRACT_WITH_R9
		);

		const bobSwapTx = await signTxMulti(sellUTx, BOB_MNEMONIC, BOB_ADDRESS);
		sellOrderBoxes = boxesAtAddress(bobSwapTx, CONTRACT_WITH_R9); //NEW SELL CONTRACT
	});

	it('sell box defined', async () => {
		expect(sellOrderBoxes, 'sell order boxes').toBeDefined();
		expect(sellOrderBoxes.length, 'sell order boxes length').toBe(1);
	});

	it('execture sell contract', async () => {
		const executeSellOrderTx = executeSell(
			height,
			sellOrderBoxes,
			depositsAlice,
			tokenForSale,
			paymentInErgo
		);
		expect(executeSellOrderTx.inputs.length).toBe(2);

		//console.log(executeSellOrderTx);
		//Basic sign
		const sInput0 = await signTxInput(
			SHADOW_MNEMONIC,
			JSON.parse(JSON.stringify(executeSellOrderTx)),
			0
		);
		expect(sInput0, 'shadow can sign index:0').toBeDefined();
	});
});
