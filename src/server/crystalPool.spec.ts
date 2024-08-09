import { ALICE_ADDRESS, BOB_ADDRESS } from '$lib/constants/addresses';
import { ALICE_MNEMONIC, BOB_MNEMONIC } from '$lib/constants/mnemonics';
import { TOKEN } from '$lib/constants/tokens';
import type { SwapRequest } from '$lib/types/trading';
import { b, signTxInput } from '$lib/wallet/multisig-server';
import type { Box } from '@fleet-sdk/common';
import { assert, describe, expect, it } from 'vitest';
import {
	createExecuteSwapOrderTx,
	signExecuteSwapOrder,
	signSwap,
	swapOrderTxWithCommits
} from './crystalPool';
import { db_clearDB, initDb } from './db/db';
import { decodeR4, parseBox } from './parser/boxParser';
import { sumNanoErg } from '$lib/utils/helper';

describe.skip('swap', () => {
	const swapCreator: string = 'bob';
	let swapCreatorMnemonic: string;
	let swapCreatorAddress: string;
	let swapExecutorMnemonic: string;
	let swapExecutorAddress: string;

	if (swapCreator == 'alice') {
		swapCreatorMnemonic = ALICE_MNEMONIC;
		swapCreatorAddress = ALICE_ADDRESS;
		swapExecutorMnemonic = BOB_MNEMONIC;
		swapExecutorAddress = BOB_ADDRESS;
	} else {
		swapCreatorMnemonic = BOB_MNEMONIC;
		swapCreatorAddress = BOB_ADDRESS;
		swapExecutorMnemonic = ALICE_MNEMONIC;
		swapExecutorAddress = ALICE_ADDRESS;
	}
	it('create and execute', async () => {
		const db = await initDb();
		await db_clearDB(db);

		const swapParams: SwapRequest = {
			makerPk: swapCreatorAddress,
			nanoErg: 10000n,
			price: '0.002',
			makerToken: { tokenId: TOKEN.SigUSD.tokenId, amount: 100n },
			takerTokenId: TOKEN.rsBTC.tokenId,
			tradingPair: 'rsBTC_SigUSD',
			side: 'BUY'
		};
		let { unsignedTx, publicCommitsPool } = await swapOrderTxWithCommits(swapParams, db);
		expect(unsignedTx).toBeDefined();

		//signByUser
		let extractedHints = await b(
			unsignedTx,
			swapCreatorMnemonic,
			swapCreatorAddress,
			publicCommitsPool
		);
		expect(extractedHints).toBeDefined();

		//signByServer
		let signedTx = await signSwap(unsignedTx, extractedHints, db);

		expect(db.boxRows.find((b) => b.contract == 'SWAP')).toBeDefined();
		expect(
			db.boxRows.find(
				(b) => b.contract == 'DEPOSIT' && b.parameters.userPk == swapCreatorAddress
			)
		).toBeDefined();
		expect(
			db.boxRows.find(
				(b) => b.contract == 'DEPOSIT' && b.parameters.userPk == swapExecutorAddress
			)
		).toBeDefined();

		// execute Tx + sign
		const swapParamsExecute = {
			address: swapExecutorAddress,
			price: '0.002',
			amount: '10000',
			sellingTokenId: TOKEN.rsBTC.tokenId,
			buyingTokenId: TOKEN.SigUSD.tokenId
		};
		const executeUTx = createExecuteSwapOrderTx(swapParamsExecute, db);

		// prettier-ignore
		{
			expect(executeUTx).toBeDefined();
			expect(executeUTx.inputs.find((i)=>parseBox(i)?.contract=='SWAP')).toBeDefined();
			expect(executeUTx.inputs.find((i)=>parseBox(i)?.contract=="DEPOSIT"&&parseBox(i)?.parameters.userPk==swapExecutorAddress)).toBeDefined();
			expect(executeUTx.outputs.find((i)=>parseBox(i)?.contract=="DEPOSIT"&&parseBox(i)?.parameters.userPk==swapCreatorAddress)).toBeDefined();
			expect(executeUTx.outputs.find((i)=>parseBox(i)?.contract=="DEPOSIT"&&parseBox(i)?.parameters.userPk==swapExecutorAddress)).toBeDefined();
		}

		//Sign 1 INPUT By User
		let inputIndex = executeUTx.inputs.findIndex(
			(b: Box) => decodeR4(b)?.userPk == swapExecutorAddress
		); //MANY INPUTS

		const signedInput = await signTxInput(swapExecutorMnemonic, executeUTx, inputIndex);
		const proof = JSON.parse(signedInput.spending_proof().to_json());
		expect(proof).toBeDefined();

		//Sign 2 INPUT By Server
		const executeTx = await signExecuteSwapOrder(executeUTx, proof, db);
		expect(executeTx).toBeDefined();

		// prettier-ignore
		{
			expect(db.boxRows.find((b) => b.contract == 'SWAP')).toBeUndefined();
			expect(db.boxRows.find((b) => b.contract == 'DEPOSIT' && b.parameters.userPk == swapCreatorAddress)).toBeDefined();
			expect(db.boxRows.find((b) => b.contract == 'DEPOSIT' && b.parameters.userPk == swapExecutorAddress)).toBeDefined();
		}

		//SWAP 2
		console.log('ROUND 2');
		const { unsignedTx: unsignedTx2, publicCommitsPool: publicCommitsPool2 } =
			await swapOrderTxWithCommits(swapParamsCreate, db);
		expect(unsignedTx2).toBeDefined();

		//signByUser
		let extractedHints2 = await b(
			unsignedTx2,
			swapCreatorMnemonic,
			swapCreatorAddress,
			publicCommitsPool
		);
		expect(extractedHints2).toBeDefined();

		//signByServer
		//console.log(db.boxRows);

		let signedTx2 = await signSwap(unsignedTx2, extractedHints2, db);
		const executeUTx2 = createExecuteSwapOrderTx(swapParamsExecute, db);

		// prettier-ignore
		{
			expect(executeUTx2).toBeDefined();
			expect(executeUTx2.inputs.find((i)=>parseBox(i)?.contract=='SWAP')).toBeDefined();
			expect(executeUTx2.inputs.find((i)=>parseBox(i)?.contract=="DEPOSIT"&&parseBox(i)?.parameters.userPk==swapExecutorAddress)).toBeDefined();
			expect(executeUTx2.outputs.find((i)=>parseBox(i)?.contract=="DEPOSIT"&&parseBox(i)?.parameters.userPk==swapCreatorAddress)).toBeDefined();
			expect(executeUTx2.outputs.find((i)=>parseBox(i)?.contract=="DEPOSIT"&&parseBox(i)?.parameters.userPk==swapExecutorAddress)).toBeDefined();
		}

		//Sign 1 INPUT By User
		let inputIndex2 = executeUTx2.inputs.findIndex(
			(b: Box) => decodeR4(b)?.userPk == swapExecutorAddress
		); //MANY INPUTS

		const signedInput2 = await signTxInput(swapExecutorMnemonic, executeUTx2, inputIndex2);
		const proof2 = JSON.parse(signedInput2.spending_proof().to_json());
		expect(proof2).toBeDefined();

		//Sign 2 INPUT By Server
		const executeTx2 = await signExecuteSwapOrder(executeUTx2, proof2, db);
		expect(executeTx2).toBeDefined();

		// prettier-ignore
		{
			expect(db.boxRows.find((b) => b.contract == 'SWAP')).toBeUndefined();
			expect(db.boxRows.find((b) => b.contract == 'DEPOSIT' && b.parameters.userPk == swapCreatorAddress)).toBeDefined();
			expect(db.boxRows.find((b) => b.contract == 'DEPOSIT' && b.parameters.userPk == swapExecutorAddress)).toBeDefined();
		}
	});
});

