import type { BoxDB } from '$lib/db/db';
import BigNumber from 'bignumber.js';
import { serializeBigInt } from './serializeBigInt';
import { TOKEN } from '$lib/constants/tokens';
import type { Amount } from '@fleet-sdk/common';

export function createOrderBook(tradingPair: string, db: BoxDB) {
	const filteredBoxRows = db.boxRows.filter((boxRow) => boxRow.parameters?.pair === tradingPair);
	console.log('filteredBoxRows', filteredBoxRows.length);
	const allOrders = filteredBoxRows.map((row) => {
		return {
			rate: row.parameters.rate, // todo rate to price conversion
			denom: row.parameters.denom,
			amount: row.box.assets[0].amount,
			side: row.parameters.side
		};
	});
	//parameters.rate

	const buyOrders = allOrders.filter((order) => order.side == 'buy');
	const sellOrders = allOrders.filter((order) => order.side == 'sell');

	console.log('sellOrders', sellOrders);
	const orderbook = {
		buy: buyOrders.map((r) => {
			return {
				price: Number(priceWithDenom(r.rate, r.denom)),
				amount: Number(amountWithDecimals(r.amount)),
				value: Number(volume(r.rate, r.denom, r.amount))
			};
		}),
		sell: sellOrders.map((r) => {
			return {
				price: Number(priceWithDenom(r.rate, r.denom)),
				amount: Number(amountWithDecimals(r.amount)),
				value: Number(volume(r.rate, r.denom, r.amount))
			};
		})
	};
	console.log('orderbook');
	console.log(orderbook);
	return serializeBigInt(orderbook);
}

function priceWithDenom(price: bigint, denom: bigint) {
	const real_price = BigNumber(price.toString()).dividedBy(denom.toString());

	const decimalsToken = TOKEN.rsBTC.decimals;
	const decimalsCurrency = TOKEN.sigUSD.decimals;

	const bigDecimalsToken = BigNumber(10).pow(decimalsToken);
	const bigDecimalsCurrency = BigNumber(10).pow(decimalsCurrency);

	const initial_input = real_price.multipliedBy(bigDecimalsToken).dividedBy(bigDecimalsCurrency);
	return initial_input.toString(10);
}

function amountWithDecimals(amount: Amount) {
	const decimals = TOKEN.rsBTC.decimals;
	return BigNumber(amount.toString()).dividedBy(BigNumber(10).pow(decimals)).toString(10);
}

function volume(price: bigint, denom: bigint, amount: Amount) {
	const decimalsCurrency = TOKEN.sigUSD.decimals;
	const real_price = BigNumber(price.toString()).dividedBy(denom.toString());
	return real_price
		.multipliedBy(amount.toString())
		.dividedBy(BigNumber(10).pow(decimalsCurrency))
		.toString(10);
}
