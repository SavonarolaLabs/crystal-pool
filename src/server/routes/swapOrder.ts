import { BOB_ADDRESS, DEPOSIT_ADDRESS, SWAP_ORDER_ADDRESS } from '$lib/constants/addresses';
import { utxos } from '$lib/data/utxos';
import { db_addBoxes, type BoxDB } from '$lib/db/db';
import { boxesAtAddress } from '$lib/utils/test-helper';
import { a, c } from '$lib/wallet/multisig-server';
import { createSwapOrderTx, createSwapOrderTxR9, executeSwap } from '$lib/wallet/swap';
import type { SignedTransaction } from '@fleet-sdk/common';
import type { Request, Response, Express } from 'express';
import type { Server } from 'socket.io';
import { createOrderBook } from '../orderBookUtils';
import { asBigInt } from '$lib/utils/helper';
import { SAFE_MIN_BOX_VALUE } from '@fleet-sdk/core';

type SwapRequest = {
	address: string;
	price: string;
	amount: string;
	sellingTokenId: string;
	buyingTokenId: string;
};

export function createSwapOrder(app: Express, io: Server, db: BoxDB) {
	app.post('/swap-order', async (req: Request, res: Response) => {
		const swapParams: SwapRequest = req.body; // Swap Params
		//-----------------------------------
		const height = 1273521;
		const unlockHeight = height + 200000;
		//------------------------------------
		// CreateTx unsignedTx
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

export function executeSwapOrder(app: Express, io: Server, db: BoxDB) {
	app.post('/execute-swap', async (req: Request, res: Response) => {
		const swapParams: SwapRequest = req.body; // Swap Params
		//-----------------------------------
		const height = 1273521;
		const unlockHeight = height + 200000;

		// address: string;
		// price: string;
		// amount: string;
		// sellingTokenId: string;
		// buyingTokenId: string;

		//3 - Add Inputs

		const buyingAmount = 0n; //amount?
		const paymentAmount = 0n; //calculate?

		//2 - Find Contract Box
		const paymentInputBoxes = []; //Take Deposits
		const tokensFromSwapContract = { tokenId: swapParams.buyingTokenId, amount: buyingAmount };
		const tokensAsPayment = { tokenId: swapParams.sellingTokenId, amount: paymentAmount };

		//------------------------------------
		const unsignedTx = executeSwap(
			height, // need helper function
			swapOrderInputBoxes,
			paymentInputBoxes,
			tokensFromSwapContract,
			tokensAsPayment
		);
		res.json(unsignedTx);
	});
}

export function signSwapOrder(app: Express, io: Server, db: BoxDB) {
	app.post('/swap-order/sign', async (req: Request, res: Response) => {
		const { extractedHints, unsignedTx } = req.body; // TODO: unsignedTx not from USER

		const { privateCommitsPool, publicCommitsPool } = await a(unsignedTx);
		const signedTx = await c(unsignedTx, privateCommitsPool, extractedHints);
		const signedTxToStash = signedTx.to_js_eip12();

		// TODO: Add signedToStash -> to DB -> To orderbook ...
		storeSignedTx(db, signedTxToStash, SWAP_ORDER_ADDRESS);

		// Create the order book
		const orderbook = createOrderBook('rsBTC_sigUSD', db);
		io.emit('update', orderbook);

		res.json(signedTxToStash);
	});
}

export function storeSignedTx(db: BoxDB, signedTx: SignedTransaction, address: string) {
	const boxes = boxesAtAddress(signedTx, address);
	db_addBoxes(db, boxes);
	// BoxRow.parameters.pair

	// console.log(signedTx);
}
