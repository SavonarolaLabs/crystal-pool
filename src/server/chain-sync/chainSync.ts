import { db_addBoxRowNoIdList, type BoxDB } from '../db/db';
import { parseBoxes } from '../parser/boxParser';
import { fetchCrystalPoolUtxo } from './fetchCrystalPoolUtxo';

export async function syncDbCrystalPoolState(db: BoxDB) {
	// sync from 0
	const dbIsEmpty = db.boxRows.length == 0;
	// sync afer restart/downtime

	if (dbIsEmpty) {
		const utxoSet = await fetchCrystalPoolUtxo();
		const boxRows = parseBoxes(utxoSet);
		db_addBoxRowNoIdList(db, boxRows);
	}
}
