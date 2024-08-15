import type { ConfirmedTransaction, ExplorerTransaction } from './explorer';

export type TxPurpose = 'DEPOSIT' | 'PROXY_TO_DEPOSIT';

export type SubmittedTxRox = {
	id: string;
	tx: ExplorerTransaction;
	purpose: TxPurpose;
};
