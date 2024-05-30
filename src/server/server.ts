import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { json } from 'body-parser';
import cors from 'cors';
import { boxesRoute } from './boxes';
import { orderBooksRoute } from './orderBooks';
import { processNewSwap, processNewSwapSign } from './swapOrder';
import { initDb } from '$lib/db/db';
import { createOrderBook } from './orderBookUtils';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Apply CORS middleware to Express
app.use(cors({
  origin: '*',
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middleware
app.use(json());

// Initialize the database
const db = await initDb();

// Register routes
boxesRoute(app, io, db); // Pass the io instance and db
orderBooksRoute(app, db); // Pass the db
processNewSwap(app, io, db); // Pass the io instance and db
processNewSwapSign(app, io, db); // Pass the io instance and db

// Basic test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route is working' });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  const orderbook = createOrderBook('rsBTC_sigUSD', db);
  io.emit('update', orderbook);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Example: Emit an update to all clients
  socket.on('exampleEvent', (data) => {
    console.log('Received exampleEvent:', data);
    io.emit('update', { buy: [], sell: [] });
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
