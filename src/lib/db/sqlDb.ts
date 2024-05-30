import Database from 'better-sqlite3';
import type { BoxRow, SerializedBoxRow } from '$lib/types/boxRow';

const sqlDb = new Database('chain.db');
sqlDb.pragma('journal_mode = WAL');

sqlDb.exec(`
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

export function insertBox(boxRow: BoxRow): void {
  const serializedBoxRow = serializeBoxRow(boxRow);
  const { id, box, contract, parameters, unspent } = serializedBoxRow;
  const stmt = sqlDb.prepare(`
    INSERT OR IGNORE INTO boxes (id, box, contractType, parameters, unspent)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, box, contract, parameters, unspent);
}

export function insertMultipleBoxes(boxRows: BoxRow[]): void {
  const insert = sqlDb.prepare(`
    INSERT OR IGNORE INTO boxes (id, box, contractType, parameters, unspent)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = sqlDb.transaction((rows: BoxRow[]) => {
    for (const row of rows) {
      const serializedRow = serializeBoxRow(row);
      insert.run(serializedRow.id, serializedRow.box, serializedRow.contract, serializedRow.parameters, serializedRow.unspent);
    }
  });

  insertMany(boxRows);
}

export default sqlDb;
