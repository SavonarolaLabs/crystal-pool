import type { ExplorerTransaction } from './explorer';

export type TxPurpose = 'DEPOSIT';

export type FallibleTxRow = {
	id: number;
	tx: ExplorerTransaction;
	purpose: TxPurpose;
};
