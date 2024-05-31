import type { Box, EIP12UnsignedTransaction, SignedTransaction } from "@fleet-sdk/common";
import { ErgoAddress } from "@fleet-sdk/core";

export function boxAtAddress(
	tx: SignedTransaction,
	address: string
): Box {
	return tx.outputs.find(
		(o) => o.ergoTree == ErgoAddress.fromBase58(address).ergoTree
	)!;
}

export function boxesAtAddress(
	tx: SignedTransaction,
	address: string
): Box[] {
	return tx.outputs.filter(
		(o) => o.ergoTree == ErgoAddress.fromBase58(address).ergoTree
	);
}

export function boxesAtAddressUnsigned(
	tx: EIP12UnsignedTransaction,
	address: string
) {
	return tx.outputs.filter(
		(o) => o.ergoTree == ErgoAddress.fromBase58(address).ergoTree
	);
}