import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import type { BoxRow, SerializedBoxRow } from '../../lib/types/boxRow';
import { serializeBigInt } from './serializeBigInt';

export const sqlDb = await open({
    filename: 'chain.db',
    driver: sqlite3.Database
});

await sqlDb.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS boxes (
        id INTEGER PRIMARY KEY,
        box TEXT NOT NULL,
        contractType TEXT CHECK(contractType IN ('DEPOSIT', 'BUY', 'SELL', 'SWAP', 'UNKNOWN')),
        parameters TEXT NOT NULL,
        unspent BOOLEAN NOT NULL
    )
`);

function serializeBoxRow(boxRow: BoxRow): SerializedBoxRow {
    return {
        ...boxRow,
        box: serializeBigInt(boxRow.box),
        parameters: serializeBigInt(boxRow.parameters)
    };
}

export async function persistBox(boxRow: BoxRow): Promise<void> {
    const serializedBoxRow = serializeBoxRow(boxRow);
    const { id, box, contract, parameters, unspent } = serializedBoxRow;
    await sqlDb.run(
        `INSERT OR IGNORE INTO boxes (id, box, contractType, parameters, unspent)
         VALUES (?, ?, ?, ?, ?)`,
        id, box, contract, parameters, unspent ? 1 : 0  // Ensure boolean is stored as integer
    );
}

export async function persistMultipleBoxes(boxRows: BoxRow[]): Promise<void> {
    await sqlDb.exec('BEGIN TRANSACTION');
    try {
        for (const row of boxRows) {
            const serializedRow = serializeBoxRow(row);
            await sqlDb.run(
                `INSERT OR IGNORE INTO boxes (id, box, contractType, parameters, unspent)
                 VALUES (?, ?, ?, ?, ?)`,
                serializedRow.id, serializedRow.box, serializedRow.contract, serializedRow.parameters, serializedRow.unspent ? 1 : 0  // Ensure boolean is stored as integer
            );
        }
        await sqlDb.exec('COMMIT');
    } catch (error) {
        await sqlDb.exec('ROLLBACK');
        throw error;
    }
}

export async function loadBoxRows(): Promise<BoxRow[]> {
    const rows = await sqlDb.all(`
        SELECT id, box, contractType AS contract, parameters, unspent FROM boxes
    `);

    return rows.map((row: { id: number; box: string; contract: string; parameters: string; unspent: boolean }) => ({
        id: row.id,
        box: JSON.parse(row.box),
        contract: row.contract as BoxRow['contract'],
        parameters: JSON.parse(row.parameters),
        unspent: Boolean(row.unspent)  // Ensure boolean is converted back from integer
    }));
}

export async function deleteMultipleBoxes(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await sqlDb.run(`DELETE FROM boxes WHERE id IN (${placeholders})`, ids);
}

export async function deleteAllBoxes(): Promise<void> {
    await sqlDb.run(`DELETE FROM boxes`);
}