import type { SignedTransaction } from '@fleet-sdk/common';
import { deposit } from './deposit';

export async function depositWithConnectedWallet(
	crystalWalletPk,
	nanoErg,
	tokens
): Promise<SignedTransaction> {
	const blockchainHeight = await ergo.get_current_height();
	const inputBoxes = await ergo.get_utxos();
	const changeAddress = await ergo.get_change_address();
	const userPk = crystalWalletPk;
	const unlockHeight = 1_400_000;

	const unsignedTx = deposit(
		blockchainHeight,
		inputBoxes,
		changeAddress,
		userPk,
		unlockHeight,
		tokens,
		nanoErg
	);
	const signedTx: SignedTransaction = await ergo.sign_tx(unsignedTx);
	return signedTx;
}
