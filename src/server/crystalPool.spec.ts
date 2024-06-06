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
import {
	ProverBuilder$,
	ProverHints$,
	ProverSecret$,
	SigmaPropProver$,
	SigmaPropVerifier$
} from 'sigmastate-js/main';
import bip39 from 'bip39';
import { fakeContext, headers } from '$lib/constants/fakeContext';
import { BlockHeader, BlockHeaders, ErgoStateContext, PreHeader } from 'ergo-lib-wasm-nodejs';

describe('swap', async () => {
	const swapCreator: string = 'bob';
	let swapCreatorMnemonic: string;
	let swapCreatorAddress: string;
	let swapExecutorMnemonic: string;
	let swapExecutorAddress: string;

	let w = 0xadf47e32000fc75e2923dba482c843c7f6b684cbf2ceec5bfdf5fe6d13cabe5dn;
	let secret = ProverSecret$.dlog(w);
	let p = SigmaPropProver$.withSecrets([secret]);
	expect(p).not.toBeUndefined();

	it('generateCommitments', () => {
		let hints = p.generateCommitments(secret.publicKey());

		expect(hints).not.toBeUndefined();
	});

	it('signMessage', () => {
		let message = Int8Array.of(1, 2, 3);
		let signature = p.signMessage(secret.publicKey(), message, ProverHints$.empty());
		expect(signature).not.toBeUndefined();
		expect(signature.length).toBeGreaterThan(0);

		let V = SigmaPropVerifier$.create();
		let ok = V.verifySignature(secret.publicKey(), message, signature);
		expect(ok).toEqual(true);
	});

	it('create Prover and reduce Tx ', async () => {
		const network = 0; //<------------
		const BlockchainParameters = {
			storageFeeFactor: 1000,
			minValuePerByte: 1,
			maxBlockSize: 1000000,
			tokenAccessCost: 100,
			inputCost: 10,
			dataInputCost: 10,
			outputCost: 10,
			maxBlockCost: 1000000,
			softForkStartingHeight: 100, // Assuming you want a number instead of Some(number)
			softForkVotesCollected: 50, // Assuming you want a number instead of Some(number)
			blockVersion: 1
		};
		const mnemonicPhrase = (await bip39.mnemonicToSeed(ALICE_MNEMONIC)).toString('hex');
		const mnemonicPass = '';

		const builder = ProverBuilder$.create(BlockchainParameters, network).withMnemonic(
			mnemonicPhrase,
			mnemonicPass
		);

		const prover = builder.build();
		const address9 = prover.getP2PKAddress();
		console.log(address9);

		const blockHeaders = BlockHeaders.from_json(headers);
		const preHeader = PreHeader.from_block_header(BlockHeader.from_json(headers[0]));
		//const digest = SigmaRust.previousStateDigest()
		//previousStateDigest,
		const ctx = {
			sigmaLastHeaders: headers.map((h) => JSON.parse(h)),
			previousStateDigest: '',
			sigmaPreHeader: JSON.parse(headers[0])
		};
		console.log(ctx);

		// export declare class BlockchainStateContext {
		// 	sigmaLastHeaders: Header[];
		// 	previousStateDigest: HexString;
		// 	sigmaPreHeader: PreHeader;
		// }

		// reduce
		// const stateCtx = fakeContext();
		// const unsignedTx9;

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
		expect(unsignedTx).toBeDefined();
		//console.log(unsignedTx);

		//const reducedTx9 = prover.reduce(ctx, unsignedTx, unsignedTx.inputs, [], [], 0);

		// //     export declare class ProverBuilder$ {
		//     static create(parameters: BlockchainParameters, network: number): ProverBuilder;
		// }
		// withMnemonic(mnemonicPhrase: HexString, mnemonicPass: HexString): ProverBuilder;

		// ProverBuilder.
		// build(): SigmaProver;

		// SigmaProver.
		// reduce(
		// 	stateCtx: BlockchainStateContext,
		// 	unsignedTx: UnsignedTransaction,
		// 	boxesToSpend: EIP12UnsignedInput[],
		// 	dataInputs: FBox<Amount, NonMandatoryRegisters>[],
		// 	tokensToBurn: TokenAmount<Amount>[],
		// 	baseCost: number): ReducedTransaction;)

		// aliceProver.reduceTransactionInput()
		// aliceProver.signReducedInput()
		// aliceProver.generateCommitments()
	});

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
	});
});
