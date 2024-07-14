import { fetchConfirmedTransaction } from '$lib/external/transaction';
import type { BoxRow } from '$lib/types/boxRow';
import type { ConfirmedTransaction } from '$lib/types/explorer';
import { db_addMempoolDepositTx, db_addUnprocessedDepositTxId, type BoxDB } from './db/db';

export async function processPotentialDespositTxId(db: BoxDB, txId: string): Promise<BoxRow[]> {
	const tx: ConfirmedTransaction | false = await fetchConfirmedTransaction(txId);
	if (tx) {
		return db_addMempoolDepositTx(db, tx);
	} else {
		db_addUnprocessedDepositTxId(db, txId);
		return [];
	}
}
