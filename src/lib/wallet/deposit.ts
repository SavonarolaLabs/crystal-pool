import {
	first,
	type Amount,
	type Box,
	type EIP12UnsignedTransaction,
	type OneOrMore,
	type TokenAmount
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
import { DEPOSIT_ADDRESS, SHADOWPOOL_ADDRESS } from '$lib/constants/addresses';
import { asBigInt, calcTokenChange } from '$lib/utils/helper';
import type { WithdrawRequestParams } from '$lib/types/request';

type userDeposit = {
	userPk: string;
	tokens: OneOrMore<TokenAmount<Amount>>;
	nanoErg: string | bigint;
};

export function depositMultiple(
	blockchainHeight: number,
	inputBoxes: OneOrMore<Box<Amount>>,
	changeAddress: string,
	unlockHeight: number,
	deposits: userDeposit[]
) {
	const depositBoxes: OutputBuilder[] = deposits.map((d) => {
		const depositBox = new OutputBuilder(d.nanoErg, DEPOSIT_ADDRESS)
			.setAdditionalRegisters({
				R4: SColl(SSigmaProp, [
					SGroupElement(first(ErgoAddress.fromBase58(d.userPk).getPublicKeys())),
					SGroupElement(first(ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).getPublicKeys()))
				]).toHex(),
				R5: SInt(unlockHeight).toHex()
			})
			.addTokens(d.tokens);
		return depositBox;
	});

	const unsignedTx = new TransactionBuilder(blockchainHeight)
		.from(inputBoxes)
		.to(depositBoxes)
		.sendChangeTo(changeAddress)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();

	return unsignedTx;
}

export function deposit(
	blockchainHeight: number,
	inputBoxes: OneOrMore<Box<Amount>>,
	changeAddress: string,
	userPk: string,
	unlockHeight: number,
	tokens: OneOrMore<TokenAmount<Amount>>,
	nanoErg: string | bigint = 3n * SAFE_MIN_BOX_VALUE
): EIP12UnsignedTransaction {
	const depositBox = new OutputBuilder(nanoErg, DEPOSIT_ADDRESS)
		.setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(first(ErgoAddress.fromBase58(userPk).getPublicKeys())),
				SGroupElement(first(ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).getPublicKeys()))
			]).toHex(),
			R5: SInt(unlockHeight).toHex()
		})
		.addTokens(tokens);

	const unsignedTx = new TransactionBuilder(blockchainHeight)
		.from(inputBoxes)
		.to(depositBox)
		.sendChangeTo(changeAddress)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();

	return unsignedTx;
}

export function createWithdrawTx(
	userAddress: string,
	inputBoxes: OneOrMore<Box<Amount>>,
	currentHeight: number
): EIP12UnsignedTransaction {
	const unsigned = new TransactionBuilder(currentHeight)
		.from(inputBoxes)
		.sendChangeTo(userAddress)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	return unsigned;
}

export function createWithdrawToAddressTx(
	withdrawParams: WithdrawRequestParams,
	inputBoxes: Box<Amount>[],
	currentHeight: number
): EIP12UnsignedTransaction {
	let nanoErgIn = inputBoxes.reduce((a, box) => asBigInt(box.value) + a, 0n);
	const totalTxFees = SAFE_MIN_BOX_VALUE - RECOMMENDED_MIN_FEE_VALUE;
	let nanoErgRemain = nanoErgIn - withdrawParams.value - totalTxFees;

	let unsignedTx;
	if (nanoErgRemain >= SAFE_MIN_BOX_VALUE) {
		let backToDepositBox = new OutputBuilder(nanoErgRemain, DEPOSIT_ADDRESS)
			.setAdditionalRegisters({
				R4: inputBoxes[0].additionalRegisters.R4,
				R5: inputBoxes[0].additionalRegisters.R5
			})
			.addTokens(calcTokenChange(inputBoxes, withdrawParams.tokens));

		unsignedTx = new TransactionBuilder(currentHeight)
			.from(inputBoxes)
			.to(backToDepositBox)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.sendChangeTo(withdrawParams.withdrawAddress)
			.build()
			.toEIP12Object();
	} else {
		unsignedTx = new TransactionBuilder(currentHeight)
			.from(inputBoxes)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.sendChangeTo(withdrawParams.withdrawAddress)
			.build()
			.toEIP12Object();
	}

	return unsignedTx;
}
