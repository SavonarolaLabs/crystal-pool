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
import {
	signMultisig,
	signTxByAddress,
	signTxInput,
	txHasErrors
} from '$lib/wallet/multisig-server';
import { utxos } from '$lib/data/utxos';
import {
	ErgoAddress,
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	SAFE_MIN_BOX_VALUE,
	TransactionBuilder
} from '@fleet-sdk/core';
import { beforeAll, describe, expect, it } from 'vitest';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { createSwapOrderTx, createSwapOrderTxR9 } from '../wallet/swap';
import type { EIP12UnsignedTransaction } from '@fleet-sdk/common';
import { compileContract, compileSwapContract } from '$lib/compiler/compile';

const sellingTokenId =
	'69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8'; //HoldErgDoge Test1
const buyingTokenId =
	'd2d0deb3b0b2c511e523fd43ae838ba7b89e4583f165169b90215ff11d942c1f'; //SwapToken Test1
const orderValue = SAFE_MIN_BOX_VALUE;

const tokenForSale = {
	tokenId: '69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
	amount: '100'
};

const price = 2n;
let height = 1_275_000;
let unlockHeight = 1300000;

let swapOrderBoxes: any;

describe('OLD Swap order', async () => {
	beforeAll(async () => {
		const unsignedTx = createSwapOrderTx(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxos[BOB_ADDRESS],
			tokenForSale,
			price,
			height,
			unlockHeight,
			sellingTokenId,
			buyingTokenId
		);

		const signedTx = await signTxByAddress(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsignedTx
		);
		swapOrderBoxes = [signedTx.outputs[0]];
	});

	//swapOrderBoxes

	it('execute swap order', async () => {
		const buyAmount = 50n;
		const error = 0n;
		const buyerPk = ALICE_ADDRESS;
		const currentHeight = height;

		const paymentInTokens = {
			tokenId: buyingTokenId,
			amount: buyAmount * price
		}; // Сколько заплатили в Других токенах

		//Seller Output
		const outputPayment = new OutputBuilder(
			SAFE_MIN_BOX_VALUE,
			DEPOSIT_ADDRESS
		)
			.setAdditionalRegisters({
				R4: swapOrderBoxes[0].additionalRegisters.R4,
				R5: swapOrderBoxes[0].additionalRegisters.R5,
				R6: swapOrderBoxes[0].additionalRegisters.R6
			})
			.addTokens(paymentInTokens);

		const tempOutputSwapOrder = JSON.parse(
			JSON.stringify(swapOrderBoxes[0])
		);

		tempOutputSwapOrder.assets[0].amount =
			BigInt(tokenForSale.amount) - buyAmount;

		//Swap Order Output
		const outputSwapOrder = new OutputBuilder(
			tempOutputSwapOrder.value,
			SWAP_ORDER_ADDRESS
		)
			.addTokens(tempOutputSwapOrder.assets)
			.setAdditionalRegisters(tempOutputSwapOrder.additionalRegisters);

		const unsignedTransaction = new TransactionBuilder(currentHeight)
			.configureSelector((selector) =>
				selector.ensureInclusion(swapOrderBoxes.map((b) => b.boxId))
			)
			.from([...swapOrderBoxes, ...utxos[buyerPk]])
			.to([outputPayment, outputSwapOrder])
			.sendChangeTo(buyerPk) //add registers
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

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

		const aliceIndex = unsignedTx.inputs.findIndex((b) =>
			utxos[ALICE_ADDRESS].map((b) => b.boxId).includes(b.boxId)
		);
		expect(aliceIndex).toBe(1);
		expect(unsignedTx.inputs[aliceIndex].ergoTree).toBe(
			ErgoAddress.fromBase58(ALICE_ADDRESS).ergoTree
		);
		const signedAliceInput = await signTxInput(
			ALICE_MNEMONIC,
			unsignedTx,
			aliceIndex
		);
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
	});
});

