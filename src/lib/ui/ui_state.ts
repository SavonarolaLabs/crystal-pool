import { get, writable, type Writable } from 'svelte/store';
import { userBoxes } from './service/crystalPoolService';
import { sumAssets, sumAssetsFromBoxes, sumNanoErg } from '$lib/utils/helper';
import { showToast } from './header/toaster';
import { TOKEN } from '$lib/constants/tokens';
import type { Amount, Box, SignedTransaction, TokenAmount } from '@fleet-sdk/common';
import type { TxHistoryEntry } from '$lib/types/txHistory';
import { serializeBigInt } from '../utils/serializeBigInt';
import type { BoxRow } from '$lib/types/boxRow';
import { goto } from '$app/navigation';

export const web3wallet_connected = writable(false);
export const web3wallet_wallet_name = writable('');
export const web3wallet_available_wallets = writable([]);
export const web3wallet_confirmedTokens = writable([]);
/*
export const crystalwallet_tokens = writable([{
	tokenId: "0cd8c9f416e5b1ca9f986a7f10a84191dfb85941619e49e53c0dc30ebf83324b", //tokenId
	amount: 322
}]);

export const pending_deposits = writable([{
	counter : 55,
	value : 0,
	assetCount : 1,
	txId : 'd1c3ddf35d140f1155d5997edc48564145905bc57cef8ec728bed2135332adbc',
},{
	counter : 0,
	value : 100,
	assetCount : 0,
	txId : 'f54150801685b1cd77120625c28a00bcdef7952711ab980d66f0f37d810f9666',
},]);
*/
let crystalwallet_state_loaded_resolve;
export const crystalwallet_state_loaded = new Promise((resolve) => {
	crystalwallet_state_loaded_resolve = resolve;
});

export function resolveCrystalwalletStateLoaded() {
	if (crystalwallet_state_loaded_resolve) {
		crystalwallet_state_loaded_resolve();
	}
}

export async function ifWalletLockedGotoWallet() {
	await crystalwallet_state_loaded;
	if (get(crystalwallet_locked)) {
		goto('/wallet');
		return true; // Wallet is locked, return true
	}
	return false; // Wallet is not locked, return false
}

export const crystalwallet_locked: Writable<boolean> = writable(false);
export const crystalwallet_value: Writable<bigint> = writable(0n);
export const crystalwallet_tokens: Writable<TokenAmount<Amount>[]> = writable([]);
export const pending_deposits: Writable<TxHistoryEntry[]> = writable([]);

export const show_wallet_unlock_dialog: Writable<boolean> = writable(false);

// tx history start
export const tx_history: Writable<TxHistoryEntry[]> = writable([]);

export const mempool_size: Writable<Number> = writable(0);

export async function addWeb3WalletDepositTx(
	tx: SignedTransaction,
	value: bigint,
	tokens: TokenAmount<Amount>[]
) {
	const txEntry: TxHistoryEntry = {
		timestamp: Date.now(),
		phase: 'MEMPOOL',
		action: 'DEPOSIT',
		crystalPoolAck: false,
		txId: tx.id,
		value,
		tokens
	};
	tx_history.update((a) => {
		a = [txEntry, ...a];
		return a;
	});
	persistTxHistory();
}

export async function addMobileProxyStuckTx(boxRows: BoxRow[]) {
	const txEntry: TxHistoryEntry = {
		timestamp: Date.now(),
		phase: 'MEMPOOL',
		action: 'PROXY_STUCK',
		crystalPoolAck: true,
		txId: boxRows[0].box.transactionId,
		value: sumNanoErg(boxRows.map((row) => row.box)),
		tokens: sumAssetsFromBoxes(boxRows.map((row) => row.box))
	};

	tx_history.update((a) => {
		a = [txEntry, ...a];
		return a;
	});

	persistTxHistory();
}

