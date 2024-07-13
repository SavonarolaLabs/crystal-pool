type ExplorerAsset = {
	tokenId: string;
	index: number;
	amount: number;
	name: string;
	decimals: number;
	type: string;
};

export type ExplorerInput = {
	boxId: string;
	value: number;
	index: number;
	spendingProof: string | null;
	outputBlockId: string;
	outputTransactionId: string;
	outputIndex: number;
	outputGlobalIndex: number;
	outputCreatedAt: number;
	outputSettledAt: number;
	ergoTree: string;
	ergoTreeConstants: string;
	ergoTreeScript: string;
	address: string;
	assets: ExplorerAsset[];
	additionalRegisters: Record<string, any>;
};

export type ExplorerOutput = {
	boxId: string;
	transactionId: string;
	blockId: string;
	value: number;
	index: number;
	globalIndex: number;
	creationHeight: number;
	settlementHeight: number;
	ergoTree: string;
	ergoTreeConstants: string;
	ergoTreeScript: string;
	address: string;
	assets: ExplorerAsset[];
	additionalRegisters: Record<string, any>;
	spentTransactionId: string | null;
	mainChain: boolean;
};

export type ExplorerTransaction = {
	id: string;
	blockId: string;
	inclusionHeight: number;
	timestamp: number;
	index: number;
	globalIndex: number;
	numConfirmations: number;
	inputs: ExplorerInput[];
	dataInputs: any[];
	outputs: ExplorerOutput[];
	size: number;
};
