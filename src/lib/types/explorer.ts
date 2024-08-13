import type { SignedTransaction } from '@fleet-sdk/common';

type Asset = {
	tokenId: string;
	index: number;
	amount: number;
	name: string;
	decimals: number;
	type: string;
};

type CommonInput = {
	boxId: string;
	value: number;
	index: number;
	ergoTree: string;
	ergoTreeConstants: string;
	ergoTreeScript: string;
	address: string;
	assets: Asset[];
	additionalRegisters: Record<string, any>;
};

type UnconfirmedInput = CommonInput;

type ConfirmedInput = CommonInput & {
	spendingProof: string | null;
	outputBlockId: string;
	outputTransactionId: string;
	outputIndex: number;
	outputGlobalIndex: number;
	outputCreatedAt: number;
	outputSettledAt: number;
};

type CommonOutput = {
	boxId: string;
	value: number;
	index: number;
	creationHeight: number;
	ergoTree: string;
	ergoTreeConstants: string;
	ergoTreeScript: string;
	address: string;
	assets: Asset[];
	additionalRegisters: Record<string, any>;
};

type UnconfirmedOutput = CommonOutput;

export type ConfirmedOutput = CommonOutput & {
	transactionId: string;
	blockId: string;
	globalIndex: number;
	settlementHeight: number;
	spentTransactionId: string | null;
	mainChain: boolean;
};

export type ConfirmedTransaction = {
	id: string;
	blockId: string;
	inclusionHeight: number;
	timestamp: number;
	index: number;
	globalIndex: number;
	numConfirmations: number;
	inputs: ConfirmedInput[];
	dataInputs: any[];
	outputs: ConfirmedOutput[];
	size: number;
};

export type UnconfirmedTransaction = {
	id: string;
	inputs: UnconfirmedInput[];
	dataInputs: any[];
	outputs: UnconfirmedOutput[];
	creationTimestamp: number;
	size: number;
};

export type ExplorerTransaction = {
	confirmed?: ConfirmedTransaction;
	unconfirmed?: UnconfirmedTransaction | SignedTransaction;
};