//CONTRACT WITH ALL RESTRICTIONS
const CONTRACT_WITH_R9 =
	'LRDNLdTJ798EJwU1MNKHJpduriCU7vijfJv8bUvYP58Uxq7JNuKdoa3XXTYaT7qFf8QUQnhPkjpH9wFuLmSNE7qGrdx1mMiZowJQ2aPhqGJqMvkShrEpGstTuDhHFNTjj8HBFQpQJjUfjAdYJjvmk7axctvKQnDDkns9BPunBAi3qxj8L4AwVUULrRmGkVjdBzAAVNsPMyzv178pgtEZ2kmYUK1s6f91ntZ2PratWWjQg2gWMUHoSprCFDUXizrL7tHGeJT4D5dtgnZGTZti7fG5w5CBykmcmJJcyXigoUTEk2ZX2Mc9oyZWobjcQJVpY21Jr6HExZYg3qbfVnrVUeBtjmxjjQouNo2CRwKr4AmpbvsPG27negVMwTHA43ohig8i7EteWj36NY6b9vsRgvZ5V7EZTFrwdvtYHoyDFfcQ7X5tVK78B3aBvpvxxA4utB1H5ewuH2fqzmUkCaxjgLw1VgC6rMQpMpRTTAzrLAaYRe6qSGs7CiAEwHVNyXAoV2z4iscCX2ZMMDDvbX8pCQoz42VXvPhvyMLCGS5iPHbjd2L1jCwjjLfcXebNjNMSsvTMddDhh6szXbyvs5AbFRzxCrmeM6K8kGqQbjiQRtKARNkGkb18ZsDhQiEWRMzbQaeeF4Yut3aBJEUqXGG68MjfECTHz9A5NNd5KBodY8jiN6w7wKLE2vnLA7Fv4RQSmRoPuhnNJaC8gnbWJYrHWYRbNspMCX8WLRsFymA7ccWJuT1aoNZ3NsrtFGUUc97sFXxR5Pe8H7FaKKBvVyhb4kp3S3qTJq1sAzCyHyCVxgQvnJsACdyWukGHP6fewJqKWb6WdG8FKYrMmSdDYwCebSx8JrHVk3bQua34SrPcyrYweNFTUC4reAeadW5fUvPEwU71n9Ubw867P46qgbT8o7ZnDtHsdyYznNQrQkpW3hvToZbG4KxXvdpU2uggm733PS468kK7NuESYwscnwMy6UetJ1PdjC1YcsYB4oZ2kEukaYaq6B8kXgLxicApDxDeadNeUCSBXdHrFndCSWwcmth74dyapqQ2aVBNqt96rUGF5UaezaMSDRGsZPVXqbqMVGHQNHT4JsMMetZT';

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
const compiledContract = compileContract(CONTRACT_FOR_TEST);

//Берем контракты N штук - у каждого свое последнее условие
//Берем M штук транзакций - и каждый под N*M

//Пишем дополнительную функцию, которая декодит НЕ подписанную транзакцию
//Пишем функцию которая берет эту транзакцию или боксы и проделывает операции схожие с операциям в контракте

//Выписываем фул лог переменных в файл и смотрим где ломается

