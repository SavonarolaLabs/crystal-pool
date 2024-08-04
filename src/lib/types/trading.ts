import type { Amount, TokenAmount } from '@fleet-sdk/common';

export type PK = string;
export type Price = string;
export type TradingPair = string;
export type Side = 'BUY' | 'SELL';
export type TokenId = string;
export type TransactionId = string;

export type SwapRequest = {
	makerPk: PK;
	//makerDepositBoxes: Box[],
	nanoErg: bigint;
	price: Price;
	makerToken: { tokenId: string; amount: Amount };
	takerTokenId: TokenId;
	tradingPair: TradingPair;
	side: Side;
};

export type BalanceUpdate = {
	value: bigint;
	tokens: TokenAmount<Amount>[];
};
