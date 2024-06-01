import { compileContract } from '$lib/compiler/compile';
import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	BUY_ORDER_ADDRESS,
	DEPOSIT_ADDRESS,
	SELL_ORDER_ADDRESS,
	SHADOWPOOL_ADDRESS,
	SWAP_ORDER_ADDRESS
} from '$lib/constants/addresses';
import { ALICE_MNEMONIC, BOB_MNEMONIC, SHADOW_MNEMONIC } from '$lib/constants/mnemonics';
import { utxos } from '$lib/data/utxos';
import { boxesAtAddress, boxesAtAddressUnsigned } from '$lib/utils/test-helper';
import {
	signMultisigEIP12,
	signTxInput,
	signTxMulti,
	signTxMultiPartial
} from '$lib/wallet/multisig-server';
import { ErgoAddress, ErgoTree, SAFE_MIN_BOX_VALUE, type Box } from '@fleet-sdk/core';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { describe, expect, it } from 'vitest';
import { createSwapOrderTxR9, executeSwap, createSwapOrderTx } from '../wallet/swap';
import { TOKEN } from '$lib/constants/tokens';
import { sumAssetsFromBoxes } from '$lib/utils/helper';
import { parseBox } from '$lib/db/db';
import type { BoxParameters, ContractType } from '$lib/types/boxRow';

const CONTRACT_FOR_TEST = `{	
	def getSellerPk(box: Box)              	= box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
	def getPoolPk(box: Box)                	= box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
	def unlockHeight(box: Box)             	= box.R5[Int].get
	def getSellingTokenId(box: Box)        	= box.R6[(Coll[Byte],Coll[Byte])].getOrElse((Coll[Byte](),Coll[Byte]()))._1
	def getBuyingTokenId(box: Box)         	= box.R6[(Coll[Byte],Coll[Byte])].getOrElse((Coll[Byte](),Coll[Byte]()))._2
	def getRate(box: Box)                  	= box.R7[Long].get
	def getSellerMultisigAddress(box: Box)  = box.R8[Coll[Byte]].get
  def getDenom(box: Box)                  = box.R9[Long].get



	def tokenId(box: Box) = box.tokens(0)._1
	def tokenAmount(box: Box) = box.tokens(0)._2


//------------------------
	def isSameContract(box: Box) = 
		box.propositionBytes == SELF.propositionBytes

	def isSameTokenPair (box: Box) = 
		getSellingTokenId(SELF) == getSellingTokenId(box) &&
		getBuyingTokenId(SELF)  == getBuyingTokenId(box)

	
  def hasSellingToken(box: Box) = 
		getSellingTokenId(SELF) == getSellingTokenId(box) &&
		box.tokens.size > 0 &&
		getSellingTokenId(SELF) == tokenId(box)

	def hasBuyingToken(box: Box) = 
		getBuyingTokenId(SELF) == getBuyingTokenId(box) &&
		box.tokens.size > 0 &&
		getBuyingTokenId(SELF) == tokenId(box)

  	def isGreaterZeroRate(box:Box) =
		getRate(box) > 0

	def isSameSeller(box: Box)   = 
		getSellerPk(SELF) == getSellerPk(box) &&
		getPoolPk(SELF) == getPoolPk(box)

  	def isSameUnlockHeight(box: Box)  = 
		unlockHeight(SELF) == unlockHeight(box)

 	def isSameMultisig(box: Box)    =
		getSellerMultisigAddress(SELF) == getSellerMultisigAddress(box)

	def isLegitInput(box: Box) =
		isSameContract(box) &&
		isSameSeller(box) &&
		isSameUnlockHeight(box) && 
		isSameTokenPair(box) &&
		hasSellingToken(box) &&
		isGreaterZeroRate(box) &&
		isSameMultisig(box)
//-------------------------
  val maxDenom: Long = INPUTS
		.filter(isLegitInput)
		.fold(0L, {(r:Long, box:Box) => {
			if(r > getDenom(box)) r else getDenom(box)
		}}) // TAKE MAX DENOM
  
    def getRateInMaxDenom(box:Box) = getRate(box)*maxDenom/getDenom(box) //1>

  	def sumTokenAmount(a:Long, b: Box) = a + tokenAmount(b)
  	def sumTokenAmountXRate(a:Long, b: Box) = a + tokenAmount(b) * getRateInMaxDenom(b)   // <---------------- REWORK WITH MAX DENOM

    val maxSellRate: Long = INPUTS
      .filter(isLegitInput)
      .fold(0L, {(r:Long, box:Box) => {
        if(r > getRateInMaxDenom(box)) r else getRateInMaxDenom(box)
      }})

      def hasMaxSellRate(box: Box) =
    getRate(box)*maxDenom==getDenom(box)*maxSellRate //include denom

  	def isLegitSellOrderOutput(box: Box) =
	  	isLegitInput(box)&&
	  	hasMaxSellRate(box)

  //-------------------------
	def isPaymentBox(box:Box) =
		isSameSeller(box) &&
		isSameUnlockHeight(box) &&
		hasBuyingToken(box) &&
		getSellerMultisigAddress(SELF) == box.propositionBytes

	def sumSellTokensIn(boxes: Coll[Box]): Long = boxes
		.filter(isLegitInput) 
		.fold(0L, sumTokenAmount)

	def sumSellTokensOut(boxes: Coll[Box]): Long = boxes
		.filter(isLegitSellOrderOutput)
		.fold(0L, sumTokenAmount)

	def sumBuyTokensPaid(boxes: Coll[Box]): Long = boxes
		.filter(isPaymentBox) 
		.fold(0L, sumTokenAmount)
//-------------------------

//-----------------
  	val tokensSold = sumSellTokensIn(INPUTS) - sumSellTokensOut(OUTPUTS) //rsBTC on contract (delta) (10000)

  	val tokensPaid = sumBuyTokensPaid(OUTPUTS) //sigUSD PAID (20) + ADD DENOM (1000) = > 20_000 

    	val inSellTokensXRate = INPUTS  //VOLUME INPUT ON CONTRACT
		.filter(isLegitInput) 
		.fold(0L, sumTokenAmountXRate)   // 2*10000

     	val outSellTokensXRate = OUTPUTS //VOLUME OUTPUT ON CONTRACT 
		.filter(isLegitSellOrderOutput)
		.fold(0L, sumTokenAmountXRate)  // Учитывает макс деном  

    val sellTokensXRate = inSellTokensXRate - outSellTokensXRate  // DELTA VOLUME в Макс деноме
    val expectedRate = sellTokensXRate / tokensSold   // 23125124 in DENOM MAX

    val isPaidAtFairRate = maxDenom*tokensPaid/tokensSold >= expectedRate  //sigUSD PAID (20) + ADD DENOM (1000) = > 20_000. * MAX_DENOM
    //1000
    //20
    //10000
    //>=
    //2
	
  if(HEIGHT > unlockHeight(SELF)){
		getSellerPk(SELF)
	}else{
    getSellerPk(SELF) && getPoolPk(SELF) || sigmaProp(isPaidAtFairRate) && getPoolPk(SELF)
	}
}`;

