import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { json } from 'body-parser';
import cors from 'cors';
import { getBoxes, getBoxesByAddress, getSwapContractBoxes } from './routes/boxes';
import {
	configureSwapOrder,
	createSwapOrder,
	executeSwap,
	signExecuteSwap,
	signSwapOrder
} from './routes/swapOrder';
import { initDb, db_initDepositUtxo } from './db/db';
import { createOrderBook } from './db/orderBookUtils';
import { getOrderBookByTradingPair } from './routes/orderBooks';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST']
	}
});

app.use(
	cors({
		origin: '*',
		methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		exposedHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
		preflightContinue: false,
		optionsSuccessStatus: 204
	})
);

// Middleware
app.use(json());

// Initialize the database
const db = await initDb();
db_initDepositUtxo(db);

// Register routes
getBoxes(app, db);
getBoxesByAddress(app, db);
getSwapContractBoxes(app,db)
getOrderBookByTradingPair(app, db);

configureSwapOrder(app, io, db);
createSwapOrder(app, io, db);
signSwapOrder(app, io, db);
executeSwap(app, io, db);
signExecuteSwap(app, io, db);

// WebSocket connection
io.on('connection', (socket) => {
	console.log('A client connected:', socket.id);
	const orderbook = createOrderBook('rsBTC_sigUSD', db);
	io.emit('orderbook', orderbook);

	socket.on('disconnect', () => {
		console.log('Client disconnected:', socket.id);
	});

	// Example: Emit an update to all clients
	socket.on('exampleEvent', (data) => {
		console.log('Received exampleEvent:', data);
		io.emit('orderbook', { buy: [], sell: [] });
	});
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
