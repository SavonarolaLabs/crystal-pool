import { fetchUnconfirmedTransactionFromErgoNode } from '$lib/external/transaction';
import type { TransactionNode } from '$lib/types/node';
import type { Server } from 'socket.io';
import { checkIfTransactionIsProxyDeposit } from './crystalPool';
import { db_addMempoolTxId, db_setMempoolTxIds, type BoxDB } from './db/db';

interface NodeInfo {
	lastSeenMessageTime: number;
	height: number;
}

export class ErgoMempoolTracker {
	private io: Server;
	private db: BoxDB;
	private nodeUrl: string;
	private pollingInterval: number;
	private lastSeenMessageTime: number = 0;
	private lastProcessedHeight: number = 0;
	private pollingTimer: NodeJS.Timeout | null = null;

	constructor(
		io: Server,
		db: BoxDB,
		nodeUrl: string = 'http://213.239.193.208:9053',
		pollingInterval: number = 5000
	) {
		this.io = io;
		this.db = db;
		this.nodeUrl = nodeUrl;
		this.pollingInterval = pollingInterval;
	}

	async start(): Promise<void> {
		await this.populateInitialSet();
		this.startPolling();
	}

	stop(): void {
		if (this.pollingTimer) {
			clearTimeout(this.pollingTimer);
		}
	}

	private startPolling(): void {
		this.pollingTimer = setInterval(async () => {
			try {
				await this.checkForUpdates();
			} catch (error) {
				console.error('Error during mempool update:', error);
			}
		}, this.pollingInterval);
	}

	private async fetchNodeInfo(): Promise<NodeInfo> {
		const response = await fetch(`${this.nodeUrl}/info`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return (await response.json()) as NodeInfo;
	}

	private async fetchMempoolTransactions(offset: number = 0): Promise<TransactionNode[]> {
		try {
			const response = await fetch(
				`${this.nodeUrl}/transactions/unconfirmed?limit=10000&offset=${offset}`
			);
			if (!response.ok) {
				console.error(`HTTP error! status: ${response.status}`);
				return [];
			}
			return (await response.json()) as TransactionNode[];
		} catch (error) {
			console.error('Error fetching mempool transactions:', error);
			return [];
		}
	}

	private async populateInitialSet(): Promise<void> {
		let offset = 0;
		let transactions: TransactionNode[];
		let txIds: string[] = [];
		do {
			transactions = await this.fetchMempoolTransactions(offset);
			for (const tx of transactions) {
				await this.processMempoolTransaction(tx);
			}
			txIds = [...txIds, ...transactions.map((tx) => tx.id)];
			offset += 10000;
		} while (transactions.length === 10000);

		db_setMempoolTxIds(this.db, txIds);

		// Get initial node info for baseline
		const nodeInfo = await this.fetchNodeInfo();
		this.lastSeenMessageTime = nodeInfo.lastSeenMessageTime;
		this.lastProcessedHeight = nodeInfo.height;

		console.log(`Mempool(${this.getMempoolSize()}) reset`);
	}

	private async checkForUpdates(): Promise<void> {
		const nodeInfo = await this.fetchNodeInfo();

		// Check if block height has changed (indicates new block)
		if (nodeInfo.height !== this.lastProcessedHeight) {
			await this.handleNewBlock(nodeInfo.height);
			this.lastProcessedHeight = nodeInfo.height;
		}

		// Check if lastSeenMessageTime has changed (indicates new mempool activity)
		if (nodeInfo.lastSeenMessageTime !== this.lastSeenMessageTime) {
			await this.refreshMempool();
			this.lastSeenMessageTime = nodeInfo.lastSeenMessageTime;
		}

		// Emit current mempool size
		this.io.emit('mempoolSize', this.getMempoolSize());
	}

	private async handleNewBlock(newHeight: number): Promise<void> {
		console.log(`New block at height ${newHeight}`);
		await this.populateInitialSet();
	}

	private async refreshMempool(): Promise<void> {
		let offset = 0;
		let transactions: TransactionNode[];
		const currentTxIds = new Set(this.db.mempoolTxIds);

		do {
			transactions = await this.fetchMempoolTransactions(offset);
			for (const tx of transactions) {
				if (!currentTxIds.has(tx.id)) {
					await this.processMempoolTransaction(tx);
				}
			}
			offset += 10000;
		} while (transactions.length === 10000);
	}

	private async processMempoolTransaction(tx: TransactionNode): Promise<void> {
		db_addMempoolTxId(this.db, tx.id);
		await checkIfTransactionIsProxyDeposit(tx, this.db, this.io);
	}

	private getMempoolSize(): number {
		return this.db.mempoolTxIds.size;
	}
}

export async function run(io: Server, db: BoxDB): Promise<void> {
	const mempoolTracker = new ErgoMempoolTracker(io, db);
	await mempoolTracker.start();
}
