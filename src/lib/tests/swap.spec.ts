import { compileContract } from '$lib/compiler/compile';
import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	DEPOSIT_ADDRESS,
	SWAP_ORDER_ADDRESS
} from '$lib/constants/addresses';
import {
	ALICE_MNEMONIC,
	BOB_MNEMONIC,
	SHADOW_MNEMONIC
} from '$lib/constants/mnemonics';
import { utxos } from '$lib/data/utxos';
import { boxesAtAddress, boxesAtAddressUnsigned } from '$lib/utils/test-helper';
import {
	signMultisigEIP12,
	signTxInput
} from '$lib/wallet/multisig-server';
import {
	ErgoAddress,
	SAFE_MIN_BOX_VALUE
} from '@fleet-sdk/core';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { describe, expect, it } from 'vitest';
import { createSwapOrderTxR9, executeSwap } from '../wallet/swap';
import { TOKEN } from '$lib/constants/tokens';
import { sumAssetsFromBoxes } from '$lib/utils/helper';


const CONTRACT_FOR_TEST = `{	
		def getSellerPk(box: Box)              	= box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
		def getPoolPk(box: Box)                	= box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
		def unlockHeight(box: Box)             	= box.R5[Int].get
		def getSellingTokenId(box: Box)        	= box.R6[(Coll[Byte],Coll[Byte])].getOrElse((Coll[Byte](),Coll[Byte]()))._1
		def getBuyingTokenId(box: Box)         	= box.R6[(Coll[Byte],Coll[Byte])].getOrElse((Coll[Byte](),Coll[Byte]()))._2
		def getRate(box: Box)                  	= box.R7[Long].get
		def getSellerMultisigAddress(box: Box)  = box.R8[Coll[Byte]].get
	
		def tokenId(box: Box) = box.tokens(0)._1
		def tokenAmount(box: Box) = box.tokens(0)._2
		  def sumTokenAmount(a:Long, b: Box) = a + tokenAmount(b)
		  def sumTokenAmountXRate(a:Long, b: Box) = a + tokenAmount(b) * getRate(b)   
	
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
	
		val maxSellRate: Long = INPUTS
			.filter(isLegitInput)
			.fold(0L, {(r:Long, box:Box) => {
				if(r > getRate(box)) r else getRate(box)
			}})
	
		  def hasMaxSellRate(box: Box) =
			getRate(box) == maxSellRate
	
		  def isLegitSellOrderOutput(box: Box) =
			  isLegitInput(box)&&
			  hasMaxSellRate(box)
	
		def ispayedBox(box:Box) =
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
			.filter(ispayedBox) 
			.fold(0L, sumTokenAmount)
	  
		  val tokensSold = sumSellTokensIn(INPUTS) - sumSellTokensOut(OUTPUTS)
		  val tokensPaid = sumBuyTokensPaid(OUTPUTS)
	
		val inSellTokensXRate = INPUTS
			.filter(isLegitInput) 
			.fold(0L, sumTokenAmountXRate)
	
		  val outSellTokensXRate = OUTPUTS
			.filter(isLegitSellOrderOutput)
			.fold(0L, sumTokenAmountXRate)
	
		val sellTokensXRate = inSellTokensXRate - outSellTokensXRate
		val expectedRate = sellTokensXRate / tokensSold   
	
		  val isPaidAtFairRate = tokensPaid/tokensSold >= expectedRate
	
		if(HEIGHT > unlockHeight(SELF)){
			getSellerPk(SELF)
		}else{
			getSellerPk(SELF) && getPoolPk(SELF) || sigmaProp(isPaidAtFairRate) && getPoolPk(SELF)
		}
	}`;
const CONTRACT_WITH_R9 = compileContract(CONTRACT_FOR_TEST);

describe('New Swap order with R9', async () => {
	let height = 1_275_000;
	let unlockHeight = 1300000;
	const rsBTC = TOKEN.rsBTC.tokenId;
	const sigUSD = TOKEN.sigUSD.tokenId;

	const price = '0.002';
	const tokenForSale = {
		tokenId: rsBTC,
		amount: '10000'
	};

	it.only('Order + deposit[ALICE], change:ALICE: FULL execute', async () => {
		let unsignedTx1 = createSwapOrderTxR9(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxos[DEPOSIT_ADDRESS][1],
			tokenForSale,
			price,
			height,
			unlockHeight,
			rsBTC,
			sigUSD,
			CONTRACT_WITH_R9
		);

		const signedTx = await signMultisigEIP12(unsignedTx1, BOB_MNEMONIC, BOB_ADDRESS);
		const swapOrderBoxes = boxesAtAddress(signedTx, CONTRACT_WITH_R9);
		expect(swapOrderBoxes, 'swap order boxes').toBeDefined();
		expect(swapOrderBoxes.length, 'swap order boxes length').toBe(1);

		const buyAmount = 10000n;

		const paymentInTokens = {
			tokenId: sigUSD,
			amount: BigInt(Number(buyAmount) * Number(price))
		};

		const unsignedTransaction = executeSwap(
			height,
			swapOrderBoxes,
			[utxos[DEPOSIT_ADDRESS][0]],
			{ tokenId: rsBTC, amount: buyAmount },
			paymentInTokens,
			SAFE_MIN_BOX_VALUE
		);
		expect(boxesAtAddressUnsigned(unsignedTransaction, DEPOSIT_ADDRESS).length).toBe(2);
		expect(boxesAtAddressUnsigned(unsignedTransaction, SWAP_ORDER_ADDRESS).length).toBe(0);

		const signed = signMultisigEIP12(unsignedTransaction, ALICE_MNEMONIC, ALICE_ADDRESS);
		expect(signed).toBeDefined();

		return;

		//Sign inputs
		const unsignedTx = unsignedTransaction; // <---
		let swapContractUtxo = swapOrderBoxes;

		const shadowIndex = unsignedTx.inputs.findIndex((b) =>
			swapContractUtxo.map((b) => b.boxId).includes(b.boxId)
		);
		expect(shadowIndex).toBe(0);

		const signedShadowInput = await signTxInput(
			SHADOW_MNEMONIC,
			unsignedTx,
			shadowIndex
		);

		const shadowInputProof = JSON.parse(
			signedShadowInput.spending_proof().to_json()
		);

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
		const signedAliceInput = await signTxInput(
			ALICE_MNEMONIC,
			unsignedTx,
			aliceIndex
		);

		// ---------------

		const aliceInputProof = JSON.parse(
			signedAliceInput.spending_proof().to_json()
		);
		expect(aliceInputProof.proofBytes.length).greaterThan(10);

		const txId = wasm.UnsignedTransaction.from_json(
			JSON.stringify(unsignedTx)
		)
			.id()
			.to_str();

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

