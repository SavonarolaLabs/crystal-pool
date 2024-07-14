import type { ExplorerTransaction } from './explorer';

export type TxPurpose = 'DEPOSIT';

export type SubmittedTxRox = {
	id: number;
	tx: ExplorerTransaction;
	purpose: TxPurpose;
};
