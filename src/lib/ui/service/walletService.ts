import type { WithdrawRequestParams } from '$lib/types/request';
import { createWithdrawTx } from './crystalPoolService';

export async function withdraw(params: WithdrawRequestParams): Promise<boolean> {
	// 1. ask pool for withdraw tx
	const tx = await createWithdrawTx(params);
	// 2. partial sign withdrawal tx
	// 3. send partial sign withdrawal tx
	// 4. receive tx id, add it to history, update state

	return true;
}
