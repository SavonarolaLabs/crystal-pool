export type WithdrawRequestParams = {
	address: string;
    withdrawAddress: string;
	tokens: Array<{ tokenId: string; amount: string }>;
	value: bigint;
};
