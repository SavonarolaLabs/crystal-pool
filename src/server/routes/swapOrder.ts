import { type BoxDB } from '../db/db';
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
		broadcastSwapExecute('rsBTC_sigUSD', io);

		res.json(signedTx);
	});
}
