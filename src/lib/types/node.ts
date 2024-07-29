export type TransactionNode = {
	id: string;
	inputs: {
		boxId: string;
		spendingProof: {
			proofBytes: string;
			extension: {
				[key: string]: string;
			};
		};
	}[];
	dataInputs: {
		boxId: string;
	}[];
	outputs: {
		boxId: string;
		value: number;
		ergoTree: string;
		creationHeight: number;
		assets: {
			tokenId: string;
			amount: number;
		}[];
		additionalRegisters: {
			[key: string]: string;
		};
		transactionId: string;
		index: number;
	}[];
	size: number;
};
