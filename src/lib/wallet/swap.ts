import { DEPOSIT_ADDRESS, SHADOWPOOL_ADDRESS, SWAP_ORDER_ADDRESS } from '$lib/constants/addresses';
import {
	first,
	type Amount,
	type Box,
	type EIP12UnsignedTransaction,
	type OneOrMore
} from '@fleet-sdk/common';
import {
	ErgoAddress,
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	SAFE_MIN_BOX_VALUE,
	SColl,
	SGroupElement,
	SInt,
	SSigmaProp,
	TransactionBuilder
} from '@fleet-sdk/core';
import { SByte, SLong, SPair } from '@fleet-sdk/serializer';

import { amountByTokenId, asBigInt, calcTokenChange, sumNanoErg } from '$lib/utils/helper';
import type { SwapRequest } from '../../server/routes/swapOrder';
import type { BoxDB } from '$lib/db/db';

export function splitSellRate(sellRate: string): [bigint, bigint] {
	let floatRate = parseFloat(sellRate);
	let exponent = 0;
	while (floatRate % 1 !== 0) {
		floatRate *= 10;
		exponent -= 1;
	}
	const bigRate = BigInt(floatRate);
	const bigDenom = BigInt(10 ** (exponent * -1));
	return [bigRate, bigDenom];
}

export function createSwapOrderTxR9(
	sellerPK: string,
	sellerMultisigAddress: string,
	inputBoxes: OneOrMore<Box<Amount>>,
	token: { tokenId: string; amount: Amount },
	sellRate: string,
	currentHeight: number,
	unlockHeight: number,
	sellingTokenId: string,
	buyingTokenId: string,
	contractAddress: string,
	nanoErg: bigint
): EIP12UnsignedTransaction {
	const [bigRate, bigDenom] = splitSellRate(sellRate);

	const outputSwapOrder = new OutputBuilder(nanoErg, contractAddress)
		.addTokens(token)
		.setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())),
				SGroupElement(first(ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).getPublicKeys()))
			]).toHex(),
			R5: SInt(unlockHeight).toHex(),
			R6: SPair(SColl(SByte, sellingTokenId), SColl(SByte, buyingTokenId)).toHex(),
			R7: SLong(bigRate).toHex(),
			R8: SColl(SByte, ErgoAddress.fromBase58(sellerMultisigAddress).ergoTree).toHex(),
			R9: SLong(bigDenom).toHex()
		});

	const change = new OutputBuilder(
		sumNanoErg(inputBoxes) - asBigInt(nanoErg) - RECOMMENDED_MIN_FEE_VALUE,
		DEPOSIT_ADDRESS
	)
		.setAdditionalRegisters({
			R4: inputBoxes[0].additionalRegisters.R4,
			R5: inputBoxes[0].additionalRegisters.R5
		})
		.addTokens(calcTokenChange([...inputBoxes], token));

	const unsignedTransaction = new TransactionBuilder(currentHeight)
		.configureSelector((selector) => selector.ensureInclusion([inputBoxes].map((b) => b.boxId)))
		.from(inputBoxes)
		.to([outputSwapOrder, change])
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	return unsignedTransaction;
}

