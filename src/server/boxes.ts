import type { FastifyInstance } from 'fastify';
import type { BoxDB } from '$lib/db/db';

export function boxesRoute(fastify: FastifyInstance, opts: any, done: any) {
  fastify.get('/boxes', async (request, reply) => {
    const db: BoxDB = fastify.db;
    return db.boxRows;
  });

  done();
}
