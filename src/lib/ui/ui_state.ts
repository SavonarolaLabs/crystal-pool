import { ALICE_ADDRESS, BOB_ADDRESS } from '$lib/constants/addresses';
import { get, writable, type Writable } from 'svelte/store';
import { userBoxes } from './service/crystalPoolService';
import { sumAssets } from '$lib/utils/helper';
import { ALICE_MNEMONIC, BOB_MNEMONIC } from '$lib/constants/mnemonics';
import { showToast } from './toaster';
import { TOKEN } from '$lib/constants/tokens';

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
	side: Math.random() < 0.5 ? 'buy' : 'sell'
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
		showToast(
			`SOLD: ${trade.amount}rsBTC for $${(trade.price * trade.amount).toFixed(2)}`,
			'success'
		);
	});
}

// orderbook

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
	side: 'sell'
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
export const user_name = writable('Bob');
export const user_mnemonic = writable(BOB_MNEMONIC);
export const user_address = writable(BOB_ADDRESS);

export function setUserAlice() {
	user_name.set('Alice');
	user_mnemonic.set(ALICE_MNEMONIC);
	user_address.set(ALICE_ADDRESS);
}

export function setUserBob() {
	user_name.set('Bob');
	user_mnemonic.set(BOB_MNEMONIC);
	user_address.set(BOB_ADDRESS);
}

export function toggleWallet() {
	get(user_name) == 'Bob' ? setUserAlice() : setUserBob();
	fetchBalance();
}

export const user_tokens = writable([
	{
		name: TOKEN.rsBTC.name,
		tokenId: TOKEN.rsBTC.tokenId,
		amount: 0,
		decimals: TOKEN.rsBTC.decimals
	},
	{
		name: TOKEN.sigUSD.name,
		tokenId: TOKEN.sigUSD.tokenId,
		amount: 0,
		decimals: TOKEN.sigUSD.decimals
	}
]);

export async function fetchBalance() {
	console.log('refetching balance', get(user_name));
	const address = get(user_address);
	if (address) {
		const boxes = await userBoxes(address);
		console.log(boxes);
		const updatedTokens = boxes
			.flatMap((row: { box: { assets: any } }) => row.box.assets)
			.reduce(sumAssets, []);
		user_tokens.update((all) => {
			all.forEach((t) => {
				t.amount = Number(
					updatedTokens.find((x: { tokenId: string }) => x.tokenId == t.tokenId)?.amount ??
						0n
				);
			});
			return all;
		});
	}
}
