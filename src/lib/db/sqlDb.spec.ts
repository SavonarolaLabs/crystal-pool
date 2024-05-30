// tests/sqlDb.test.ts
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import sqlDb from './sqlDb';

beforeAll(() => {
  sqlDb.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)');
});

afterEach(() => {
  sqlDb.exec('DELETE FROM test');
});

describe('Database Tests', () => {
  it('should verify the table was created', () => {
    const stmt = sqlDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='test'");
    const result = stmt.get();
    expect(result).not.toBeUndefined();
  });

  it('should insert and retrieve a row', () => {
    const insert = sqlDb.prepare('INSERT INTO test (name) VALUES (?)');
    insert.run('Alice');

    const select = sqlDb.prepare('SELECT * FROM test WHERE name = ?');
    const row = select.get('Alice');
    expect(row).toEqual({ id: 1, name: 'Alice' });
  });
});
