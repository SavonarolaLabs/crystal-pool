import type { UnconfirmedTransaction } from '$lib/types/explorer';
import { ErgoAddress } from '@fleet-sdk/core';

type LegitOutput = {
	txId: string;
	outputIndex: number;
	ergoTree: any;
	userPK?: string;
};

export function proxyRecogniser(transaction: UnconfirmedTransaction): any {
	const outputs = transaction.outputs;

	const legitOutputs: Array<LegitOutput> = [];
	const starts = '100f04000e';
	const ends =
		'd804d601b2a5730000d602e4c672010414d603dc0c0fa401d9010363db63087203d604d90104414d0e9a8c7204018c8c72040202d19683070193c27201730193d0b27202730200730393d0b27202730400730593e4c672010504730693c1720199b0a47307d9010541639a8c720501c18c7205027308af7203d901054d0ed801d607d901074d0e938c7207018c72050193b0b57203720773097204b0b5db630872017207730a720493b0ada5d90105639593cbc27205730bc17205730c730dd90105599a8c7205018c720502730e';
	const includes =
		'50005000e20e540cceffd3b8dd0f401193576cc413467039695969427df94454193dddfb3750500050005c0';

	outputs.map((o, i) => {
		if (o.ergoTree.startsWith(starts)) {
			if (o.ergoTree.endsWith(ends)) {
				if (o.ergoTree.includes(includes)) {
					let legit: LegitOutput = {
						txId: transaction.id,
						outputIndex: i,
						ergoTree: o.ergoTree
					};
					legitOutputs.push(legit);
				}
			}
		}
	});
	return legitOutputs;
}

export function proxyRecogniser_fix(transaction: UnconfirmedTransaction): any {
	const outputs = transaction.outputs;

	const legitOutputs: Array<LegitOutput> = [];
	const starts = '100f04000e';
	const ends =
		'd804d601b2a5730000d602e4c672010414d603dc0c0fa401d9010363db63087203d604d90104414d0e9a8c7204018c8c72040202d19683070193c27201730193d0b27202730200730393d0b27202730400730593e4c672010504730693c1720199b0a47307d9010541639a8c720501c18c7205027308af7203d901054d0ed801d607d901074d0e938c7207018c72050193b0b57203720773097204b0b5db630872017207730a720493b0ada5d90105639593cbc27205730bc17205730c730dd90105599a8c7205018c720502730e';
	const includes =
		'50005000e20e540cceffd3b8dd0f401193576cc413467039695969427df94454193dddfb3750500050005c0';

	const test =
		'100f04000e45100204000402d801d601d9010163b2e4c6720104147300009591a3dad9010263e4c67202050401a7da720101a7ea02da720101a7dad9010263b2e4c67202041473010001a704000e240008cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c04020e240008cd025d163103d491a5193c7b18182442877ce8fcf3ffb9ae9c295d9c98a16dcb055104c096b102050005c0a38601050005000e20e540cceffd3b8dd0f401193576cc413467039695969427df94454193dddfb3750500050005c0a38601d804d601b2a5730000d602e4c672010414d603dc0c0fa401d9010363db63087203d604d90104414d0e9a8c7204018c8c72040202d19683070193c27201730193d0b27202730200730393d0b27202730400730593e4c672010504730693c1720199b0a47307d9010541639a8c720501c18c7205027308af7203d901054d0ed801d607d901074d0e938c7207018c72050193b0b57203720773097204b0b5db630872017207730a720493b0ada5d90105639593cbc27205730bc17205730c730dd90105599a8c7205018c720502730e';

	const userAddressStarts = 158;
	const userAddressLength = 72;

	outputs.map((o, i) => {
		if (o.ergoTree.startsWith(starts)) {
			if (o.ergoTree.endsWith(ends)) {
				if (o.ergoTree.includes(includes)) {
					const userAddress = o.ergoTree.slice(
						userAddressStarts,
						userAddressStarts + userAddressLength
					);

					let legit: LegitOutput = {
						txId: transaction.id,
						outputIndex: i,
						ergoTree: o.ergoTree,
						userPK: ErgoAddress.fromErgoTree(userAddress).toString()
					};
					legitOutputs.push(legit);
				}
			}
		}
	});
	return legitOutputs;
}
