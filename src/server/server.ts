import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import { sumRoute } from './libraryA';
import { processNewSwap } from './swapOrder';
import { boxesRoute } from './boxes';
import { initDb } from '$lib/db/db';

const fastify = Fastify({ logger: true });

// Register the CORS plugin with maximum permissions
fastify.register(fastifyCors, {
  origin: '*',
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD']
});

// Register the @fastify/websocket plugin
fastify.register(fastifyWebsocket);

// Initialize the database
const db = initDb();
fastify.decorate('db', db);

// Register routes
fastify.register(sumRoute);
fastify.register(processNewSwap);
fastify.register(boxesRoute);

// Basic test route
fastify.get('/test', async (request, reply) => {
  return { message: 'Test route is working' };
});

// WebSocket endpoint
fastify.get('/ws', { websocket: true }, (connection, req) => {
  console.log('WebSocket client connected');

  connection.socket.on('message', message => {
    console.log('Received message:', message.toString());
    // Echo the message back to the client
    connection.socket.send('Hello from server');
  });

  connection.socket.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Start the Fastify server
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    fastify.log.info('Server running at http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
