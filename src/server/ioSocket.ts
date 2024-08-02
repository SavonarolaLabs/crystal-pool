import type { Server } from 'socket.io';
import { createOrderBook } from './db/orderBookUtils';
import type { PK } from '$lib/types/trading';
import type { BoxDB } from './db/db';
import type { BoxRow } from '$lib/types/boxRow';

export function broadcastOrderBook(pair, io, db) {
	console.log(`update ${pair} orderbook`);
	const orderbook = createOrderBook(pair, db);
	io.emit('orderbook', orderbook);
}

export function broadcastSwapExecute(pair: string, io: Server, params: any) {
	io.emit(
		'trades',
		JSON.stringify([
			{
				price: params.price,
				amount: params.amount,
				time: getCurrentTime(),
				side: params.side
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

export function sendPeerBalanceUpdate(db: BoxDB, pk: PK):void{
	sendMessageToSocket(db, pk, 'balance', {value:100, tokens:[]})
}

export function sendPeerProxyDepositErrorInsufficientErg(db: BoxDB, pk: PK, boxRows: BoxRow[]):void{
	sendMessageToSocket(db, pk, 'error_proxy_insufficient_erg', {boxRows})
}

function sendMessageToSocket(db: BoxDB, pk: PK, channel: string, data: any): void {
    const clientSocket = db.connectedClients.get(pk);
    if (clientSocket) {
        clientSocket.emit(channel, data);
    }
}