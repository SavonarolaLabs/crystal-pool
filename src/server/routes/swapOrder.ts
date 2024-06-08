import { decodeR7, decodeTokenIdPairFromR6, parseBox, type BoxDB } from '../db/db';
import type { Request, Response, Express } from 'express';
import type { Server } from 'socket.io';
import {
	createExecuteSwapOrderTx,
	signExecuteSwapOrder,
	signSwap,
	swapOrderTxWithCommits,
	type SwapParams
} from '../crystalPool';
import { broadcastOrderBook, broadcastSwapExecute } from '../ioSocket';
import { sellAmount, sellPrice, buyPrice, buyAmount } from '../db/orderBookUtils';

export function createSwapOrder(app: Express, io: Server, db: BoxDB) {
	app.post('/swap-order', async (req: Request, res: Response) => {
		const swapParams: SwapParams = req.body;
		const { unsignedTx, publicCommitsPool } = await swapOrderTxWithCommits(swapParams, db);
		res.json({ unsignedTx, publicCommitsPool });
	});
}

export function signSwapOrder(app: Express, io: Server, db: BoxDB) {
	app.post('/swap-order/sign', async (req: Request, res: Response) => {
		const { unsignedTx, extractedHints } = req.body;

		const signedTx = await signSwap(unsignedTx, extractedHints, db);
		broadcastOrderBook('rsBTC_sigUSD', io, db);

		res.json(signedTx);
	});
}

export function executeSwap(app: Express, io: Server, db: BoxDB) {
	app.post('/execute-swap', async (req: Request, res: Response) => {
		const swapParams: SwapParams = req.body;
		const unsignedTx = createExecuteSwapOrderTx(swapParams, db);
		res.json(unsignedTx);
	});
}

export function signExecuteSwap(app: Express, io: Server, db: BoxDB) {
	app.post('/execute-swap/sign', async (req: Request, res: Response) => {
		const { unsignedTx, proof } = req.body;

		const signedTx = await signExecuteSwapOrder(unsignedTx, proof, db);
		broadcastOrderBook('rsBTC_sigUSD', io, db);

		const swapInput = signedTx.inputs.find((i) => parseBox(i)?.contract == 'SWAP');
		console.log('decodeR6:', decodeTokenIdPairFromR6(swapInput));
		console.log('decodeR7:', decodeR7(swapInput));
		console.dir(parseBox(swapInput));

		const amountB = swapInput.assets[0].amount;
		const rateB = parseBox(swapInput)?.parameters.rate;
		const denomB = parseBox(swapInput)?.parameters.denom;
		const sideB = parseBox(swapInput)?.parameters.side;

		let price;
		let amount;
		if (sideB == 'sell') {
			price = sellPrice(rateB, denomB);
			amount = sellAmount(amountB);
		} else {
			price = buyPrice(rateB, denomB);
			amount = buyAmount(rateB, denomB, amountB);
		}

		const params = {
			side: sideB,
			price: Number(price),
			amount: Number(amount)
		};

		broadcastSwapExecute('rsBTC_sigUSD', io, params);

		res.json(signedTx);
	});
}
