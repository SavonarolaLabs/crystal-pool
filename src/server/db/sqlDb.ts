import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import type { BoxRow, SerializedBoxRow } from '../../lib/types/boxRow';
import { serializeBigInt } from '../../lib/utils/serializeBigInt';

export async function initializeDatabase(filename: string): Promise<Database> {
	console.log('Opening database connection...');
	const db = await open({
		filename,
		driver: sqlite3.Database
	});

	await db.exec(`
		PRAGMA journal_mode = WAL;
		CREATE TABLE IF NOT EXISTS boxes (
			id TEXT PRIMARY KEY,
			box TEXT NOT NULL,
			contractType TEXT NOT NULL,
			parameters TEXT NOT NULL,
			spent BOOLEAN NOT NULL
		)
	`);

	return db;
}

export let sqlDb: Database | null = null;

export async function init(filename: string = 'chain.db'): Promise<void> {
	sqlDb = await initializeDatabase(filename);
}

export async function closeDb(): Promise<void> {
	if (sqlDb) {
		try {
			console.log('Closing the database connection...');
			await sqlDb.close();
			sqlDb = null;
			console.log('Database connection closed.');
		} catch (error) {
			console.error('Failed to close the database connection:', error);
		}
	} else {
		console.log('No database connection to close.');
	}
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

	try {
		const result = await sqlDb.run(
			`INSERT OR IGNORE INTO boxes (id, box, contractType, parameters, spent)
			VALUES (?, ?, ?, ?, ?)`,
			id,
			box,
			contract,
			parameters,
			spent ? 1 : 0
		);

		if (result.changes > 0) {
			console.log(`Box with ID ${id} was persisted successfully.`);
			console.log(
				`Contract: ${contract}, Spent: ${spent}, Parameters: ${JSON.stringify(parameters)}`
			);
		} else {
			console.log(`Box with ID ${id} was not persisted (it might already exist).`);
		}
	} catch (error) {
		console.error(`Error occurred while persisting box with ID ${id}:`, error);
		throw error;
	}
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
	let updatedCount = 0;
	try {
		for (const row of boxRows) {
			const result = await sqlDb.run(`UPDATE boxes SET spent = 1 WHERE id = ?`, row.id);
			if (result.changes > 0) {
				updatedCount++;
			}
		}
		await sqlDb.exec('COMMIT');
		console.log(`Successfully updated ${updatedCount} box(es) as spent.`);
	} catch (error) {
		await sqlDb.exec('ROLLBACK');
		console.error('Error occurred while updating boxes as spent:', error);
		throw error;
	}
}

export async function loadBoxRows(): Promise<BoxRow[]> {
	const rows = await sqlDb.all(`
        SELECT id, box, contractType AS contract, parameters, spent FROM boxes
    `);

	return rows.map(
		(row: {
			id: string;
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

export async function deleteMultipleBoxes(ids: string[]): Promise<void> {
	if (ids.length === 0) return;
	const placeholders = ids.map(() => '?').join(',');
	await sqlDb.run(`DELETE FROM boxes WHERE id IN (${placeholders})`, ids);
}

export async function deleteAllBoxes(): Promise<void> {
	await sqlDb.run(`DELETE FROM boxes`);
}