describe('', () => {
	it('sums totalNanoErg', () => {
		const allUsersProxyDeposits = [
			{
				id: 3,
				contract: 'PROXY',
				parameters: {
					userPK: '9hX2DWWpMdUi1RneRRjYtxsKyBeoXPygaSYdSZNPar3QAWJyUJ9',
					poolPK: '9fE4Hk2QXzij6eKt73ki93iWVKboZgRPgV95VZYmazdzqdjPEW8',
					unlockHeight: 1454104,
					minerFee: '1100000'
				},
				box: {
					boxId: 'f280ea6f1faf4c6a101c94d156afa104e5235b00e606681a5ef5178e079600ae',
					value: 100000000,
					ergoTree:
						'100f04000e45100204000402d801d601d9010163b2e4c6720104147300009591a3dad9010263e4c67202050401a7da720101a7ea02da720101a7dad9010263b2e4c67202041473010001a704000e240008cd038aff90abaf0be32f848076f2ec86e1cbf9ecac3fe54302f75d5701812f87c45604020e240008cd025d163103d491a5193c7b18182442877ce8fcf3ffb9ae9c295d9c98a16dcb055104b0c0b101050005c0a38601050005000e20e540cceffd3b8dd0f401193576cc413467039695969427df94454193dddfb3750500050005c0a38601d804d601b2a5730000d602e4c672010414d603dc0c0fa401d9010363db63087203d604d90104414d0e9a8c7204018c8c72040202d19683070193c27201730193d0b27202730200730393d0b27202730400730593e4c672010504730693c1720199b0a47307d9010541639a8c720501c18c7205027308af7203d901054d0ed801d607d901074d0e938c7207018c72050193b0b57203720773097204b0b5db630872017207730a720493b0ada5d90105639593cbc27205730bc17205730c730dd90105599a8c7205018c720502730e',
					assets: [],
					creationHeight: 1322953,
					additionalRegisters: {},
					transactionId:
						'b80e445972f6118782775e7baa7d322ba50bb9e64cc989663dd0ab83a8b1a4b7',
					index: 0
				},
				spent: false
			}
		];

		const boxes = allUsersProxyDeposits.map((r) => r.box);
		const totalNanoErg: bigint = sumNanoErg(boxes);
		expect(totalNanoErg).toEqual(100000000n);
	});
});
