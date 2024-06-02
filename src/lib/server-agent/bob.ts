import { BOB_ADDRESS, DEPOSIT_ADDRESS } from "$lib/constants/addresses";
import { BOB_MNEMONIC } from "$lib/constants/mnemonics";
import { utxos } from "$lib/data/utxos";
import { boxesAtAddress } from "$lib/utils/test-helper";
import { deposit } from "$lib/wallet/deposit";
import { signTx } from "$lib/wallet/multisig-server";
import type { Amount, EIP12UnsignedTransaction, OneOrMore, SignedTransaction, TokenAmount } from "@fleet-sdk/common";

export function depositAgentBob(
	tokens: OneOrMore<TokenAmount<Amount>>,
	value: bigint
): EIP12UnsignedTransaction {
	const depositUTx = deposit(
		1277300,
		utxos[BOB_ADDRESS], // FROM
		BOB_ADDRESS, // ChangeAddress
		BOB_ADDRESS, // Deposit Receiver Address
		1300000,
		tokens,
		value
	);
	return depositUTx;
}

export async function signTxAgentBob(tx: EIP12UnsignedTransaction): Promise<SignedTransaction> {
	return await signTx(tx, BOB_MNEMONIC);
}

export async function depositBob(token: OneOrMore<TokenAmount<Amount>>, value:bigint){
	const depositUTxBob = depositAgentBob(token, value);
	const depositTxBob = await signTxAgentBob(depositUTxBob);
	return boxesAtAddress(depositTxBob, DEPOSIT_ADDRESS)
}