import { describe, expect, it } from 'vitest';
import { proxyOutputs } from './proxyRecognizer';
import { tx_one_output_v1, tx_one_output_v2, tx_one_output_v3, tx_no_outputs } from './testData';

describe('proxyRecognizer', () => {
	it('should not find any output ', () => {
		expect(proxyOutputs(tx_no_outputs as any).length).toBe(0);
	});
	it('should recognize one output', () => {
		expect(proxyOutputs(tx_one_output_v1 as any).length).toBe(1);
		expect(proxyOutputs(tx_one_output_v2 as any).length).toBe(1);
		expect(proxyOutputs(tx_one_output_v3 as any).length).toBe(1);
	});
});
