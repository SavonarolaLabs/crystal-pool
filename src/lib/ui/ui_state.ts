import { ALICE_ADDRESS, BOB_ADDRESS } from '$lib/constants/addresses';
import { get, writable, type Writable } from 'svelte/store';
import { userBoxes } from './service/crystalPoolService';
import { sumAssets } from '$lib/utils/helper';
import { ALICE_MNEMONIC, BOB_MNEMONIC } from '$lib/constants/mnemonics';

// market trades

interface MarketTrade {
    price: number,
    amount: number,
    time: string,
    side: string,
}

const dummy_trades = Array.from({ length: 11 }, () => ({
    price: 69001.34,
    amount: 1.302628,
    time: '20:20:12',
    side: Math.random() < 0.5 ? 'buy' : 'sell'
}));

export const market_trades: Writable<Array<MarketTrade>> = writable(dummy_trades);

export function addRecentTrades(recentTrades: Array<MarketTrade>) {
    market_trades.update(trades => {
        const updatedTrades = [...recentTrades, ...trades];
        if (updatedTrades.length > 50) {
            updatedTrades.length = 50;
        }
        return updatedTrades;
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
        const groupedBuyOrders = groupOrdersByPrice(book.buy, step);
        const groupedSellOrders = groupOrdersByPrice(book.sell, step);
        
        orderbook_buy.set(groupedBuyOrders);
        orderbook_sell.set(groupedSellOrders);
    }
}


// wallet balance
export const user_mnemonic = writable(BOB_MNEMONIC);
export const user_address = writable(BOB_ADDRESS);

export function setUserAlice(){
	user_mnemonic.set(ALICE_MNEMONIC);
	user_address.set(ALICE_ADDRESS);
}

export const user_tokens = writable([
	{
		name: 'rsBTC',
		tokenId: '5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
		amount: 0,
		decimals: 9
	},
	{
		name: 'sigUSD',
		tokenId: '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04',
		amount: 0,
		decimals: 2
	}
]);

export async function fetchBalance() {
    console.log("refetching balance")
	const address = get(user_address);
	if (address) {
		const boxes = await userBoxes(address);
		const tokens = boxes
			.flatMap((row: { box: { assets: any; }; }) => row.box.assets)
			.reduce(sumAssets, []);
        user_tokens.update(all =>{
            all.forEach(t =>{
                t.amount = Number(tokens.find((x: { tokenId: string; }) => x.tokenId == t.tokenId)?.amount??t.amount)
            })
            return all
        })
	}

}