describe('New Swap order with R9', async () => {
	//INITIAL PARAMETERS
	let height = 1_275_000;
	let unlockHeight = 1300000;

	const price = '0.002';
	const tokenForSale = {
		tokenId:
			'5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
		amount: '10000'
	};
	const sellingTokenId =
		'5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d';
	const buyingTokenId =
		'03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04';

	const contract = CONTRACT_WITH_R9;
	beforeAll(async () => {
		const unsignedTx = createSwapOrderTxR9(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxos[BOB_ADDRESS],
			tokenForSale,
			price,
			height,
			unlockHeight,
			sellingTokenId,
			buyingTokenId,
			contract
		);

		const signedTx = await signTxByAddress(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsignedTx
		);
		swapOrderBoxes = [signedTx.outputs[0]];
	});

	//swapOrderBoxes
	it.skip('Order + deposit[ALICE], change:ALICE: FULL execute', async () => {
		const buyAmount = 10000n;
		const error = 0n;
		const buyerPk = ALICE_ADDRESS;
		const currentHeight = height;

		const paymentInTokens = {
			tokenId: buyingTokenId,
			amount: BigInt(Number(buyAmount) * price)
		}; //TODO:FIX ROUNDING AND MAKE ACCURATE CALCULATIONS

		//Seller Output
		const outputPayment = new OutputBuilder(
			SAFE_MIN_BOX_VALUE,
			DEPOSIT_ADDRESS
		)
			.setAdditionalRegisters({
				R4: swapOrderBoxes[0].additionalRegisters.R4,
				R5: swapOrderBoxes[0].additionalRegisters.R5,
				R6: swapOrderBoxes[0].additionalRegisters.R6
			})
			.addTokens(paymentInTokens);

		const aliceBox = utxos[DEPOSIT_ADDRESS][0];

		//console.log('newUnlockHeight', newUnlockHeight);
		const tempOutputSwapOrder = JSON.parse(
			JSON.stringify(swapOrderBoxes[0])
		);

		tempOutputSwapOrder.assets[0].amount =
			BigInt(tokenForSale.amount) - buyAmount;

		//outputSwapOrder
		//Swap Order Output
		// const outputSwapOrder = new OutputBuilder(
		// 	tempOutputSwapOrder.value,
		// 	SWAP_ORDER_ADDRESS
		// )
		// 	.addTokens(tempOutputSwapOrder.assets)
		// 	.setAdditionalRegisters(tempOutputSwapOrder.additionalRegisters);

		const unsignedTransaction = new TransactionBuilder(currentHeight)
			.configureSelector((selector) =>
				selector.ensureInclusion(swapOrderBoxes.map((b) => b.boxId))
			)
			.from([...swapOrderBoxes, aliceBox])
			.to([outputPayment])
			.sendChangeTo(ALICE_ADDRESS) //add registers and DONT SEND
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signedTx = await signMultisig(
			unsignedTransaction,
			ALICE_MNEMONIC,
			ALICE_ADDRESS
		);
		//console.dir(signedTx.to_js_eip12(), { depth: null });

		expect(await txHasErrors(signedTx.to_js_eip12())).not.toBe(false);
	});

	it.skip('Order + deposit[ALICE], change:ALICE: 50% execute', async () => {
		const buyAmount = 5000n;
		const buyerPk = ALICE_ADDRESS;
		const currentHeight = height;

		const paymentInTokens = {
			tokenId: buyingTokenId,
			amount: BigInt(Number(buyAmount) * price)
		}; //TODO:FIX ROUNDING AND MAKE ACCURATE CALCULATIONS
		console.log('amount', paymentInTokens.amount);
		//Seller Output
		const outputPayment = new OutputBuilder(
			SAFE_MIN_BOX_VALUE,
			DEPOSIT_ADDRESS
		)
			.setAdditionalRegisters({
				R4: swapOrderBoxes[0].additionalRegisters.R4,
				R5: swapOrderBoxes[0].additionalRegisters.R5,
				R6: swapOrderBoxes[0].additionalRegisters.R6
			})
			.addTokens(paymentInTokens);

		const aliceBox = utxos[DEPOSIT_ADDRESS][0];

		//console.log('newUnlockHeight', newUnlockHeight);
		const tempOutputSwapOrder = JSON.parse(
			JSON.stringify(swapOrderBoxes[0])
		);

		tempOutputSwapOrder.assets[0].amount =
			BigInt(tokenForSale.amount) - buyAmount;

		//outputSwapOrder
		//Swap Order Output
		const outputSwapOrder = new OutputBuilder(
			tempOutputSwapOrder.value,
			SWAP_ORDER_ADDRESS
		)
			.addTokens(tempOutputSwapOrder.assets)
			.setAdditionalRegisters(tempOutputSwapOrder.additionalRegisters);

		const unsignedTransaction = new TransactionBuilder(currentHeight)
			.configureSelector((selector) =>
				selector.ensureInclusion(swapOrderBoxes.map((b) => b.boxId))
			)
			.from([...swapOrderBoxes, aliceBox])
			.to([outputPayment, outputSwapOrder])
			.sendChangeTo(ALICE_ADDRESS) //add registers and DONT SEND
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signedTx = await signMultisig(
			unsignedTransaction,
			ALICE_MNEMONIC,
			ALICE_ADDRESS
		);
		//console.dir(signedTx.to_js_eip12(), { depth: null });

		expect(await txHasErrors(signedTx.to_js_eip12())).not.toBe(false);
	});

	it('Order + ALICE_PK, change:ALICE: FULL execute', async () => {
		const buyAmount = 10000n;
		const error = 0n;
		const buyerPk = ALICE_ADDRESS;
		const currentHeight = height;

		const paymentInTokens = {
			tokenId: buyingTokenId,
			amount: BigInt(Number(buyAmount) * price)
		}; //TODO:FIX ROUNDING AND MAKE ACCURATE CALCULATIONS

		//Seller Output
		const outputPayment = new OutputBuilder(
			SAFE_MIN_BOX_VALUE,
			DEPOSIT_ADDRESS
		)
			.setAdditionalRegisters({
				R4: swapOrderBoxes[0].additionalRegisters.R4,
				R5: swapOrderBoxes[0].additionalRegisters.R5,
				R6: swapOrderBoxes[0].additionalRegisters.R6
			})
			.addTokens(paymentInTokens);

		const aliceBox = utxos[ALICE_ADDRESS][1];

		//console.log('newUnlockHeight', newUnlockHeight);
		const tempOutputSwapOrder = JSON.parse(
			JSON.stringify(swapOrderBoxes[0])
		);

		tempOutputSwapOrder.assets[0].amount =
			BigInt(tokenForSale.amount) - buyAmount;

		//outputSwapOrder
		//Swap Order Output
		// const outputSwapOrder = new OutputBuilder(
		// 	tempOutputSwapOrder.value,
		// 	SWAP_ORDER_ADDRESS
		// )
		// 	.addTokens(tempOutputSwapOrder.assets)
		// 	.setAdditionalRegisters(tempOutputSwapOrder.additionalRegisters);

		const unsignedTransaction = new TransactionBuilder(currentHeight)
			.configureSelector((selector) =>
				selector.ensureInclusion(swapOrderBoxes.map((b) => b.boxId))
			)
			.from([...swapOrderBoxes, ...utxos[ALICE_ADDRESS]])
			.to([outputPayment])
			.sendChangeTo(ALICE_ADDRESS) //add registers and DONT SEND
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signedTx = await signMultisig(
			unsignedTransaction,
			ALICE_MNEMONIC,
			ALICE_ADDRESS
		);
		//console.dir(signedTx.to_js_eip12(), { depth: null });

		expect(await txHasErrors(signedTx.to_js_eip12())).not.toBe(false);
	});

	it('Order + BOB utxo: BOB can cancell order', async () => {
		const buyAmount = 10000n;
		const error = 0n;
		const buyerPk = ALICE_ADDRESS;
		const currentHeight = height;
		const outputPayment = new OutputBuilder(
			BigInt(swapOrderBoxes[0].value),
			DEPOSIT_ADDRESS
		)
			.setAdditionalRegisters({
				R4: swapOrderBoxes[0].additionalRegisters.R4,
				R5: swapOrderBoxes[0].additionalRegisters.R5,
				R6: swapOrderBoxes[0].additionalRegisters.R6
			})
			.addTokens(swapOrderBoxes[0].assets[0]);

		const unsignedTransaction = new TransactionBuilder(currentHeight)
			.configureSelector((selector) =>
				selector.ensureInclusion(swapOrderBoxes.map((b) => b.boxId))
			)
			.from([...swapOrderBoxes, ...utxos[BOB_ADDRESS]])
			.to([outputPayment])
			.sendChangeTo(BOB_ADDRESS) //add registers and DONT SEND
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signedTx = await signMultisig(
			unsignedTransaction,
			BOB_MNEMONIC,
			BOB_ADDRESS
		);
		//console.dir(signedTx.to_js_eip12(), { depth: null });

		expect(await txHasErrors(signedTx.to_js_eip12())).not.toBe(false);
	});

	it('Order + BOB utxo: BOB can cancell order', async () => {
		const buyAmount = 10000n;
		const error = 0n;
		const buyerPk = ALICE_ADDRESS;
		const currentHeight = height;
		const outputPayment = new OutputBuilder(
			BigInt(swapOrderBoxes[0].value),
			DEPOSIT_ADDRESS
		)
			.setAdditionalRegisters({
				R4: swapOrderBoxes[0].additionalRegisters.R4,
				R5: swapOrderBoxes[0].additionalRegisters.R5,
				R6: swapOrderBoxes[0].additionalRegisters.R6
			})
			.addTokens(swapOrderBoxes[0].assets[0]);

		const unsignedTransaction = new TransactionBuilder(currentHeight)
			.configureSelector((selector) =>
				selector.ensureInclusion(swapOrderBoxes.map((b) => b.boxId))
			)
			.from([...swapOrderBoxes, ...utxos[BOB_ADDRESS]])
			.to([outputPayment])
			.sendChangeTo(BOB_ADDRESS) //add registers and DONT SEND
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		//console.dir(unsignedTransaction, { depth: null });
		checkInteractionWithContractCore(unsignedTransaction);
		//console.dir(signedTx.to_js_eip12(), { depth: null });
	});
});

