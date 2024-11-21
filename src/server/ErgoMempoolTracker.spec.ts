import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErgoMempoolTracker } from './ErgoMempoolTracker';
import { db_addMempoolTxId, db_setMempoolTxIds } from './db/db';
import { checkIfTransactionIsProxyDeposit } from './crystalPool';

vi.mock('./db/db', () => ({
	db_addMempoolTxId: vi.fn(),
	db_setMempoolTxIds: vi.fn()
}));

vi.mock('./crystalPool', () => ({
	checkIfTransactionIsProxyDeposit: vi.fn()
}));

describe('ErgoMempoolTracker with real fetch', () => {
	let ioMock: any;
	let dbMock: any;
	let tracker: ErgoMempoolTracker;

	beforeEach(() => {
		ioMock = { emit: vi.fn() };
		dbMock = { mempoolTxIds: new Set<string>() };
		tracker = new ErgoMempoolTracker(ioMock, dbMock, 'http://213.239.193.208:9053', 1000);
		vi.useFakeTimers();
	});

	it('should perform real fetches and populate the initial mempool', async () => {
		await tracker.start();

		// Since we don't mock fetch, actual requests will be made. Ensure your test network is accessible.
		expect(db_setMempoolTxIds).toHaveBeenCalled();
		expect(db_setMempoolTxIds.mock.calls[0][1]).toBeInstanceOf(Array);

		console.log('Fetched transaction IDs:', db_setMempoolTxIds.mock.calls[0][1]);
	});

	it('should fetch updates and emit mempool size', async () => {
		const realFetchSpy = vi.spyOn(global, 'fetch');

		tracker['lastSeenMessageTime'] = 0; // Ensure updates will be triggered
		await tracker['checkForUpdates']();

		expect(realFetchSpy).toHaveBeenCalled();
		expect(ioMock.emit).toHaveBeenCalledWith('mempoolSize', expect.any(Number));
		realFetchSpy.mockRestore();
	});

	it('should handle new transactions in mempool', async () => {
		const tx = { id: 'realTxId' }; // Example transaction
		await tracker['processMempoolTransaction'](tx);

		expect(db_addMempoolTxId).toHaveBeenCalledWith(dbMock, 'realTxId');
		expect(checkIfTransactionIsProxyDeposit).toHaveBeenCalledWith(tx, dbMock, ioMock);
	});
});
