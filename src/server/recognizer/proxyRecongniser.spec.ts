import { describe, expect, it } from 'vitest';
import { proxyRecogniser } from './proxyRecongniser';
import {
	tx_example_good_v1,
	tx_example_good_v2,
	tx_example_good_v3,
	tx_example_wrong
} from './proxyTxExamples';

describe('proxy recognizer find outputs', () => {
	it('wrong ', () => {
		let legitOutputs = proxyRecogniser(tx_example_wrong);
		expect(legitOutputs.length).toBe(0);
	});
	it('found', () => {
		let legitOutputs = proxyRecogniser(tx_example_good_v1);
		expect(legitOutputs.length).toBe(1);
	});
	it('found', () => {
		let legitOutputs = proxyRecogniser(tx_example_good_v2);
		expect(legitOutputs.length).toBe(1);
	});
	it('found', () => {
		let legitOutputs = proxyRecogniser(tx_example_good_v3);
		expect(legitOutputs.length).toBe(1);
	});
});