function checkInteractionWithContractCore(
	unsignedTx: EIP12UnsignedTransaction
) {
	const swapContractErgoTree =
		'19a1060f010004000402040004000500050004000500050005000400050005000500d81dd601d9010163e4c672010504d602da720101a7d603d17300d60483020872037203d605d9010563b2e5c6720504147204730100d606da720501a7d607d9010763b2e5c6720704147204730200d608d9010863ed937206da720501720893da720701a7da7207017208d609d9010963937202da7201017209d60a830002d60b8602720a720ad60cd9010c638ce5c6720c063c0e0e720b01d60dda720c01a7d60ed9010e638ce5c6720e063c0e0e720b02d60fd9010f638cb2db6308720f73030001d610d9011063e4c672100705d611d9011163e4c67211080ed612da721101a7d613d9011363ededededededdad901156393c27215c2a7017213da7208017213da7209017213dad9011563ed93720dda720c01721593da720e01a7da720e017215017213dad9011563eded93720dda720c01721591b1db63087215730493720dda720f017215017213dad901156391da72100172157305017213dad9011563937212da7211017215017213d614b5a47213d615d9011563e4c672150905d616b072147306d901164163d802d6188c721601d619da7215018c72160295917218721972187219d617da720e01a7d618d90118638cb2db6308721873070002d619d9011941639a8c721901da7218018c721902d61ad9011a639d9cda721001721a7216da721501721ad61bd9011b63edda721301721bdad9011d63939cda721001721d72169cda721501721db072147308d9011f4163d802d6218c721f01d622da721a018c721f029591722172227221722201721bd61c99dad9011c0c63b0b5721c72137309721901a4dad9011c0c63b0b5721c721b730a721901a5d61dd9011d4163d801d61f8c721d029a8c721d019cda721801721fda721a01721f9591a372027206d801d61eda720701a7eb02ea027206721eea02d1929d9c7216dad9011f0c63b0b5721fd9012163edededda7208017221da7209017221dad9012363eded937217da720e01722391b1db63087223730b937217da720f017223017221937212c27221730c721901a5721c9d99b07214730d721db0b5a5721b730e721d721c721e';
	const tx = {
		inputs: [
			{
				boxId: '35704d93bb807331b0075b3cf707ddb17f6906f56ab541ea24eee3b4bfeadaa9',
				value: '1000000',
				ergoTree:
					'19a1060f010004000402040004000500050004000500050005000400050005000500d81dd601d9010163e4c672010504d602da720101a7d603d17300d60483020872037203d605d9010563b2e5c6720504147204730100d606da720501a7d607d9010763b2e5c6720704147204730200d608d9010863ed937206da720501720893da720701a7da7207017208d609d9010963937202da7201017209d60a830002d60b8602720a720ad60cd9010c638ce5c6720c063c0e0e720b01d60dda720c01a7d60ed9010e638ce5c6720e063c0e0e720b02d60fd9010f638cb2db6308720f73030001d610d9011063e4c672100705d611d9011163e4c67211080ed612da721101a7d613d9011363ededededededdad901156393c27215c2a7017213da7208017213da7209017213dad9011563ed93720dda720c01721593da720e01a7da720e017215017213dad9011563eded93720dda720c01721591b1db63087215730493720dda720f017215017213dad901156391da72100172157305017213dad9011563937212da7211017215017213d614b5a47213d615d9011563e4c672150905d616b072147306d901164163d802d6188c721601d619da7215018c72160295917218721972187219d617da720e01a7d618d90118638cb2db6308721873070002d619d9011941639a8c721901da7218018c721902d61ad9011a639d9cda721001721a7216da721501721ad61bd9011b63edda721301721bdad9011d63939cda721001721d72169cda721501721db072147308d9011f4163d802d6218c721f01d622da721a018c721f029591722172227221722201721bd61c99dad9011c0c63b0b5721c72137309721901a4dad9011c0c63b0b5721c721b730a721901a5d61dd9011d4163d801d61f8c721d029a8c721d019cda721801721fda721a01721f9591a372027206d801d61eda720701a7eb02ea027206721eea02d1929d9c7216dad9011f0c63b0b5721fd9012163edededda7208017221da7209017221dad9012363eded937217da720e01722391b1db63087223730b937217da720f017223017221937212c27221730c721901a5721c9d99b07214730d721db0b5a5721b730e721d721c721e',
				creationHeight: 1275000,
				assets: [
					{
						tokenId:
							'5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
						amount: '10000'
					}
				],
				additionalRegisters: {
					R4: '1402cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2ccd025d163103d491a5193c7b18182442877ce8fcf3ffb9ae9c295d9c98a16dcb0551',
					R9: '05d00f',
					R6: '3c0e0e205bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d2003faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04',
					R8: '0e45100204000402d801d601d9010163b2e4c6720104147300009591a3dad9010263e4c67202050401a7da720101a7ea02da720101a7dad9010263b2e4c67202041473010001a7',
					R7: '0504',
					R5: '04c0d89e01'
				},
				transactionId:
					'53429148054d83f186799f053088b77a60cae9a928adf2302be7e40876191d29',
				index: 0,
				extension: {}
			},
			{
				boxId: '46d5afc4b9fdea0ab0e04848b0281b59e7dccf6c4e3c7931e1af4ee323e01916',
				value: '982039682',
				ergoTree:
					'0008cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c',
				creationHeight: 1275107,
				assets: [
					{
						tokenId:
							'd2d0deb3b0b2c511e523fd43ae838ba7b89e4583f165169b90215ff11d942c1f',
						amount: '49000000000000000'
					},
					{
						tokenId:
							'3f61f140d3fe334a845df647245a9e534337458f976a9d2a32ce4a7a3ee89232',
						amount: '1'
					},
					{
						tokenId:
							'69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
						amount: '47997989999998290'
					},
					{
						tokenId:
							'5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
						amount: '2099999999000000'
					},
					{
						tokenId:
							'471eec389bebd266b5be1163451775d15c22df12af911e8ff0b919b60c862bae',
						amount: '1'
					},
					{
						tokenId:
							'61e8c9d9cb5975fb4f54eec7d62286febcd58aba97cf6798691e3acc728cf3d1',
						amount: '1'
					},
					{
						tokenId:
							'2b4e0c286b470a9403c10fe557c58c1b5b678a2078b50d28baad0629e237e69c',
						amount: '1'
					},
					{
						tokenId:
							'2b1d40e38098e666740177c9f296a6ec8898c9a28c645576cca37e0449402a09',
						amount: '1'
					},
					{
						tokenId:
							'74648d5d515e37fd578e3fbe7aa0764f5edd27e0c311d82ffcd5596934daf431',
						amount: '1'
					}
				],
				additionalRegisters: {},
				transactionId:
					'4ce2b637f9e1a637bcd8458cbe83662b78f547fa431e4f4b4364342ba847ec6f',
				index: 2,
				extension: {}
			}
		],
		dataInputs: [],
		outputs: [
			{
				value: '1000000',
				ergoTree:
					'100204000402d801d601d9010163b2e4c6720104147300009591a3dad9010263e4c67202050401a7da720101a7ea02da720101a7dad9010263b2e4c67202041473010001a7',
				creationHeight: 1275000,
				assets: [
					{
						tokenId:
							'5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
						amount: '10000'
					}
				],
				additionalRegisters: {
					R4: '1402cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2ccd025d163103d491a5193c7b18182442877ce8fcf3ffb9ae9c295d9c98a16dcb0551',
					R5: '04c0d89e01',
					R6: '3c0e0e205bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d2003faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04'
				}
			},
			{
				value: '1100000',
				ergoTree:
					'1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304',
				creationHeight: 1275000,
				assets: [],
				additionalRegisters: {}
			},
			{
				value: '980939682',
				ergoTree:
					'0008cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c',
				creationHeight: 1275000,
				assets: [
					{
						tokenId:
							'5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
						amount: '2099999999000000'
					},
					{
						tokenId:
							'd2d0deb3b0b2c511e523fd43ae838ba7b89e4583f165169b90215ff11d942c1f',
						amount: '49000000000000000'
					},
					{
						tokenId:
							'3f61f140d3fe334a845df647245a9e534337458f976a9d2a32ce4a7a3ee89232',
						amount: '1'
					},
					{
						tokenId:
							'69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
						amount: '47997989999998290'
					},
					{
						tokenId:
							'471eec389bebd266b5be1163451775d15c22df12af911e8ff0b919b60c862bae',
						amount: '1'
					},
					{
						tokenId:
							'61e8c9d9cb5975fb4f54eec7d62286febcd58aba97cf6798691e3acc728cf3d1',
						amount: '1'
					},
					{
						tokenId:
							'2b4e0c286b470a9403c10fe557c58c1b5b678a2078b50d28baad0629e237e69c',
						amount: '1'
					},
					{
						tokenId:
							'2b1d40e38098e666740177c9f296a6ec8898c9a28c645576cca37e0449402a09',
						amount: '1'
					},
					{
						tokenId:
							'74648d5d515e37fd578e3fbe7aa0764f5edd27e0c311d82ffcd5596934daf431',
						amount: '1'
					}
				],
				additionalRegisters: {}
			}
		]
	};
	const inputBoxes = tx.inputs;
	const outputBoxes = tx.outputs;
	console.log('inputBoxes', inputBoxes.length);
	//data pox
	//
}
