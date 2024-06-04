import { type BoxDB } from '../db/db';
import type { Request, Response, Express } from 'express';
import type { Server } from 'socket.io';
import { createOrderBook } from '../db/orderBookUtils';
import { createExecuteSwapOrderTx, signExecuteSwapOrder, swapOrderTxWithCommits, type SwapParams } from '../crystalPool';

export function createSwapOrder(app: Express, io: Server, db: BoxDB) {
	app.post('/swap-order', async (req: Request, res: Response) => {
		const swapParams: SwapParams = req.body;
		const { unsignedTx, publicCommitsPool } = await swapOrderTxWithCommits(swapParams, db);
		res.json({ unsignedTx, publicCommitsPool });
	});
}

export function signSwapOrder(app: Express, io: Server, db: BoxDB) {
	app.post('/swap-order/sign', async (req: Request, res: Response) => {
		const { unsignedTx, hints } = req.body;
		const signedTx = signSwapOrder(unsignedTx, hints, db);

		const orderbook = createOrderBook('rsBTC_sigUSD', db);
		io.emit('update', orderbook);

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
		const { unsignedTx, proof} = req.body;
		const signedTx = signExecuteSwapOrder(unsignedTx, proof, db);
		
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

		res.json(signedTx);
	});
}
