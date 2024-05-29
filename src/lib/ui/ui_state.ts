import { writable } from 'svelte/store';


let dummyOrders = []
for(let i = 0; i < 10; i++){
    const dummyRow = {
        price: "69,001.34",
        amount: "1.302628",
        value: "1.302628",
    };
    dummyOrders.push(dummyRow)
}

export const orderbook_sell = writable(dummyOrders);
export const orderbook_buy  = writable(dummyOrders);
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
