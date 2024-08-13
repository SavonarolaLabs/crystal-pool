import { SHADOWPOOL_ADDRESS } from '$lib/constants/addresses';
import type { BoxRowNoId, ContractType } from '$lib/types/boxRow';
import type { ConfirmedOutput } from '$lib/types/explorer';
import type { TransactionNode } from '$lib/types/node';
import { arraysEqual } from '$lib/utils/helper';
import { ErgoAddress } from '@fleet-sdk/core';
import { ErgoTree } from 'ergo-lib-wasm-nodejs';

const proxyErgoTree =
	'100f04000e45100204000402d801d601d9010163b2e4c6720104147300009591a3dad9010263e4c67202050401a7da720101a7ea02da720101a7dad9010263b2e4c67202041473010001a704000e240008cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c04020e240008cd025d163103d491a5193c7b18182442877ce8fcf3ffb9ae9c295d9c98a16dcb055104c08db701050005c0a38601050005000e20e540cceffd3b8dd0f401193576cc413467039695969427df94454193dddfb3750500050005c0a38601d804d601b2a5730000d602e4c672010414d603dc0c0fa401d9010363db63087203d604d90104414d0e9a8c7204018c8c72040202d19683070193c27201730193d0b27202730200730393d0b27202730400730593e4c672010504730693c1720199b0a47307d9010541639a8c720501c18c7205027308af7203d901054d0ed801d607d901074d0e938c7207018c72050193b0b57203720773097204b0b5db630872017207730a720493b0ada5d90105639593cbc27205730bc17205730c730dd90105599a8c7205018c720502730e';
const proxyTemplate = ErgoTree.from_base16_bytes(proxyErgoTree).template_bytes();

export function proxyOutputs(transaction: TransactionNode): BoxRowNoId[] {
	return transaction.outputs
		.map(mapBoxToProxyBoxRow)
		.filter((output) => output !== undefined) as any;
}

export function mapBoxToProxyBoxRow(box) {
	const ergoTree = ErgoTree.from_base16_bytes(box.ergoTree);
	const outputTemplate = ergoTree.template_bytes();

	if (arraysEqual(outputTemplate, proxyTemplate)) {
		return {
			box,
			contract: 'PROXY' as ContractType,
			parameters: {
				userPk: ErgoAddress.fromErgoTree(
					Buffer.from(ergoTree.get_constant(3)?.to_js()).toString('hex')
				).toString(),
				poolPk: SHADOWPOOL_ADDRESS,
				unlockHeight: ergoTree.get_constant(6)?.to_js(),
				minerFee: ergoTree.get_constant(8)?.to_js()
			},
			spent: !!(box as ConfirmedOutput).spentTransactionId
		};
	}
	return undefined;
}
