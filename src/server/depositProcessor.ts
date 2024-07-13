import type { BoxRow } from '$lib/types/boxRow';
import { db_addMempoolDepositTx, db_addUnprocessedDepositTxId, type BoxDB } from './db/db';

async function fetchTransactionDetails(txId) {
	const url = `https://api.ergoplatform.com/api/v1/transactions/${txId}`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Error fetching transaction details: ${response.statusText}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error:', error);
		return false;
	}
}

export async function processPotentialDespositTxId(db: BoxDB, txId: string): Promise<BoxRow[]> {
	const tx = await fetchTransactionDetails(txId);
	if (tx) {
		return db_addMempoolDepositTx(db, tx);
	} else {
		db_addUnprocessedDepositTxId(db, txId);
		return [];
	}
}
