import type { Server } from 'socket.io';
import { createOrderBook } from './db/orderBookUtils';

export function broadcastOrderBook(pair, io, db) {
	console.log(`update ${pair} orderbook`);
	const orderbook = createOrderBook(pair, db);
	io.emit('orderbook', orderbook);
}

export function broadcastSwapExecute(pair: string, io: Server) {
	io.emit(
		'trades',
		JSON.stringify([
			{
				price: 20000,
				amount: 0.00001,
				time: getCurrentTime(),
				side: 'buy'
			}
		])
	);
}

function getCurrentTime() {
	const now = new Date();
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const seconds = String(now.getSeconds()).padStart(2, '0');
	return `${hours}:${minutes}:${seconds}`;
}
