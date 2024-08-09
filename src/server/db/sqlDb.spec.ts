import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { init, persistBox, loadBoxRows, deleteAllBoxes, sqlDb } from './sqlDb'; // Adjust the path if necessary
import type { BoxRow } from '$lib/types/boxRow';
import { BOB_ADDRESS, SHADOWPOOL_ADDRESS } from '$lib/constants/addresses';

describe('persistBox', () => {
	const testDbFile = 'test-sqlDb.db';

	const boxRow: BoxRow = {
		id: 1,
		box: {
			index: 0,
			transactionId: 'tx1',
			creationHeight: 123,
			boxId: 'box1',
			value: 1000n,
			ergoTree: '',
			assets: [],
			additionalRegisters: {}
		},
		contract: 'DEPOSIT',
		parameters: { userPk: BOB_ADDRESS, poolPk: SHADOWPOOL_ADDRESS, unlockHeight: 1_400_00 },
		spent: false
	};

	beforeAll(async () => {
		await init(testDbFile);
	});

	beforeEach(async () => {
		await deleteAllBoxes();
	});

	afterAll(async () => {
		await sqlDb.close();
	});

	it('should start with an empty database', async () => {
		const storedBoxes = await loadBoxRows();
		expect(storedBoxes).toHaveLength(0);
	});

	it('should persist a box row and retrieve it', async () => {
		await persistBox(boxRow);

		const storedBoxes = await loadBoxRows();
		expect(storedBoxes).toHaveLength(1);
		expect(storedBoxes[0]).toEqual(boxRow);
	});

	it('should ignore duplicate box rows', async () => {
		await persistBox(boxRow);
		await persistBox(boxRow);

		const storedBoxes = await loadBoxRows();
		expect(storedBoxes).toHaveLength(1);
		expect(storedBoxes[0]).toEqual(boxRow);
	});
});
