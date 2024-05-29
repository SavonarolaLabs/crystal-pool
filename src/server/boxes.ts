import type { FastifyInstance } from 'fastify';
import type { BoxDB } from '$lib/db/db';

export function boxesRoute(fastify: FastifyInstance, opts: any, done: any) {
  fastify.get('/boxes', async (request, reply) => {
    const db: BoxDB = fastify.db;
    try {
      const serializedData = JSON.stringify(db.boxRows); // Simplified serialization

      // Broadcast the update to all connected WebSocket clients
      fastify.websocketServer.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          const updateMessage = JSON.stringify({ buy: [], sell: [] });
          client.send(updateMessage);
          console.log("Broadcasting update to client:", updateMessage); // Log each broadcast
        }
      });

      console.log("Emitting update event"); // Debug log
      reply.header('Content-Type', 'application/json').send(serializedData);
    } catch (error) {
      console.error('Error processing /boxes request:', error); // Log any errors
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  done();
}
