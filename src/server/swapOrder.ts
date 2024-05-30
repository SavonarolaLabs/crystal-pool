import {
	BOB_ADDRESS,
	DEPOSIT_ADDRESS,
	SWAP_ORDER_ADDRESS
} from '$lib/constants/addresses';
import { utxos } from '$lib/data/utxos';
import { db_addBoxes, type BoxDB } from '$lib/db/db';
import { boxesAtAddress } from '$lib/utils/test-helper';
import { a, c } from '$lib/wallet/multisig-server';
import { createSwapOrderTx } from '$lib/wallet/swap';
import type { SignedTransaction } from '@fleet-sdk/common';
import type { Request, Response, Express } from 'express';
import type { Server } from 'socket.io';
import { createOrderBook } from './orderBookUtils';

const NEW_SWAP_REQUEST = '/swapNew';
const NEW_SWAP_SIGN = '/swapNewSign';

type SwapRequest = {
	address: string;
	price: string;
	amount: string;
	sellingTokenId: string;
	buyingTokenId: string;
};

export function processNewSwap(app: Express, io: Server, db: BoxDB) {
	app.post(NEW_SWAP_REQUEST, async (req: Request, res: Response) => {
		const swapParams: SwapRequest = req.body; // Swap Params
		//-----------------------------------
		const height = 1273521;
		const unlockHeight = height + 200000;
		//------------------------------------
		// CreateTx unsignedTx
		const unsignedTx = createSwapOrderTx(
			swapParams.address,
			DEPOSIT_ADDRESS,
			utxos[BOB_ADDRESS], // need helper function and boxes for tests
			{
				tokenId: swapParams.sellingTokenId,
				amount: swapParams.amount
			},
			BigInt(swapParams.price),
			height, // need helper function
			unlockHeight, // need helper function
			swapParams.sellingTokenId,
			swapParams.buyingTokenId
		);

		console.log('unsignedTx:');
		console.log('🚀 ~ POST ~ unsignedTx:', unsignedTx);
		const { privateCommitsBob, publicCommitsBob } = await a(unsignedTx);
		res.json({ unsignedTx, publicCommitsBob });
	});
}

export function processNewSwapSign(app: Express, io: Server, db: BoxDB) {
	app.post(NEW_SWAP_SIGN, async (req: Request, res: Response) => {
	  const { extractedHints, unsignedTx } = req.body; // TODO: unsignedTx not from USER
  
	  const { privateCommitsBob, publicCommitsBob } = await a(unsignedTx);
	  const signedTx = await c(unsignedTx, privateCommitsBob, extractedHints);
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
