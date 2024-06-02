import { DEPOSIT_ADDRESS } from '$lib/constants/addresses';
import { decodeR4 } from '$lib/db/db';
import type { Box, EIP12UnsignedTransaction, SignedTransaction } from '@fleet-sdk/common';
import { ErgoAddress } from '@fleet-sdk/core';

export function boxAtAddress(tx: SignedTransaction, address: string): Box {
	return tx.outputs.find((o) => o.ergoTree == ErgoAddress.fromBase58(address).ergoTree)!;
}

export function boxesAtAddress(tx: SignedTransaction, address: string): Box[] {
	return tx.outputs.filter((o) => o.ergoTree == ErgoAddress.fromBase58(address).ergoTree);
}

export function boxesFromAddress(tx: SignedTransaction, address: string): Box[] {
	return tx.inputs.filter((o) => o.ergoTree == ErgoAddress.fromBase58(address).ergoTree);
}

export function boxesAtAddressUnsigned(tx: EIP12UnsignedTransaction, address: string) {
	return tx.outputs.filter((o) => o.ergoTree == ErgoAddress.fromBase58(address).ergoTree);
}

export function getDepositsBoxesByAddress(allBoxes: Box[], address: string) {
	const depositBoxes = allBoxes.filter(
		(b) => b.ergoTree == ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree
	);
	const addressBoxes = depositBoxes.filter((b) => decodeR4(b)?.userPk == address);
	return addressBoxes;
}

export function updateContractBoxes(
	tx: SignedTransaction,
	oldBoxes: Box[],
	contract: string
): Box[] {
	const boxesToDelete = boxesFromAddress(tx, contract);
	const boxesToAdd = boxesAtAddress(tx, contract);
	let newBoxes = oldBoxes?.filter((b) => !boxesToDelete.some((d) => d.boxId == b.boxId));
	if (!newBoxes) {
		newBoxes = boxesToAdd;
	} else {
		newBoxes.push(...boxesToAdd);
	}
	return newBoxes;
}
