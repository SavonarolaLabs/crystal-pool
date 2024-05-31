import { BOB_ADDRESS } from '$lib/constants/addresses';
import { get, writable } from 'svelte/store';
import { userBoxes } from './service/crystalPoolService';
import { sumAssets } from '$lib/utils/helper';
import { BOB_MNEMONIC } from '$lib/constants/mnemonics';

// orderbook
export const orderbook_sell = writable([]);
export const orderbook_buy = writable([]);
export const orderbook_latest = writable({
	price: '69,001.34',
	value: '69,001.34',
	side: 'sell'
});

export async function setOrderBook(book: any) {
	if (book?.buy) {
		orderbook_buy.set(book.buy);
		orderbook_sell.set(book.sell);
	}
}

// wallet balance
export const user_mnemonic = writable(BOB_MNEMONIC);
export const user_address = writable(BOB_ADDRESS);
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
