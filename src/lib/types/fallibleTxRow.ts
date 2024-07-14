import type { ConfirmedTransaction, ExplorerTransaction } from './explorer';

export type TxPurpose = 'DEPOSIT';

export type SubmittedTxRox = {
	id: number;
	tx: ExplorerTransaction;
	purpose: TxPurpose;
};
