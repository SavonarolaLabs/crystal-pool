import type { WithdrawRequestParams } from '$lib/types/request';
import { createWithdrawTx, signWithdrawTx } from './crystalPoolService';

export async function withdraw(
	params: WithdrawRequestParams,
	b: Function,
	userMnemonic: string,
	userAddress: string
): Promise<boolean> {
	try {
		const unsignedTx = await createWithdrawTx(params);
		const extractedHints = await b(unsignedTx, userMnemonic, userAddress);
		let signedTx = await signWithdrawTx(extractedHints, unsignedTx);

		// TODO: add txId and link to some history.
		console.log({ withdrawTx: signedTx });
		return true;
	} catch (e) {
		console.error(e);
		return false;
	}
}
