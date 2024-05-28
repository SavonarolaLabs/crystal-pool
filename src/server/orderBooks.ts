import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { BoxDB } from '$lib/db/db';

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

			return filteredBoxRows;
		}
	);

	done();
}