export async function unstuckMobileProxyTx(boxRows: BoxRow[]) {
	const txEntry: TxHistoryEntry = {
		timestamp: Date.now(),
		phase: 'MEMPOOL',
		action: 'PROXY_STUCK',
		crystalPoolAck: true,
		txId: boxRows[0].box.transactionId,
		value: sumNanoErg(boxRows.map((row) => row.box)),
		tokens: sumAssetsFromBoxes(boxRows.map((row) => row.box))
	};

	tx_history.update((a) => {
		a.forEach((tx) => {
			if (boxRows.some((b) => b.box.transactionId == tx.txId)) {
				tx.action = 'DEPOSIT';
			}
		});
		return a;
	});

	persistTxHistory();
}

export function persistTxHistory() {
	localStorage.setItem('tx_history', serializeBigInt(get(tx_history)));
}

export function loadTxHistory() {
	const storedHistory = localStorage.getItem('tx_history');
	if (storedHistory) {
		try {
			const parsedHistory: TxHistoryEntry[] = JSON.parse(storedHistory);
			updateTxHistoryState(parsedHistory);
		} catch (error) {
			console.error('Failed to parse transaction history from local storage', error);
		}
	}
}

function updateTxHistoryState(parsedHistory) {
	tx_history.set(parsedHistory);
	const pending = parsedHistory.filter(
		(x) => (!x.crystalPoolAck && x.action == 'DEPOSIT') || x.action == 'PROXY_STUCK'
	);
	pending_deposits.set(pending);
}

// tx history end

export async function loadWeb3WalletTokens() {
	try {
		const utxo = await ergo.get_utxos();
		const tokens = utxo.flatMap((box) => box.assets).reduce(sumAssets, []);
		web3wallet_confirmedTokens.set(tokens);
	} catch (e) {
		showToast(`Failed to load ${get(web3wallet_wallet_name)} balance.`, 'warning');
	}
}

export async function initWeb3WalletState() {
	const name = localStorage.getItem('ui_web3wallet_wallet_name');
	if (name) {
		web3wallet_wallet_name.set(name);
	}
	if (window.ergoConnector) {
		web3wallet_available_wallets.set(Object.keys(window.ergoConnector));
		if (get(web3wallet_wallet_name)) {
			if (window.ergoConnector[get(web3wallet_wallet_name)]?.isConnected) {
				await window.ergoConnector[get(web3wallet_wallet_name)]?.connect();
				web3wallet_connected.set(true);
				await loadWeb3WalletTokens();
			}
		} else {
			const connected = await window.ergoConnector[get(web3wallet_wallet_name)]?.connect();
			if (connected) {
				web3wallet_connected.set(true);
				await loadWeb3WalletTokens();
			} else {
				showToast('Wallet reconnect failed', 'warning');
			}
		}
	}
}

export async function disconnectWeb3Wallet() {
	await window.ergoConnector[get(web3wallet_wallet_name)].disconnect();
	web3wallet_connected.set(false);
	web3wallet_wallet_name.set('');
	localStorage.removeItem('ui_web3wallet_wallet_name');
}

export async function connectWeb3Wallet(walletname = '') {
	const wallets = window.ergoConnector ? Object.keys(window.ergoConnector) : [];
	if (wallets.length > 0) {
		let connected = await window.ergoConnector[wallets[0]].connect();
		if (connected) {
			web3wallet_connected.set(true);
			web3wallet_wallet_name.set(wallets[0]);
			localStorage.setItem('ui_web3wallet_wallet_name', wallets[0]);
			showToast(`Wallet connected.`);
			await loadWeb3WalletTokens();
		} else {
			showToast(`Connecting ${wallets[0]} failed.`, 'warning');
		}
	}
}

export const isDarkMode = writable(true);

export function toggleTheme() {
	if (typeof document !== 'undefined') {
		const currentTheme = document.documentElement.getAttribute('data-theme');
		const newTheme = currentTheme === 'light' ? 'dark' : 'light';
		document.documentElement.setAttribute('data-theme', newTheme);
		localStorage.setItem('ui_isDarkMode', newTheme);
		isDarkMode.set(newTheme == 'dark');
	}
}

export async function loadUIState() {
	const ui_isDarkMode = localStorage.getItem('ui_isDarkMode');
	if (ui_isDarkMode == 'light') {
		document.documentElement.setAttribute('data-theme', 'light');
		isDarkMode.set(false);
	}
	await initWeb3WalletState();
	loadTxHistory();
}

