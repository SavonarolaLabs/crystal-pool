import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { BoxDB } from '$lib/db/db';
import { bigIntSerializer } from './bigIntSerializer';
import { asBigInt } from '$lib/utils/helper';

interface OrderBooksParams {
	tradingPair: string;
}

export function orderBooksRoute(
	fastify: FastifyInstance,
	opts: any,
	done: any
) {
	fastify.get(
		'/order-books/:tradingPair',
		async (
			request: FastifyRequest<{ Params: OrderBooksParams }>,
			reply
		) => {
			const db: BoxDB = fastify.db;
			const { tradingPair } = request.params;

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
			const oderbook = {
				buy: buyOrders.map((r) => {
					return {
						price: r.rate,
						amount: r.amount,
						total: asBigInt(r.rate) * asBigInt(r.amount)
					};
				}),
				sell: sellOrders.map((r) => {
					return {
						price: 1 / r.rate,
						amount: r.amount,
						total: 1n / asBigInt(r.rate) * asBigInt(r.amount)
					};
				})
			};

			const serializedData = bigIntSerializer(oderbook);
			reply
				.header('Content-Type', 'application/json')
				.send(serializedData);
		}
	);

	done();
}
