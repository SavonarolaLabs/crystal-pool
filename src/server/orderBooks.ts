import type { Request, Response } from 'express';
import type { BoxDB } from '$lib/db/db';
import { bigIntSerializer } from './bigIntSerializer';
import { asBigInt } from '$lib/utils/helper';

interface OrderBooksParams {
	tradingPair: string;
}

export function orderBooksRoute(app, db: BoxDB) {
	app.get('/order-books/:tradingPair', (req: Request, res: Response) => {
		const { tradingPair } = req.params as unknown as OrderBooksParams;

		const filteredBoxRows = db.boxRows.filter(
			(boxRow) => boxRow.parameters?.pair === tradingPair
		);
		const allOrders = filteredBoxRows.map((row) => {
			return {
				rate: row.parameters.rate, // todo rate to price conversion
				amount: row.box.assets[0].amount,
				side: row.parameters.side
			};
		});
		const buyOrders = allOrders.filter((order) => order.side == 'buy');
		const sellOrders = allOrders.filter(
			(order) => order.side == 'sell'
		);
		const orderbook = {
			buy: buyOrders.map((r) => {
				return {
					price: r.rate,
					amount: r.amount,
					value: asBigInt(r.rate) * asBigInt(r.amount)
				};
			}),
			sell: sellOrders.map((r) => {
				return {
					price: 1 / r.rate,
					amount: r.amount,
					value: 1n / asBigInt(r.rate) * asBigInt(r.amount)
				};
			})
		};

		const serializedData = bigIntSerializer(orderbook);
		res.header('Content-Type', 'application/json').send(serializedData);
	});
}