// wallet_initialized
export const wallet_initialized = writable(false);

// market trades

interface MarketTrade {
	price: number;
	amount: number;
	time: string;
	side: string;
}

const dummy_trades = Array.from({ length: 50 }, () => ({
	price: 69001.34,
	amount: 1.302628,
	time: '20:20:12',
	side: Math.random() < 0.5 ? 'BUY' : 'SELL'
}));

export const market_trades: Writable<Array<MarketTrade>> = writable(dummy_trades);

export function addRecentTrades(recentTrades: Array<MarketTrade>) {
	market_trades.update((trades) => {
		const updatedTrades = [...recentTrades, ...trades];
		if (updatedTrades.length > 50) {
			updatedTrades.length = 50;
		}
		return updatedTrades;
	});
	recentTrades.forEach((trade) => {
		orderbook_latest.set({
			price: trade.price.toFixed(2),
			value: (trade.price * trade.amount).toFixed(2),
			side: trade.side
		});
		showToast(
			`order filled: ${trade.amount}rsBTC for $${(trade.price * trade.amount).toFixed(2)}`,
			'success'
		);
	});
}

interface Order {
	price: number;
	amount: number;
	value: number;
}

export const orderbook_sell: Writable<Array<Order>> = writable([]);
export const orderbook_buy: Writable<Array<Order>> = writable([]);
export const orderbook_latest = writable({
	price: '69,001.34',
	value: '69,001.34',
	side: 'SELL'
});

function roundToStep(price: number, step: number): number {
	return Math.floor(price / step) * step;
}

function groupOrdersByPrice(orders: any[], step: number): Order[] {
	const groupedOrders: { [key: number]: Order } = {};

	for (const order of orders) {
		const roundedPrice = roundToStep(order.price, step);

		if (!groupedOrders[roundedPrice]) {
			groupedOrders[roundedPrice] = {
				price: roundedPrice,
				amount: 0,
				value: 0
			};
		}

		groupedOrders[roundedPrice].amount += order.amount;
		groupedOrders[roundedPrice].value += parseFloat(order.value);
	}

	return Object.values(groupedOrders);
}

export async function setOrderBook(book: any) {
	const step = 0.01;

	if (book?.buy) {
		const groupedBuyOrders = groupOrdersByPrice(book.buy, step).sort(
			(a, b) => b.price - a.price
		);
		const groupedSellOrders = groupOrdersByPrice(book.sell, step);

		orderbook_buy.set(groupedBuyOrders);
		orderbook_sell.set(groupedSellOrders);
	}
}

// wallet balance
export const user_mnemonic = writable('');
export const user_address = writable('');
export const user_deposit_boxes: Writable<Box[]> = writable([]);

export const user_tokens = writable([
	{
		name: TOKEN.rsBTC.name,
		tokenId: TOKEN.rsBTC.tokenId,
		amount: 0,
		decimals: TOKEN.rsBTC.decimals
	},
	{
		name: TOKEN.SigUSD.name,
		tokenId: TOKEN.SigUSD.tokenId,
		amount: 0,
		decimals: TOKEN.SigUSD.decimals
	}
]);

export async function fetchBalance() {
	const address = get(user_address);
	if (address) {
		const boxes = await userBoxes(address);
		user_deposit_boxes.set(boxes.filter((row) => row.contract == 'DEPOSIT').map((r) => r.box));

		const updatedTokens = boxes
			.flatMap((row: { box: { assets: any } }) => row.box.assets)
			.reduce(sumAssets, []);
		user_tokens.update((all) => {
			all.forEach((t) => {
				t.amount = Number(
					updatedTokens.find((x: { tokenId: string }) => x.tokenId == t.tokenId)
						?.amount ?? 0n
				);
			});
			return all;
		});
	}
}

// system state
const SIX_MONTH_BLOCKS = 262_800 / 2;
export const next_unlock_height = writable(1_322_704 + SIX_MONTH_BLOCKS);
