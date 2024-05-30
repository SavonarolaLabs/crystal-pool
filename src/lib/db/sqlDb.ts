import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import type { BoxRow, SerializedBoxRow } from '$lib/types/boxRow';

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
    box: JSON.stringify(boxRow.box),
    parameters: JSON.stringify(boxRow.parameters)
  };
}

export async function insertBox(boxRow: BoxRow): Promise<void> {
  const serializedBoxRow = serializeBoxRow(boxRow);
  const { id, box, contract, parameters, unspent } = serializedBoxRow;
  await sqlDb.run(
    `INSERT OR IGNORE INTO boxes (id, box, contractType, parameters, unspent)
     VALUES (?, ?, ?, ?, ?)`,
    id, box, contract, parameters, unspent
  );
}

export async function insertMultipleBoxes(boxRows: BoxRow[]): Promise<void> {
  const stmt = await sqlDb.prepare(`
    INSERT OR IGNORE INTO boxes (id, box, contractType, parameters, unspent)
    VALUES (?, ?, ?, ?, ?)
  `);

  await sqlDb.transaction(async (rows: BoxRow[]) => {
    for (const row of rows) {
      const serializedRow = serializeBoxRow(row);
      await stmt.run(serializedRow.id, serializedRow.box, serializedRow.contract, serializedRow.parameters, serializedRow.unspent);
    }
  })(boxRows);
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
    unspent: row.unspent
  }));
}
