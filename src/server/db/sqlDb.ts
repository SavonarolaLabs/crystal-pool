import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import type { BoxRow, SerializedBoxRow } from '../../lib/types/boxRow';
import { serializeBigInt } from '../../lib/utils/serializeBigInt';

export async function initializeDatabase(filename: string): Promise<Database> {
	const db = await open({
		filename,
		driver: sqlite3.Database
	});

	await db.exec(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS boxes (
            id INTEGER PRIMARY KEY,
            box TEXT NOT NULL,
            contractType TEXT CHECK(contractType IN ('DEPOSIT', 'BUY', 'SELL', 'SWAP', 'UNKNOWN')),
            parameters TEXT NOT NULL,
            spent BOOLEAN NOT NULL
        )
    `);

	return db;
}

export let sqlDb: Database;

export async function init(filename: string = 'chain.db'): Promise<void> {
	sqlDb = await initializeDatabase(filename);
}

function serializeBoxRow(boxRow: BoxRow): SerializedBoxRow {
	return {
		...boxRow,
		box: serializeBigInt(boxRow.box),
		parameters: serializeBigInt(boxRow.parameters)
	};
}

export async function persistBox(boxRow: BoxRow): Promise<void> {
	const serializedBoxRow = serializeBoxRow(boxRow);
	const { id, box, contract, parameters, spent } = serializedBoxRow;
	await sqlDb.run(
		`INSERT OR IGNORE INTO boxes (id, box, contractType, parameters, spent)
         VALUES (?, ?, ?, ?, ?)`,
		id,
		box,
		contract,
		parameters,
		spent ? 1 : 0
	);
}

export async function persistMultipleBoxes(boxRows: BoxRow[]): Promise<void> {
	await sqlDb.exec('BEGIN TRANSACTION');
	try {
		for (const row of boxRows) {
			const serializedRow = serializeBoxRow(row);
			await sqlDb.run(
				`INSERT OR IGNORE INTO boxes (id, box, contractType, parameters, spent)
                 VALUES (?, ?, ?, ?, ?)`,
				serializedRow.id,
				serializedRow.box,
				serializedRow.contract,
				serializedRow.parameters,
				serializedRow.spent ? 1 : 0
			);
		}
		await sqlDb.exec('COMMIT');
	} catch (error) {
		await sqlDb.exec('ROLLBACK');
		throw error;
	}
}

export async function markBoxesAsSpent(boxRows: BoxRow[]): Promise<void> {
	await sqlDb.exec('BEGIN TRANSACTION');
	try {
		for (const row of boxRows) {
			await sqlDb.run(`UPDATE boxes SET spent = 1 WHERE id = ?`, row.id);
		}
		await sqlDb.exec('COMMIT');
	} catch (error) {
		await sqlDb.exec('ROLLBACK');
		throw error;
	}
}

export async function loadBoxRows(): Promise<BoxRow[]> {
	const rows = await sqlDb.all(`
        SELECT id, box, contractType AS contract, parameters, spent FROM boxes
    `);

	return rows.map(
		(row: {
			id: number;
			box: string;
			contract: string;
			parameters: string;
			spent: boolean;
		}) => {
			const parsedBox = JSON.parse(row.box);
			return {
				id: row.id,
				box: { ...parsedBox, value: parsedBox.value ? BigInt(parsedBox.value) : 0n },
				contract: row.contract as BoxRow['contract'],
				parameters: JSON.parse(row.parameters),
				spent: Boolean(row.spent)
			};
		}
	);
}

export async function deleteMultipleBoxes(ids: number[]): Promise<void> {
	if (ids.length === 0) return;
	const placeholders = ids.map(() => '?').join(',');
	await sqlDb.run(`DELETE FROM boxes WHERE id IN (${placeholders})`, ids);
}

export async function deleteAllBoxes(): Promise<void> {
	await sqlDb.run(`DELETE FROM boxes`);
}
