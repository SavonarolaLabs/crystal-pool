import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { BoxDB } from '$lib/db/db';
import { bigIntSerializer } from './bigIntSerializer';

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
					price: row.parameters.rate, // todo rate to price conversion
					amount: row.box.assets[0].amount,
					side: row.parameters.side
				};
			});
			const buyOrders = allOrders.filter((order) => order.side == 'buy');
			const sellOrders = allOrders.filter(
				(order) => order.side == 'sell'
			);
			const oderbook = {
				buy: buyOrders,
				sell: sellOrders
			};

			const serializedData = bigIntSerializer(oderbook);
			reply
				.header('Content-Type', 'application/json')
				.send(serializedData);
		}
	);

	done();
}
