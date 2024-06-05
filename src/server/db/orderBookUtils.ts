import type { BoxDB } from './db';
import BigNumber from 'bignumber.js';
import { serializeBigInt } from './serializeBigInt';
import type { Amount } from '@fleet-sdk/common';
import { TOKEN } from '$lib/constants/tokens';

export function createOrderBook(tradingPair: string, db: BoxDB) {
	// @ts-ignore
	const filteredBoxRows = db.boxRows.filter((boxRow) => boxRow.parameters?.pair === tradingPair);
	const allOrders = filteredBoxRows.map((row) => {
		return {
			// @ts-ignore
			rate: row.parameters.rate,
			// @ts-ignore
			denom: row.parameters.denom,
			amount: row.box.assets[0].amount,
			// @ts-ignore
			side: row.parameters.side
		};
	});
	//parameters.rate

	const buyOrders = allOrders.filter((order) => order.side == 'buy');
	const sellOrders = allOrders.filter((order) => order.side == 'sell');

	const orderbook = {
		buy: buyOrders.map((r) => {
			return {
				price: Number(buyPrice(r.rate, r.denom)),
				amount: Number(buyAmount(r.rate, r.denom, r.amount)),
				value: Number(buyValue(r.amount))
			};
		}),
		sell: sellOrders.map((r) => {
			return {
				price: Number(sellPrice(r.rate, r.denom)),
				amount: Number(sellAmount(r.amount)),
				value: Number(sellValue(r.rate, r.denom, r.amount))
			};
		})
	};
	return serializeBigInt(orderbook);
}

function buyValue(amount: Amount) {
	const decimalsCurrency = TOKEN.sigUSD.decimals;
	return BigNumber(amount.toString()).dividedBy(BigNumber(10).pow(decimalsCurrency));
}

function buyAmount(price: bigint, denom: bigint, amount: Amount) {
	//0.00001
	const decimalsToken = TOKEN.rsBTC.decimals;
	const real_price = BigNumber(price.toString()).dividedBy(denom.toString());
	const real_amount = real_price
		.multipliedBy(amount.toString())
		.dividedBy(BigNumber(10).pow(decimalsToken));
	return real_amount.toString(10);
}

function buyPrice(price: bigint, denom: bigint) {
	const real_price = BigNumber(price.toString()).dividedBy(denom.toString());
	//500n
	const decimalsToken = TOKEN.rsBTC.decimals;
	const decimalsCurrency = TOKEN.sigUSD.decimals;
	const bigDecimalsToken = BigNumber(10).pow(decimalsToken);
	const bigDecimalsCurrency = BigNumber(10).pow(decimalsCurrency);

	return bigDecimalsToken.dividedBy(BigNumber(real_price)).dividedBy(bigDecimalsCurrency);
}

function sellPrice(price: bigint, denom: bigint) {
	const real_price = BigNumber(price.toString()).dividedBy(denom.toString());

	const decimalsToken = TOKEN.rsBTC.decimals;
	const decimalsCurrency = TOKEN.sigUSD.decimals;

	const bigDecimalsToken = BigNumber(10).pow(decimalsToken);
	const bigDecimalsCurrency = BigNumber(10).pow(decimalsCurrency);

	const initial_input = real_price.multipliedBy(bigDecimalsToken).dividedBy(bigDecimalsCurrency);
	return initial_input.toString(10);
}

function sellAmount(amount: Amount) {
	const decimals = TOKEN.rsBTC.decimals;
	return BigNumber(amount.toString()).dividedBy(BigNumber(10).pow(decimals)).toString(10);
}

function sellValue(price: bigint, denom: bigint, amount: Amount) {
	const decimalsCurrency = TOKEN.sigUSD.decimals;
	const real_price = BigNumber(price.toString()).dividedBy(denom.toString());
	return real_price
		.multipliedBy(amount.toString())
		.dividedBy(BigNumber(10).pow(decimalsCurrency))
		.toString(10);
}
