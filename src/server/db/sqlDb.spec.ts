import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
	init,
	persistBox,
	loadBoxRows,
	deleteAllBoxes,
	sqlDb,
	persistMultipleBoxes,
	markBoxesAsSpent,
	deleteMultipleBoxes
} from './sqlDb';
import type { BoxRow } from '$lib/types/boxRow';
import { BOB_ADDRESS, SHADOWPOOL_ADDRESS } from '$lib/constants/addresses';

describe('sqlDb', () => {
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

	const boxRow2: BoxRow = {
		id: 2,
		box: {
			index: 1,
			transactionId: 'tx2',
			creationHeight: 124,
			boxId: 'box2',
			value: 2000n,
			ergoTree: '',
			assets: [],
			additionalRegisters: {}
		},
		contract: 'DEPOSIT',
		parameters: { userPk: BOB_ADDRESS, poolPk: SHADOWPOOL_ADDRESS, unlockHeight: 1_500_00 },
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

	it('should persist multiple box rows and retrieve them', async () => {
		await persistMultipleBoxes([boxRow, boxRow2]);

		const storedBoxes = await loadBoxRows();
		expect(storedBoxes).toHaveLength(2);
		expect(storedBoxes).toContainEqual(boxRow);
		expect(storedBoxes).toContainEqual(boxRow2);
	});

	it('should mark boxes as spent', async () => {
		await persistMultipleBoxes([boxRow, boxRow2]);

		let storedBoxes = await loadBoxRows();
		expect(storedBoxes).toHaveLength(2);
		expect(storedBoxes[0].spent).toBe(false);
		expect(storedBoxes[1].spent).toBe(false);

		await markBoxesAsSpent([boxRow, boxRow2]);

		storedBoxes = await loadBoxRows();
		expect(storedBoxes).toHaveLength(2);
		expect(storedBoxes[0].spent).toBe(true);
		expect(storedBoxes[1].spent).toBe(true);
	});

	it('should delete multiple boxes by id', async () => {
		await persistMultipleBoxes([boxRow, boxRow2]);

		let storedBoxes = await loadBoxRows();
		expect(storedBoxes).toHaveLength(2);

		await deleteMultipleBoxes([boxRow.id, boxRow2.id]);

		storedBoxes = await loadBoxRows();
		expect(storedBoxes).toHaveLength(0);
	});

	it('should delete all boxes', async () => {
		await persistMultipleBoxes([boxRow, boxRow2]);

		let storedBoxes = await loadBoxRows();
		expect(storedBoxes).toHaveLength(2);

		await deleteAllBoxes();

		storedBoxes = await loadBoxRows();
		expect(storedBoxes).toHaveLength(0);
	});
});
