import { describe, expect, it } from 'vitest';
import { proxyOutputs } from './proxyRecognizer';
import { tx_one_output_v1, tx_one_output_v2, tx_one_output_v3, tx_no_outputs } from './testData';
import { ErgoTree } from 'ergo-lib-wasm-nodejs';
import { compileDepositProxyContract } from '$lib/compiler/compile';
import { BOB_ADDRESS } from '$lib/constants/addresses';
import { ErgoAddress } from '@fleet-sdk/core';

describe('proxyRecognizer', () => {
	it('should not find any output ', () => {
		expect(proxyOutputs(tx_no_outputs as any).length).toBe(0);
	});
	it('should recognize one output', () => {
		expect(proxyOutputs(tx_one_output_v1 as any).length).toBe(1);
		expect(proxyOutputs(tx_one_output_v2 as any).length).toBe(1);
		expect(proxyOutputs(tx_one_output_v3 as any).length).toBe(1);
	});

	it('templates are equal', () => {
		const contract = compileDepositProxyContract(BOB_ADDRESS, 1500000);
		const contract_ergoTree = ErgoAddress.fromBase58(contract).ergoTree;
		const proxyTemplate = ErgoTree.from_base16_bytes(contract_ergoTree).template_bytes();

		const ergotree1 = tx_one_output_v1.outputs[0].ergoTree;
		const ergotree2 = tx_one_output_v2.outputs[0].ergoTree;

		const template1 = ErgoTree.from_base16_bytes(ergotree1).template_bytes();
		const template2 = ErgoTree.from_base16_bytes(ergotree2).template_bytes();

		expect(template1).toStrictEqual(proxyTemplate);
		expect(template2).toStrictEqual(proxyTemplate);
	});
});
