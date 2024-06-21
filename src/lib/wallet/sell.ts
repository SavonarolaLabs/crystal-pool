import { DEPOSIT_ADDRESS, SELL_ORDER_ADDRESS, SHADOWPOOL_ADDRESS } from '$lib/constants/addresses';
import { utxos } from '$lib/data/utxos';
import { asBigInt, sumNanoErg, calcTokenChange } from '$lib/utils/helper';
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
