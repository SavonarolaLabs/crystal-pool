import type { Amount } from '@fleet-sdk/common';

type PK = string;
type Price = string;
type TradingPair = string;
type Side = 'BUY' | 'SELL';
type TokenId = string;

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
