import { DEPOSIT_ADDRESS, SELL_ORDER_ADDRESS, SHADOWPOOL_ADDRESS } from '$lib/constants/addresses';
import { utxos } from '$lib/data/utxos';
import {
	asBigInt,
	sumNanoErg,
	calcTokenChange,
	amountByTokenId,
	sumAssetsFromBoxes
} from '$lib/utils/helper';
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
	SByte,
	SColl,
	SGroupElement,
	SInt,
	SLong,
	SSigmaProp,
	TransactionBuilder
} from '@fleet-sdk/core';
import { splitSellRate } from './swap';

export function createSellOrderTxR9(
	sellerPK: string,
	inputBoxes: Box[],
	token: { tokenId: string; amount: Amount },
	sellRate: string,
	currentHeight: number,
	contract: string = SELL_ORDER_ADDRESS,
	nanoErg: bigint = SAFE_MIN_BOX_VALUE
): EIP12UnsignedTransaction {
	const [bigRate, bigDenom] = splitSellRate(sellRate);

	const outputSwapOrder = new OutputBuilder(nanoErg, contract)
		.addTokens(token)
		.setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())),
				SGroupElement(first(ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).getPublicKeys()))
			]).toHex(),
			//@ts-ignore
			R5: inputBoxes[0].additionalRegisters.R5,
			R6: SColl(SByte, token.tokenId).toHex(), //SPair(SColl(SByte, token.tokenId), SColl(SByte, buyingTokenId)).toHex(),
			R7: SLong(bigRate).toHex(),
			R8: SColl(SByte, ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree).toHex(),
			R9: SLong(bigDenom).toHex()
		});

	// TODO: make change conditional
	const change = new OutputBuilder(
		// @ts-ignore
		sumNanoErg(inputBoxes) - asBigInt(nanoErg) - RECOMMENDED_MIN_FEE_VALUE, // 4997900000 + 3200000 - SAFE_MIN_BOX_VALUE -  RECOMMENDED_MIN_FEE_VALUE
		DEPOSIT_ADDRESS
	)
		.setAdditionalRegisters({
			R4: inputBoxes[0].additionalRegisters.R4,
			R5: inputBoxes[0].additionalRegisters.R5
		})
		// @ts-ignore
		.addTokens(calcTokenChange([...inputBoxes], token));

	const unsignedTransaction = new TransactionBuilder(currentHeight)
		// @ts-ignore
		.configureSelector((selector) => selector.ensureInclusion(inputBoxes.map((b) => b.boxId)))
		.from(inputBoxes)
		.to([outputSwapOrder, change])
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	return unsignedTransaction;
}

export function executeSell(
	blockchainHeight: number,
	sellOrderInputBoxes: Box<Amount>[],
	paymentInputBoxes: Box<Amount>[],
	tokensFromSellContract: { tokenId: string; amount: Amount },
	ergoAsPayment: string | bigint,
	nanoErg: string | bigint = 2n * RECOMMENDED_MIN_FEE_VALUE + SAFE_MIN_BOX_VALUE
): EIP12UnsignedTransaction {
	const paymentOutputBox = new OutputBuilder(
		ergoAsPayment,
		DEPOSIT_ADDRESS
	).setAdditionalRegisters({
		R4: sellOrderInputBoxes[0].additionalRegisters.R4,
		R5: sellOrderInputBoxes[0].additionalRegisters.R5,
		R6: sellOrderInputBoxes[0].additionalRegisters.R6
	});

	let remainingSellOrderBox: any = undefined;

	const remainingTokens =
		asBigInt(tokensFromSellContract.amount) -
		asBigInt(amountByTokenId(sellOrderInputBoxes, tokensFromSellContract.tokenId));
	//console.log(remainingTokens);

	let changeErgo;

	if (remainingTokens > 0n) {
		const remainingRateBox = sellOrderInputBoxes[0]; // TODO select the proper box;
		remainingSellOrderBox = new OutputBuilder(nanoErg, DEPOSIT_ADDRESS)
			.setAdditionalRegisters(remainingRateBox.additionalRegisters)
			.addTokens({
				tokenId: tokensFromSellContract.tokenId,
				amount: remainingTokens
			});
		changeErgo =
			sumNanoErg(sellOrderInputBoxes) +
			sumNanoErg(paymentInputBoxes) -
			asBigInt(ergoAsPayment) -
			asBigInt(nanoErg) -
			RECOMMENDED_MIN_FEE_VALUE;
	} else {
		changeErgo =
			sumNanoErg(sellOrderInputBoxes) +
			sumNanoErg(paymentInputBoxes) -
			asBigInt(ergoAsPayment) -
			RECOMMENDED_MIN_FEE_VALUE;
	}

	const change = new OutputBuilder(
		sumNanoErg(sellOrderInputBoxes) +
			sumNanoErg(paymentInputBoxes) -
			asBigInt(ergoAsPayment) -
			RECOMMENDED_MIN_FEE_VALUE,
		DEPOSIT_ADDRESS
	)
		.setAdditionalRegisters({
			R4: paymentInputBoxes[0].additionalRegisters.R4,
			R5: paymentInputBoxes[0].additionalRegisters.R5
		})
		.addTokens(sumAssetsFromBoxes([...sellOrderInputBoxes, ...paymentInputBoxes]));

	const uTx = new TransactionBuilder(blockchainHeight)
		.configureSelector((selector) =>
			selector.ensureInclusion(sellOrderInputBoxes.map((b) => b.boxId))
		)
		.from([...sellOrderInputBoxes, ...paymentInputBoxes])
		.to([paymentOutputBox, change, remainingSellOrderBox].filter((x) => x) as OutputBuilder[])
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	return uTx;
}

export function createSellOrderTx(
	sellerPK: string,
	sellerMultisigAddress: string,
	inputBoxes: OneOrMore<Box<Amount>>,
	token: { tokenId: string; amount: Amount },
	sellRate: bigint,
	currentHeight: number,
	unlockHeight: number
): EIP12UnsignedTransaction {
	const output = new OutputBuilder(
		2n * RECOMMENDED_MIN_FEE_VALUE + SAFE_MIN_BOX_VALUE,
		SELL_ORDER_ADDRESS
	)
		.addTokens(token)
		.setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())),
				SGroupElement(first(ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).getPublicKeys()))
			]).toHex(),
			R5: SInt(unlockHeight).toHex(),
			R6: SColl(SByte, token.tokenId).toHex(),
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

export function canсelSellOrderTx(
	sellerPK: string,
	multisigAddress: string,
	inputBoxes: Box[],
	currentHeight: number,
	unlockHeight: number
): EIP12UnsignedTransaction {
	let mandatoryBoxes: Box[] = inputBoxes;

	const tokens = mandatoryBoxes.flatMap((box) => box.assets);
	let value = mandatoryBoxes.reduce((a: bigint, e: Box) => asBigInt(a) + asBigInt(e.value), 0n);

	if (value < SAFE_MIN_BOX_VALUE) {
		value = SAFE_MIN_BOX_VALUE;
	}

	const output = new OutputBuilder(value, multisigAddress)
		.addTokens(tokens)
		.setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())),
				SGroupElement(first(ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).getPublicKeys()))
			]).toHex(),
			R5: SInt(unlockHeight).toHex()
		});

	const unsignedTransaction = new TransactionBuilder(currentHeight)
		.configureSelector((selector) =>
			selector.ensureInclusion(mandatoryBoxes.map((b) => b.boxId))
		)
		.from([...inputBoxes, ...utxos[sellerPK]])
		.to(output)
		.sendChangeTo(sellerPK)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	return unsignedTransaction;
}