const CONTRACT_WITH_R9 = compileContract(CONTRACT_FOR_TEST);
let height = 1_275_000;
let unlockHeight = 1300000;

function customRecognizer(box: Box): ContractType {
	const address = new ErgoTree(box.ergoTree).toAddress().toString();
	if (address == DEPOSIT_ADDRESS) {
		return 'DEPOSIT';
	} else if (address == BUY_ORDER_ADDRESS) {
		return 'BUY';
	} else if (address == SELL_ORDER_ADDRESS) {
		return 'SELL';
	} else if (address == CONTRACT_WITH_R9) {
		return 'SWAP';
	} else {
		return 'UNKNOWN';
	}
}

function parseBoxCustom(box: Box): BoxParameters | undefined {
	return parseBox(box, customRecognizer);
}

describe('New Swap order with R9', async () => {
	const tokenForSale = {
		tokenId: TOKEN.rsBTC.tokenId,
		price: '0.002',
		amount: '10000'
	};
	const paymentToken = {
		tokenId: TOKEN.sigUSD.tokenId,
		amount: 20n
	};

	it.only('Order + deposit[ALICE], change:ALICE: FULL execute', async () => {
		let unsignedTx1 = createSwapOrderTxR9(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxos[DEPOSIT_ADDRESS][1],
			tokenForSale,
			tokenForSale.price,
			height,
			unlockHeight,
			tokenForSale.tokenId,
			paymentToken.tokenId,
			CONTRACT_WITH_R9
		);

		const bobSwapTx = await signTxMulti(unsignedTx1, BOB_MNEMONIC, BOB_ADDRESS);
		const swapOrderBoxes = boxesAtAddress(bobSwapTx, CONTRACT_WITH_R9);
		expect(swapOrderBoxes, 'swap order boxes').toBeDefined();
		expect(swapOrderBoxes.length, 'swap order boxes length').toBe(1);

		const paymentInTokens = {
			tokenId: paymentToken.tokenId,
			amount: BigInt(Number(tokenForSale.amount) * Number(tokenForSale.price))
		};

		const executeSwapOrderTx = executeSwap(
			height,
			swapOrderBoxes,
			[utxos[DEPOSIT_ADDRESS][0]],
			{ tokenId: tokenForSale.tokenId, amount: tokenForSale.amount },
			paymentInTokens,
			SAFE_MIN_BOX_VALUE
		);

		expect(executeSwapOrderTx.inputs.length).toBe(2);

		expect(boxesAtAddressUnsigned(executeSwapOrderTx, DEPOSIT_ADDRESS).length).toBe(2);
		expect(boxesAtAddressUnsigned(executeSwapOrderTx, SWAP_ORDER_ADDRESS).length).toBe(0);
		expect(parseBoxCustom(executeSwapOrderTx.inputs[0])?.contract).toBe('SWAP');
		expect(parseBoxCustom(executeSwapOrderTx.inputs[0])?.parameters.userPk).toBe(BOB_ADDRESS);
		expect(parseBoxCustom(executeSwapOrderTx.inputs[0])?.parameters.poolPk).toBe(
			SHADOWPOOL_ADDRESS
		);
		expect(parseBoxCustom(executeSwapOrderTx.inputs[0])?.parameters.unlockHeight).toBe(1300000);

		const signedBobInput = await signTxInput(
			SHADOW_MNEMONIC,
			JSON.parse(JSON.stringify(executeSwapOrderTx)),
			0
		);
		expect(signedBobInput, 'bob can sign index:0').toBeDefined();

		expect(parseBoxCustom(executeSwapOrderTx.inputs[1])?.contract).toBe('DEPOSIT');
		expect(parseBoxCustom(executeSwapOrderTx.inputs[1])?.parameters.userPk).toBe(ALICE_ADDRESS);
		expect(parseBoxCustom(executeSwapOrderTx.inputs[1])?.parameters.unlockHeight).toBe(1300000);

		console.log(executeSwapOrderTx.inputs);
		const signed = signTxMultiPartial(executeSwapOrderTx, ALICE_MNEMONIC, ALICE_ADDRESS);

		//const signed = signMultisigEIP12(executeSwapOrderTx, ALICE_MNEMONIC, ALICE_ADDRESS);
		//expect(signed).toBeDefined();

		return;

		const unsignedTx = unsignedTransaction; // <---
		let swapContractUtxo = swapOrderBoxes;

		const shadowIndex = unsignedTx.inputs.findIndex((b) =>
			swapContractUtxo.map((b) => b.boxId).includes(b.boxId)
		);
		expect(shadowIndex).toBe(0);

		const signedShadowInput = await signTxInput(SHADOW_MNEMONIC, unsignedTx, shadowIndex);

		const shadowInputProof = JSON.parse(signedShadowInput.spending_proof().to_json());

		expect(shadowInputProof.proofBytes.length).greaterThan(10);

		//---------------------- CHANGE FOR MULTISIG ALICE + POOL -------------
		const aliceIndex = unsignedTx.inputs.findIndex(
			(b) => utxos[DEPOSIT_ADDRESS].map((b) => b.boxId).includes(b.boxId) //DEPOSIT
		);
		expect(aliceIndex).toBe(1);
		expect(unsignedTx.inputs[aliceIndex].ergoTree).toBe(
			ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree
		);

		// --------------
		// const commits = await a(unsignedTx);
		// console.dir(commits, { depth: null });
		// --------------

		// MULTISIG INPUTS
		const signedAliceInput = await signTxInput(ALICE_MNEMONIC, unsignedTx, aliceIndex);

		// ---------------

		const aliceInputProof = JSON.parse(signedAliceInput.spending_proof().to_json());
		expect(aliceInputProof.proofBytes.length).greaterThan(10);

		const txId = wasm.UnsignedTransaction.from_json(JSON.stringify(unsignedTx)).id().to_str();

		unsignedTx.inputs[shadowIndex] = {
			boxId: unsignedTx.inputs[shadowIndex].boxId,
			spendingProof: shadowInputProof
		};
		unsignedTx.inputs[aliceIndex] = {
			boxId: unsignedTx.inputs[aliceIndex].boxId,
			spendingProof: aliceInputProof
		};

		unsignedTx.id = txId;
		console.log(unsignedTx.id);
	});
});
