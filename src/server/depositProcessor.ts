import { db_addUnprocessedDepositTxId, type BoxDB } from './db/db';

export function processPotentialDespositTxId(db: BoxDB, txId: string) {
	if (db.mempoolTxIds.has(txId)) {
		initDepositByTxId(txId);
	} else {
		db_addUnprocessedDepositTxId(db, txId);
	}
}

export function initDepositByTxId(txId: string) {
	throw new Error('initDepositByTxId: NOT implemented');
}
