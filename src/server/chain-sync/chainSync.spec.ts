import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { db_clearDB, db_closeDB, initDb, type BoxDB } from '../db/db';
import { mockDataFetchCrystalPoolUtxo } from '../testdata/mockDataFetchCrystalPoolUtxo';
import { syncDbCrystalPoolState } from './chainSync';
import { fetchCrystalPoolUtxo } from './fetchCrystalPoolUtxo';

vi.mock('./fetchCrystalPoolUtxo', () => ({
	fetchCrystalPoolUtxo: vi.fn()
}));

const chainSyncDb = 'chainSyncDb.db';
let db: BoxDB;

describe('chainSync', () => {
	beforeAll(async () => {
		vi.mocked(fetchCrystalPoolUtxo).mockResolvedValue(mockDataFetchCrystalPoolUtxo);
		db = await initDb(chainSyncDb);
		await db_clearDB(db);
	});

	afterAll(async () => {
		await db_closeDB();
	});

	it('should init db with utxo', async () => {
		expect(db.boxRows.length).toBe(0);
		await syncDbCrystalPoolState(db);
		expect(db.boxRows.length).toBe(29);
	});
});
