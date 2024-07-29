import { SHADOWPOOL_ADDRESS } from '$lib/constants/addresses';
import type { BoxRowNoId, ContractType } from '$lib/types/boxRow';
import type { TransactionNode } from '$lib/types/node';
import { ErgoAddress } from '@fleet-sdk/core';
import { ErgoTree } from 'ergo-lib-wasm-nodejs';

export function proxyOutputs(transaction: TransactionNode): BoxRowNoId[] {
	const starts = '100f04000e';
	const ends =
		'd804d601b2a5730000d602e4c672010414d603dc0c0fa401d9010363db63087203d604d90104414d0e9a8c7204018c8c72040202d19683070193c27201730193d0b27202730200730393d0b27202730400730593e4c672010504730693c1720199b0a47307d9010541639a8c720501c18c7205027308af7203d901054d0ed801d607d901074d0e938c7207018c72050193b0b57203720773097204b0b5db630872017207730a720493b0ada5d90105639593cbc27205730bc17205730c730dd90105599a8c7205018c720502730e';
	const includes =
		'50005000e20e540cceffd3b8dd0f401193576cc413467039695969427df94454193dddfb3750500050005c0';

	return transaction.outputs
		.map((box) => {
			if (
				box.ergoTree.startsWith(starts) &&
				box.ergoTree.endsWith(ends) &&
				box.ergoTree.includes(includes)
			) {
				const ergoTree = ErgoTree.from_base16_bytes(box.ergoTree);
				return {
					box,
					contract: 'PROXY' as ContractType,
					parameters: {
						userPK: ErgoAddress.fromErgoTree(
							Buffer.from(ergoTree.get_constant(3)?.to_js()).toString('hex')
						).toString(),
						poolPK: SHADOWPOOL_ADDRESS,
						unlockHeight: ergoTree.get_constant(6)?.to_js(),
						minerFee: ergoTree.get_constant(8)?.to_js()
					},
					spent: false
				};
			}
			return null;
		})
		.filter((output) => output !== null) as any;
}
