import WebSocket from 'ws';
import { db_addMempoolTxId, db_setMempoolTxIds, type BoxDB } from './db/db';

interface Transaction {
  id: string;
}

async function fetchMempoolTransactions(offset: number = 0): Promise<Transaction[]> {
  try {
    const response = await fetch(`http://213.239.193.208:9053/transactions/unconfirmed?limit=100&offset=${offset}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json() as Transaction[];
  } catch (error) {
    console.error('Error fetching mempool transactions:', error);
    return [];
  }
}

async function populateInitialSet(db:BoxDB): Promise<void> {
  let offset = 0;
  let transactions: Transaction[];
  let txIds: string[] = [];
  do {
    transactions = await fetchMempoolTransactions(offset);
    txIds = [...txIds, ...transactions.map(tx =>tx.id)];
    offset += 100;
  } while (transactions.length === 100);

  db_setMempoolTxIds(db, txIds);
  console.log(`Initial mempool size: ${getMempoolSize(db)}`);
}

async function handleNewBlock(db:BoxDB): Promise<void>  {
  console.log('New block');
  await populateInitialSet(db);
}

function handleNewTransaction(db:BoxDB, txId: string): void {
  db_addMempoolTxId(db, txId);
  console.log(`Mempool size changed: ${getMempoolSize(db)}`);
}

function getMempoolSize(db:BoxDB): number {
  return db.mempoolTxIds.size;
}

export async function run(io, db:BoxDB): Promise<void> {
  await populateInitialSet(db);

  const ws = new WebSocket('ws://localhost:9060');
  ws.on('open', () => {
    console.log("WebSocket client connected to port 9060");
  });

  ws.on('message', (message) => {
    const [topic, msgStr] = message.toString().split(' ');

    if (topic === 'newBlock') {
      handleNewBlock(db);
    } else if (topic === 'mempool') {
      handleNewTransaction(db,msgStr);
    }

    io.emit('mempoolSize', getMempoolSize(db));
  });
}
