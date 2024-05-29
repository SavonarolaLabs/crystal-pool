import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { sumRoute } from './libraryA';
import { processNewSwap, processNewSwapSign } from './swapOrder';
import { boxesRoute } from './boxes';
import { initDb } from '$lib/db/db';
import { orderBooksRoute } from './orderBooks';

// Initialize Fastify
const fastify = Fastify({ logger: true });

// Create an HTTP server and attach Fastify to it
const server = createServer(fastify.server);

// Initialize Socket.IO and attach it to the HTTP server
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Register the CORS plugin with maximum permissions
fastify.register(fastifyCors, {
  origin: '*', // Allow all origins
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'] // Allow all methods
});

// Attach io to Fastify instance
fastify.decorate('io', io);

let db;

const start = async () => {
  try {
    db = initDb();
    fastify.decorate('db', db);

    // Register routes
    fastify.register(sumRoute);
    fastify.register(processNewSwap);
    fastify.register(processNewSwapSign);
    fastify.register(boxesRoute);
    fastify.register(orderBooksRoute);

    // Start the HTTP server
    server.listen(3000, () => {
      fastify.log.info(`Server running at http://localhost:3000`);
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Socket.IO communication
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  // Example event
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

start();
