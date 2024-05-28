import type { FastifyInstance } from 'fastify';
import type { BoxDB } from '$lib/db/db';

function bigIntReplacer(value: any): string {
	return typeof value === 'bigint' ? value.toString() : value;
}

export function boxesRoute(fastify: FastifyInstance, opts: any, done: any) {
	fastify.get('/boxes', async (request, reply) => {
		const db: BoxDB = fastify.db;
		return JSON.stringify(db.boxRows, bigIntReplacer);
	});

	done();
}
