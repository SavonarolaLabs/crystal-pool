import type { FastifyInstance } from 'fastify';
import type { BoxDB } from '$lib/db/db';

export function boxesRoute(fastify: FastifyInstance, opts: any, done: any) {
  fastify.get('/boxes', async (request, reply) => {
    const db: BoxDB = fastify.db;
    const serializedData = customSerializer(db.boxRows);
    reply.header('Content-Type', 'application/json').send(serializedData);
  });

  done();
}

function customSerializer(payload: any): string {
  return JSON.stringify(payload, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
}