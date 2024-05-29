import type { FastifyInstance } from 'fastify';
import type { BoxDB } from '$lib/db/db';
import { bigIntSerializer } from './bigIntSerializer';

export function boxesRoute(fastify: FastifyInstance, opts: any, done: any) {
  fastify.get('/boxes', async (request, reply) => {
    const db: BoxDB = fastify.db;
    const serializedData = bigIntSerializer(db.boxRows);
    reply.header('Content-Type', 'application/json').send(serializedData);
  });

  done();
}