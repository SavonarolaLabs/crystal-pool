import {
	SHADOWPOOL_ADDRESS,
	SWAP_ORDER_ADDRESS
} from '$lib/constants/addresses';
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

function splitSellRate(sellRate: string): [bigint, bigint] {
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
	contractAddress: string
): EIP12UnsignedTransaction {
	const [bigRate, bigDenom] = splitSellRate(sellRate);
	console.log('BigRate:', bigRate);
	console.log('BigDenom', bigDenom);
	const output = new OutputBuilder(SAFE_MIN_BOX_VALUE, contractAddress)
		.addTokens(token)
		.setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(
					first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())
				),
				SGroupElement(
					first(
						ErgoAddress.fromBase58(
							SHADOWPOOL_ADDRESS
						).getPublicKeys()
					)
				)
			]).toHex(),
			R5: SInt(unlockHeight).toHex(),
			R6: SPair(
				SColl(SByte, sellingTokenId),
				SColl(SByte, buyingTokenId)
			).toHex(),
			R7: SLong(bigRate).toHex(),
			R8: SColl(
				SByte,
				ErgoAddress.fromBase58(sellerMultisigAddress).ergoTree
			).toHex(),
			R9: SLong(bigDenom).toHex()
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
				SGroupElement(
					first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())
				),
				SGroupElement(
					first(
						ErgoAddress.fromBase58(
							SHADOWPOOL_ADDRESS
						).getPublicKeys()
					)
				)
			]).toHex(),
			R5: SInt(unlockHeight).toHex(),
			R6: SPair(
				SColl(SByte, sellingTokenId),
				SColl(SByte, buyingTokenId)
			).toHex(),
			R7: SLong(sellRate).toHex(),
			R8: SColl(
				SByte,
				ErgoAddress.fromBase58(sellerMultisigAddress).ergoTree
			).toHex()
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
