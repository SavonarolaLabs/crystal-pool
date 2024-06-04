import type { Express, Request, Response } from 'express';
import type { BoxDB } from '../db/db';
import { createOrderBook } from '../db/orderBookUtils';
import { sendJSON } from './utils';

interface OrderBooksParams {
	tradingPair: string;
}

export function getOrderBookByTradingPair(app: Express, db: BoxDB) {
	app.get('/order-books/:tradingPair', (req: Request, res: Response) => {
		const orderbook = createOrderBook(req.params.tradingPair, db);
		sendJSON(res, orderbook);
	});
}
