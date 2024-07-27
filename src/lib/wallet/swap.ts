import { DEPOSIT_ADDRESS, SHADOWPOOL_ADDRESS, SWAP_ORDER_ADDRESS } from '$lib/constants/addresses';
import { first, type Amount, type Box, type EIP12UnsignedTransaction } from '@fleet-sdk/common';
import {
	ErgoAddress,
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	SAFE_MIN_BOX_VALUE,
	SColl,
	SGroupElement,
	SSigmaProp,
	TransactionBuilder
} from '@fleet-sdk/core';
import { SByte, SLong, SPair } from '@fleet-sdk/serializer';

import { amountByTokenId, asBigInt, calcTokenChange, sumNanoErg } from '$lib/utils/helper';
import { splitRateStringToNumDenom } from '$lib/tests/rateUtils';

export function createSwapOrderTx(
	makerPK: string,
	makerDepositBoxes: Box[],
	nanoErg: bigint,
	makerToken: { tokenId: string; amount: Amount },
	takerTokenId: string,
	price: string,
	currentHeight: number
): EIP12UnsignedTransaction {
	const inputBoxes = makerDepositBoxes;
	const [numerator, denominator] = splitRateStringToNumDenom(price);

	const outputSwapOrder = new OutputBuilder(nanoErg, SWAP_ORDER_ADDRESS)
		.addTokens(makerToken)
		.setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(first(ErgoAddress.fromBase58(makerPK).getPublicKeys())),
				SGroupElement(first(ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).getPublicKeys()))
			]).toHex(),
			R5: inputBoxes[0].additionalRegisters.R5!,
			R6: SPair(SColl(SByte, makerToken.tokenId), SColl(SByte, takerTokenId)).toHex(),
			R7: SColl(SLong, [numerator, denominator]).toHex(),
			R8: SColl(SByte, ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree).toHex()
		});

	// TODO: make change conditional
	const change = new OutputBuilder(
		sumNanoErg(inputBoxes) - asBigInt(nanoErg) - RECOMMENDED_MIN_FEE_VALUE,
		DEPOSIT_ADDRESS
	)
		.setAdditionalRegisters({
			R4: inputBoxes[0].additionalRegisters.R4,
			R5: inputBoxes[0].additionalRegisters.R5
		})
		.addTokens(calcTokenChange([...inputBoxes], [makerToken]));

	const unsignedTransaction = new TransactionBuilder(currentHeight)
		.configureSelector((selector) => selector.ensureInclusion(inputBoxes.map((b) => b.boxId)))
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
	const paymentOutputBox = new OutputBuilder(nanoErg, DEPOSIT_ADDRESS)
		.setAdditionalRegisters({
			R4: swapOrderInputBoxes[0].additionalRegisters.R4,
			R5: swapOrderInputBoxes[0].additionalRegisters.R5,
			R6: swapOrderInputBoxes[0].additionalRegisters.R6
		})
		.addTokens(tokensAsPayment);

	let remainingSwapOrderBox: any = undefined;
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
			calcTokenChange([...swapOrderInputBoxes, ...paymentInputBoxes], [tokensAsPayment])
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
