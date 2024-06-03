import type { Express, Request, Response } from 'express';
import type { BoxDB } from '../db/db';
import { createOrderBook } from '../orderBookUtils';

interface OrderBooksParams {
	tradingPair: string;
}

export function orderBooks(app: Express, db: BoxDB) {
	app.get('/order-books/:tradingPair', (req: Request, res: Response) => {
		const { tradingPair } = req.params as unknown as OrderBooksParams;

		const orderbook = createOrderBook(tradingPair, db);

		res.header('Content-Type', 'application/json').send(orderbook);
	});
}
