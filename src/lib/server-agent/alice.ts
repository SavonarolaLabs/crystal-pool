import { ALICE_ADDRESS } from '$lib/constants/addresses';
import { ALICE_MNEMONIC } from '$lib/constants/mnemonics';
import { utxos } from '$lib/data/utxos';
import { deposit } from '$lib/wallet/deposit';
import { signTx } from '$lib/wallet/multisig-server';
import type { Amount, EIP12UnsignedTransaction, OneOrMore, SignedTransaction, TokenAmount } from '@fleet-sdk/common';

export function depositAgentAlice(
	tokens: OneOrMore<TokenAmount<Amount>>,
	value: bigint
): EIP12UnsignedTransaction {
	const depositUTx = deposit(
		1277300,
		utxos[ALICE_ADDRESS], // FROM
		ALICE_ADDRESS, // ChangeAddress
		ALICE_ADDRESS, // Deposit Receiver Address
		1300000,
		tokens,
		value
	);
	return depositUTx;
}

export async function signTxAgentAlice(tx: EIP12UnsignedTransaction): Promise<SignedTransaction> {
	return await signTx(tx, ALICE_MNEMONIC);
}
