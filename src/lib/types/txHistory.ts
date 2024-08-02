import type { Amount, TokenAmount } from '@fleet-sdk/common';

export type TxHistoryEntry = {
	action: 'DEPOSIT' | 'WITHDRAW' | 'PROXY_STUCK';
	txId: string;
	timestamp: number;
	phase: 'MEMPOOL' | 'BLOCKCHAIN';
	crystalPoolAck: boolean;
	block?: number;
	value: bigint;
	tokens: TokenAmount<Amount>[];
};
