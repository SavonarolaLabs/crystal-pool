import { writable } from 'svelte/store';

export const orderbook_sell = writable([]);
export const orderbook_buy  = writable([]);
export const orderbook_latest = writable({
    price: "69,001.34",
    value: "69,001.34",
    side: "sell",
});

export async function setOrderBook(book:any){
    if (book?.buy){
        orderbook_buy.set(book.buy);
        orderbook_sell.set(book.sell);
    }
}
