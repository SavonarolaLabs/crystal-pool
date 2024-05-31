import type { BoxDB } from '$lib/db/db';
import { asBigInt } from '$lib/utils/helper';
import { serializeBigInt } from './serializeBigInt';

export function createOrderBook(tradingPair: string, db: BoxDB) {
    const filteredBoxRows = db.boxRows.filter(
        (boxRow) => boxRow.parameters?.pair === tradingPair
    );
    const allOrders = filteredBoxRows.map((row) => {
        return {
            rate: row.parameters.rate, // todo rate to price conversion
            amount: row.box.assets[0].amount,
            side: row.parameters.side
        };
    });
    const buyOrders = allOrders.filter((order) => order.side == 'buy');
    const sellOrders = allOrders.filter(
        (order) => order.side == 'sell'
    );
    const orderbook = {
        buy: buyOrders.map((r) => {
            return {
                price: Number(r.rate)*10**(9-2),
                amount: Number(r.amount)/10**9,
                value: (Number(r.rate) * Number(r.amount)/10**(2)).toFixed(2)
            };
        }),
        sell: sellOrders.map((r) => {
            return {
                price: Number(r.rate)*10**(9-2),
                amount: Number(r.amount)/10**9,
                value: (Number(r.rate) * Number(r.amount)/10**(2)).toFixed(2)
            };
        })
    };

    return serializeBigInt(orderbook);
}
