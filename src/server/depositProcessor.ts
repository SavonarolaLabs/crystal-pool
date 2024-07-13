import { fetchTransaction } from '$lib/external/transaction';
import type { BoxRow } from '$lib/types/boxRow';
import { db_addMempoolDepositTx, db_addUnprocessedDepositTxId, type BoxDB } from './db/db';

export async function processPotentialDespositTxId(db: BoxDB, txId: string): Promise<BoxRow[]> {
	const tx = await fetchTransaction(txId);
	if (tx) {
		return db_addMempoolDepositTx(db, tx);
	} else {
		db_addUnprocessedDepositTxId(db, txId);
		return [];
	}
}