export function executeSwap(
	blockchainHeight: number,
	swapOrderInputBoxes: Box<Amount>[],
	paymentInputBoxes: Box<Amount>[],
	tokensFromSwapContract: { tokenId: string; amount: Amount },
	tokensAsPayment: { tokenId: string; amount: Amount },
	nanoErg: string | bigint = 2n * RECOMMENDED_MIN_FEE_VALUE + SAFE_MIN_BOX_VALUE
): EIP12UnsignedTransaction {
	console.log('export function executeSwap')
	console.dir({
		blockchainHeight,
swapOrderInputBoxes,
paymentInputBoxes,
tokensFromSwapContract,
tokensAsPayment,
nanoErg
	})
	const paymentOutputBox = new OutputBuilder(nanoErg, DEPOSIT_ADDRESS)
		.setAdditionalRegisters({
			R4: swapOrderInputBoxes[0].additionalRegisters.R4,
			R5: swapOrderInputBoxes[0].additionalRegisters.R5,
			R6: swapOrderInputBoxes[0].additionalRegisters.R6
		})
		.addTokens(tokensAsPayment);

	let remainingSwapOrderBox = undefined;
	const remainingTokens =
		asBigInt(tokensFromSwapContract.amount) -
		asBigInt(amountByTokenId(swapOrderInputBoxes, tokensFromSwapContract.tokenId));
	if (remainingTokens > 0n) {
		const remainingRateBox = swapOrderInputBoxes[0]; // TODO select the proper box;
		remainingSwapOrderBox = new OutputBuilder(nanoErg, DEPOSIT_ADDRESS)
			.setAdditionalRegisters(remainingRateBox.additionalRegisters)
			.addTokens({
				tokenId: tokensFromSwapContract.tokenId,
				amount: remainingTokens
			});
	}

	const change = new OutputBuilder(
		sumNanoErg(swapOrderInputBoxes) +
			sumNanoErg(paymentInputBoxes) -
			asBigInt(nanoErg) -
			RECOMMENDED_MIN_FEE_VALUE,
		DEPOSIT_ADDRESS
	)
		.setAdditionalRegisters({
			R4: paymentInputBoxes[0].additionalRegisters.R4,
			R5: paymentInputBoxes[0].additionalRegisters.R5
		})
		.addTokens(
			calcTokenChange([...swapOrderInputBoxes, ...paymentInputBoxes], tokensAsPayment)
		);

	const uTx = new TransactionBuilder(blockchainHeight)
		.configureSelector((selector) =>
			selector.ensureInclusion(swapOrderInputBoxes.map((b) => b.boxId))
		)
		.from([...swapOrderInputBoxes, ...paymentInputBoxes])
		.to([paymentOutputBox, change, remainingSwapOrderBox].filter((x) => x) as OutputBuilder[])
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();

	return uTx;
}

export function createSwapOrderTx(
	sellerPK: string,
	sellerMultisigAddress: string,
	inputBoxes: OneOrMore<Box<Amount>>,
	token: { tokenId: string; amount: Amount },
	sellRate: bigint,
	currentHeight: number,
	unlockHeight: number,
	sellingTokenId: string,
	buyingTokenId: string
): EIP12UnsignedTransaction {
	const output = new OutputBuilder(SAFE_MIN_BOX_VALUE, SWAP_ORDER_ADDRESS)
		.addTokens(token)
		.setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())),
				SGroupElement(first(ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).getPublicKeys()))
			]).toHex(),
			R5: SInt(unlockHeight).toHex(),
			R6: SPair(SColl(SByte, sellingTokenId), SColl(SByte, buyingTokenId)).toHex(),
			R7: SLong(sellRate).toHex(),
			R8: SColl(SByte, ErgoAddress.fromBase58(sellerMultisigAddress).ergoTree).toHex()
		});

	const unsignedTransaction = new TransactionBuilder(currentHeight)
		.from(inputBoxes)
		.to(output)
		.sendChangeTo(sellerPK)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	return unsignedTransaction;
}


export function createExecuteSwapOrderTx(swapParams: SwapRequest, db: BoxDB) {
	const [rate, denom] = splitSellRate(swapParams.price);
	const height = 1273521;
	
	const swapOrderInputBoxes: any = db.boxRows.filter(
		(b) =>
			b.contract == 'SWAP' &&
			b.parameters?.side == 'sell' &&
			b.parameters?.rate == rate &&
			b.parameters?.denom == denom
	);
	swapOrderInputBoxes.length = 1;

	const paymentInputBoxes: any = db.boxRows.filter(
		(b) =>
			b.contract == 'DEPOSIT' &&
			b.parameters.userPk == swapParams.address
	);
	if (swapOrderInputBoxes.length < 1 || paymentInputBoxes.length < 1) {
		console.dir({ swapOrderInputBoxes, paymentInputBoxes });
		throw new Error(
			'not enough boxes, swapOrderInputBoxes:' +
				swapOrderInputBoxes.length +
				', paymentInputBoxes:' +
				paymentInputBoxes.length
		);
	}

	const buyingAmount = +swapOrderInputBoxes[0].box.assets[0].amount;
	const paymentAmount = +swapParams.price * +swapParams.amount;

	const tokensFromSwapContract = {
		tokenId: swapParams.buyingTokenId,
		amount: BigInt(buyingAmount)
	};
	const tokensAsPayment = { tokenId: swapParams.sellingTokenId, amount: BigInt(paymentAmount) };

	const unsignedTx = executeSwap(
		height,
		swapOrderInputBoxes.map(b => b.box),
		paymentInputBoxes.map(b => b.box),
		tokensFromSwapContract,
		tokensAsPayment
	);
	return unsignedTx;
}
