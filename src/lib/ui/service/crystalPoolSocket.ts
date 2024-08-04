import { io, Socket } from 'socket.io-client';
import { get, writable } from 'svelte/store';
import type { DefaultEventsMap } from '@socket.io/component-emitter';
import {
	addMobileProxyStuckTx,
	addRecentTrades,
	crystalwallet_tokens,
	crystalwallet_value,
	fetchBalance,
	mempool_size,
	setOrderBook,
	unstuckMobileProxyTx,
	user_address
} from '$lib/ui/ui_state';
import type { Amount, TokenAmount } from '@fleet-sdk/common';
import type { BalanceUpdate } from '$lib/types/trading';
import { showToast } from '../header/toaster';
import { ergoTokens } from '$lib/constants/ergoTokens';
import { asBigInt } from '$lib/utils/helper';

export const receivedDataList = writable<any[]>([]);

function createSocket(): Socket<DefaultEventsMap, DefaultEventsMap> {
	const socket = io('http://127.0.0.1:3000');

	socket.on('connect', () => {
		console.log('Connected to the server:', socket.id);
		user_address.subscribe((pk) => {
			if (pk) socket.emit('pk', { pk });
		});
	});

	socket.on('orderbook', (data) => {
		try {
			const book = JSON.parse(data);
			setOrderBook(book);
			fetchBalance();
		} catch (e) {
			//Gotta catch 'em all!
		}
	});

	socket.on('trades', (data) => {
		try {
			const trades = JSON.parse(data);
			addRecentTrades(trades);
		} catch (e) {
			//Gotta catch 'em all!
		}
	});

	socket.on('mempoolSize', (data) => {
		try {
			console.log('mempoolSize', data);
			mempool_size.set(data);
		} catch (e) {
			//Gotta catch 'em all!
		}
	});

	socket.on('error_proxy_insufficient_erg', ({ boxRows }) => {
		try {
			console.error('insufficinet funds proxy boxes', boxRows);
			addMobileProxyStuckTx(boxRows);
		} catch (e) {
			//Gotta catch 'em all!
		}
	});

	socket.on('fix_proxy_insufficient_erg', ({ boxRows }) => {
		try {
			console.log('funds forwarded', boxRows);
			unstuckMobileProxyTx(boxRows);
		} catch (e) {
			//Gotta catch 'em all!
		}
	});

	socket.on('balance', ({ value, tokens }: BalanceUpdate) => {
		crystalwallet_value.set(asBigInt(value));
		crystalwallet_tokens.set(tokens);
	});

	socket.on('deposit', ({ value, tokens }: BalanceUpdate) => {
		showToast(`DEPOSIT: ${asBigInt(value) / 10n ** 9n}ERG`);
		tokens.forEach((token) => {
			if (ergoTokens[token.tokenId]) {
				showToast(`DEPOSIT: ${token.amount} ${ergoTokens[token.tokenId].ticker}`);
			}
		});
	});
	return socket;
}

let socket: Socket<DefaultEventsMap, DefaultEventsMap> | undefined;

export function initSocket() {
	if (typeof window !== 'undefined') {
		if (!window.__socket) {
			window.__socket = createSocket();
		}
		socket = window.__socket;
	}
}

/*
export function joinRoom(room: string) {
  if (socket) {
    socket.emit('join', room);
  }
}

export function emitExampleEvent() {
  if (socket) {
    socket.emit('exampleEvent', { message: 'Hello from the client!' });
  }
}
*/
