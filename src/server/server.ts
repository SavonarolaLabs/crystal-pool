import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { initDb } from '$lib/db/db';
import { sumRoute } from './libraryA';
import { processNewSwap } from './swapOrder';
import { boxesRoute } from './boxes';

const fastify = Fastify({ logger: true });

// Register the CORS plugin with maximum permissions
fastify.register(fastifyCors, {
  origin: '*',
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD']
});

// Create an HTTP server and attach Fastify to it
const server = createServer(fastify.server);

// Initialize Socket.IO and attach it to the HTTP server
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Ensure io is decorated before any routes are registered
fastify.decorate('io', io);

// Initialize the database
let db;

const start = async () => {
  try {
    console.log('Starting server...');
    db = initDb();
    fastify.decorate('db', db);

    // Register routes
    fastify.register(sumRoute);
    fastify.register(processNewSwap);
    fastify.register(boxesRoute);

    await fastify.listen({ port: 3000 });
    fastify.log.info('Server running at http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Basic test route
fastify.get('/test', async (request, reply) => {
  return { message: 'Test route is working' };
});

// Socket.IO communication
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

start();
