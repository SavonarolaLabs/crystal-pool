import { describe, expect, it } from 'vitest';
import { initDb, db_initDepositUtxo, db_clearDB, decodeR4, parseBox } from './db/db';
import {
	createExecuteSwapOrderTx,
	signExecuteSwapOrder,
	signSwap,
	swapOrderTxWithCommits
} from './crystalPool';
import { ALICE_ADDRESS, BOB_ADDRESS } from '$lib/constants/addresses';
import { TOKEN } from '$lib/constants/tokens';
import { b, signTxInput } from '$lib/wallet/multisig-server';
import { ALICE_MNEMONIC, BOB_MNEMONIC } from '$lib/constants/mnemonics';
import type { Box } from '@fleet-sdk/common';

describe('swap', () => {
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

		await db_initDepositUtxo(db);

		const swapParamsCreate = {
			address: swapCreatorAddress,
			price: '0.002',
			amount: '10000',
			sellingTokenId: TOKEN.rsBTC.tokenId,
			buyingTokenId: TOKEN.sigUSD.tokenId
		};
		let { unsignedTx, publicCommitsPool } = await swapOrderTxWithCommits(swapParamsCreate, db);
		console.dir(unsignedTx, { depth: null });
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

		// prettier-ignore
		{
		expect(db.boxRows.find((b) => b.contract == 'SWAP')).toBeDefined();
		expect(db.boxRows.find((b) => b.contract == 'DEPOSIT' && b.parameters.userPk == swapCreatorAddress)).toBeDefined();
		expect(db.boxRows.find((b) => b.contract == 'DEPOSIT' && b.parameters.userPk == swapExecutorAddress)).toBeDefined();
		}

		// execute Tx + sign
		const swapParamsExecute = {
			address: swapExecutorAddress,
			price: '0.002',
			amount: '10000',
			sellingTokenId: TOKEN.rsBTC.tokenId,
			buyingTokenId: TOKEN.sigUSD.tokenId
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

		const { unsignedTx: unsignedTx2, publicCommitsPool: publicCommitsPool2 } =
			await swapOrderTxWithCommits(swapParamsCreate, db);
		expect(unsignedTx).toBeDefined();

		// //signByUser
		// let extractedHints2 = await b(
		// 	unsignedTx,
		// 	swapCreatorMnemonic,
		// 	swapCreatorAddress,
		// 	publicCommitsPool
		// );
		// expect(extractedHints).toBeDefined();

		// //signByServer
		// let signedTx2 = await signSwap(unsignedTx, extractedHints, db);

		// // prettier-ignore
		// {
		// expect(db.boxRows.find((b) => b.contract == 'SWAP')).toBeDefined();
		// expect(db.boxRows.find((b) => b.contract == 'DEPOSIT' && b.parameters.userPk == swapCreatorAddress)).toBeDefined();
		// expect(db.boxRows.find((b) => b.contract == 'DEPOSIT' && b.parameters.userPk == swapExecutorAddress)).toBeDefined();
		// }
	});
});
