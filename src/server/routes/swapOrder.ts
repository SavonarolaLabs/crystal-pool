import { BOB_ADDRESS, DEPOSIT_ADDRESS, SWAP_ORDER_ADDRESS } from '../../lib/constants/addresses';
import { utxos } from '../../lib/data/utxos';
import { db_addBoxes, db_removeBoxesByBoxIds, type BoxDB } from '../db/db';
import { boxesAtAddress } from '../../lib/utils/test-helper';
import { a, c, signTxInput } from '../../lib/wallet/multisig-server';
import { createExecuteSwapOrderTx, createSwapOrderTxR9 } from '../../lib/wallet/swap';
import type { Box, SignedTransaction } from '@fleet-sdk/common';
import type { Request, Response, Express } from 'express';
import type { Server } from 'socket.io';
import { createOrderBook } from '../orderBookUtils';
import { ErgoAddress, ErgoTree, SAFE_MIN_BOX_VALUE } from '@fleet-sdk/core';
import { SHADOW_MNEMONIC } from '../../lib/constants/mnemonics';
import { UnsignedTransaction } from 'ergo-lib-wasm-nodejs';

export type SwapRequest = {
	address: string;
	price: string;
	amount: string;
	sellingTokenId: string;
	buyingTokenId: string;
};

export function createSwapOrder(app: Express, io: Server, db: BoxDB) {
	app.post('/swap-order', async (req: Request, res: Response) => {
		const swapParams: SwapRequest = req.body;

		const height = 1273521;
		const unlockHeight = height + 200000;

		const unsignedTx = createSwapOrderTxR9(
			swapParams.address,
			DEPOSIT_ADDRESS,
			utxos[BOB_ADDRESS], // need helper function and boxes for tests
			{
				tokenId: swapParams.sellingTokenId,
				amount: swapParams.amount
			},
			swapParams.price,
			height, // need helper function
			unlockHeight, // need helper function
			swapParams.sellingTokenId,
			swapParams.buyingTokenId,
			SWAP_ORDER_ADDRESS,
			SAFE_MIN_BOX_VALUE
		);

		const { privateCommitsPool, publicCommitsPool } = await a(unsignedTx);
		res.json({ unsignedTx, publicCommitsPool });
	});
}

export function signSwapOrder(app: Express, io: Server, db: BoxDB) {
	app.post('/swap-order/sign', async (req: Request, res: Response) => {
		const { extractedHints, unsignedTx } = req.body;

		const { privateCommitsPool, publicCommitsPool } = await a(unsignedTx);
		const signedTx = await c(unsignedTx, privateCommitsPool, extractedHints);
		const signedTxToStash = signedTx.to_js_eip12();

		storeSignedTx(db, signedTxToStash, SWAP_ORDER_ADDRESS);
		const orderbook = createOrderBook('rsBTC_sigUSD', db);
		io.emit('update', orderbook);

		res.json(signedTxToStash);
	});
}

export function storeSignedTx(db: BoxDB, signedTx: SignedTransaction, address: string) {
	db_removeBoxesByBoxIds(
		db,
		signedTx.inputs.map((box) => box.boxId)
	);
	const boxes = boxesAtAddress(signedTx, address);
	db_addBoxes(db, boxes);
}

export function storeSignedSwapTx(db: BoxDB, signedTx: SignedTransaction) {
	db_removeBoxesByBoxIds(
		db,
		signedTx.inputs.map((box) => box.boxId)
	);
	const boxes1 = boxesAtAddress(signedTx, SWAP_ORDER_ADDRESS);
	const boxes2 = boxesAtAddress(signedTx, DEPOSIT_ADDRESS);
	db_addBoxes(db, [...boxes1, ...boxes2]);
}

export function executeSwapOrder(app: Express, io: Server, db: BoxDB) {
	app.post('/execute-swap', async (req: Request, res: Response) => {
		const swapParams: SwapRequest = req.body;
		const unsignedTx = createExecuteSwapOrderTx(swapParams, db);
		res.json(unsignedTx);
	});
}

export function signExecuteSwapOrder(app: Express, io: Server, db: BoxDB) {
	app.post('/execute-swap/sign', async (req: Request, res: Response) => {
		const { proof, unsignedTx } = req.body;

		const inputIndexDeposit = unsignedTx.inputs.findIndex(
			(box: Box) => box.ergoTree == ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree
		);
		const inputIndexSwap = unsignedTx.inputs.findIndex(
			(box: Box) => box.ergoTree == ErgoAddress.fromBase58(SWAP_ORDER_ADDRESS).ergoTree
		);
		const signed = await signTxInput(SHADOW_MNEMONIC, unsignedTx, inputIndexSwap);
		const proofSwap = JSON.parse(signed.spending_proof().to_json());

		const txId = UnsignedTransaction.from_json(JSON.stringify(unsignedTx)).id().to_str();

		unsignedTx.inputs[inputIndexDeposit].spendingProof = proof;
		unsignedTx.inputs[inputIndexSwap].spendingProof = proofSwap;
		unsignedTx.txId = txId;

		storeSignedSwapTx(db, unsignedTx);

		const orderbook = createOrderBook('rsBTC_sigUSD', db);
		io.emit('update', orderbook);
		function getCurrentTime() {
			const now = new Date();
			const hours = String(now.getHours()).padStart(2, '0');
			const minutes = String(now.getMinutes()).padStart(2, '0');
			const seconds = String(now.getSeconds()).padStart(2, '0');
			return `${hours}:${minutes}:${seconds}`;
		}
		io.emit(
			'trades',
			JSON.stringify([
				{
					price: 20000,
					amount: 0.00001,
					time: getCurrentTime(),
					side: 'buy'
				}
			])
		);

		res.json(unsignedTx);
	});
}
