import { fetchUnconfirmedTransactionFromErgoNode } from '$lib/external/transaction';
import type { TransactionNode } from '$lib/types/node';
import type { Server } from 'socket.io';
import WebSocket from 'ws';
import { checkIfTransactionIsProxyDeposit } from './crystalPool';
import { db_addMempoolTxId, db_setMempoolTxIds, type BoxDB } from './db/db';

async function fetchMempoolTransactions(offset: number = 0): Promise<TransactionNode[]> {
	try {
		const response = await fetch(
			`http://213.239.193.208:9053/transactions/unconfirmed?limit=100&offset=${offset}`
		);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return (await response.json()) as TransactionNode[];
	} catch (error) {
		console.error('Error fetching mempool transactions:', error);
		return [];
	}
}

async function populateInitialSet(io: Server, db: BoxDB): Promise<void> {
	let offset = 0;
	let transactions: TransactionNode[];
	let txIds: string[] = [];
	do {
		transactions = await fetchMempoolTransactions(offset);
		transactions.forEach((tx) => {
			checkIfTransactionIsProxyDeposit(tx, db, io);
		});
		txIds = [...txIds, ...transactions.map((tx) => tx.id)];
		offset += 100;
	} while (transactions.length === 100);

	db_setMempoolTxIds(db, txIds);
	console.log(`Initial mempool size: ${getMempoolSize(db)}`);
}

async function handleNewBlock(io: Server, db: BoxDB): Promise<void> {
	console.log('New block');
	await populateInitialSet(io, db);
}

async function handleNewTransaction(io: Server, db: BoxDB, txId: string): Promise<void> {
	db_addMempoolTxId(db, txId);
	console.log(`Mempool size changed: ${getMempoolSize(db)}`);
	console.log(`${txId}`);
	let tx = await fetchUnconfirmedTransactionFromErgoNode(txId);

	setTimeout(async () => {
		if (tx) {
			checkIfTransactionIsProxyDeposit(tx, db, io);
		} else {
			console.log('WARNING: transaction was NOT fetched');
		}
	}, 2000);
}

function getMempoolSize(db: BoxDB): number {
	return db.mempoolTxIds.size;
}

export async function run(io: Server, db: BoxDB): Promise<void> {
	await populateInitialSet(io, db);

	const ws = new WebSocket('ws://localhost:9060');
	ws.on('open', () => {
		console.log('WebSocket client connected to port 9060');
	});

	ws.on('message', async (message) => {
		const [topic, msgStr] = message.toString().split(' ');

		if (topic === 'newBlock') {
			handleNewBlock(io, db);
		} else if (topic === 'mempool') {
			await handleNewTransaction(io, db, msgStr);
		}

		io.emit('mempoolSize', getMempoolSize(db));
	});
}
