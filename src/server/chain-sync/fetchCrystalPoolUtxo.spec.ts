import { describe, it, expect, vi, beforeAll } from 'vitest';
import { fetchCrystalPoolUtxo } from './fetchCrystalPoolUtxo';
import { mockDataFetchCrystalPoolUtxo } from '../testdata/mockDataFetchCrystalPoolUtxo';
import { parseBox, parseBoxes } from '../parser/boxParser';

vi.mock('./fetchCrystalPoolUtxo', () => ({
	fetchCrystalPoolUtxo: vi.fn()
}));

describe('fetchCrystalPoolUtxo', () => {
	beforeAll(() => {
		vi.mocked(fetchCrystalPoolUtxo).mockResolvedValue(mockDataFetchCrystalPoolUtxo);
	});

	it('should fetch and return mock UTXOs', async () => {
		const utxoSet = await fetchCrystalPoolUtxo();

		expect(utxoSet).toBeDefined();
		expect(utxoSet.length).toBe(29);
	});

	it('should parse all UTXOs into BoxRows', async () => {
		const utxoSet = await fetchCrystalPoolUtxo();
		const boxes = parseBoxes(utxoSet);

		expect(boxes.length).toBe(29);
		expect(boxes.filter((x) => x?.contract == 'DEPOSIT').length).toBe(19);
		expect(boxes.filter((x) => x?.contract == 'PROXY').length).toBe(10);
		expect([...new Set(boxes.flatMap((box) => box?.contract))]).toEqual(['DEPOSIT', 'PROXY']);
		expect([...new Set(boxes.flatMap((box) => box?.box.boxId))].length).toBe(29);
	});
});
