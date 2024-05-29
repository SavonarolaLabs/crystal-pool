import type { Box } from '@fleet-sdk/common';

export enum ContractType {
	DEPOSIT,
	BUY,
	SELL,
	SWAP,
	UNKNOWN
}

export type DepositParams = {
	userPk: string;
	poolPk: string;
	unlockHeight: number;
};

export type BuyParams = DepositParams & {
	tokenId: string;
	buyRate: bigint;
	buyerMultisigAddress: string;
	pair: string;
	side: string;
};

export type SellParams = DepositParams & {
	tokenId: string;
	sellRate: bigint;
	sellerMultisigAddress: string;
	pair: string;
	side: string;
};

export type SwapParams = DepositParams & {
	sellingTokenId: string;
	buyingTokenId: string;
	rate: bigint;
	sellerMultisigAddress: string;
	pair: string;
	side: string;
};

export type BoxParameters = {
	contract: ContractType;
	parameters: DepositParams | BuyParams | SellParams | SwapParams;
};

export type BoxRow = {
	id: number;
	box: Box;
	contract: ContractType;
	parameters: DepositParams | BuyParams | SellParams | SwapParams;
	unspent: Boolean;
};
