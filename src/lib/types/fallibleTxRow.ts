import type { ConfirmedTransaction } from './explorer';

export type TxPurpose = 'DEPOSIT';

export type SubmittedTxRox = {
	id: number;
	tx: ConfirmedTransaction;
	purpose: TxPurpose;
};
