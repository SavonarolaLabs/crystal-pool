import type { FastifyInstance } from 'fastify';
import type { BoxDB } from '$lib/db/db';

export function boxesRoute(fastify: FastifyInstance, opts: any, done: any) {
  fastify.get('/boxes', async (request, reply) => {
    const db: BoxDB = fastify.db;
    try {
      const serializedData = JSON.stringify(db.boxRows); // Simplified serialization
      fastify.io.emit('update', { buy: [], sell: [] }); // Emit the update event
      console.log("Emitting update event"); // Debug log
      reply.header('Content-Type', 'application/json').send(serializedData);
    } catch (error) {
      console.error('Error processing /boxes request:', error); // Log any errors
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  done();
}
