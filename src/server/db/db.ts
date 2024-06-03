import { type Box, type EIP12UnsignedTransaction } from '@fleet-sdk/common';
import type { ContractType, BoxParameters, BoxRow } from '../../lib/types/boxRow';
import type { TxRow } from '../../lib/types/txRow';
import { ErgoAddress, ErgoTree } from '@fleet-sdk/core';
import {
	BUY_ORDER_ADDRESS,
	DEPOSIT_ADDRESS,
	SELL_ORDER_ADDRESS,
	SWAP_ORDER_ADDRESS
} from '../../lib/constants/addresses';
import { parse } from '@fleet-sdk/serializer';
import { tradingPairs } from '../../lib/constants/tokens';
import { persistBox, persistMultipleBoxes, loadBoxRows, deleteMultipleBoxes } from './sqlDb';
import { initDeposits } from '../../lib/server-agent/simulator';

interface HasId {
	id: number;
}

export type BoxDB = {
	boxRows: BoxRow[];
	txes: TxRow[];
};

export async function initDb(): Promise<BoxDB> {
	const boxRows: BoxRow[] = (await loadBoxRows()) ?? [];
	return {
		boxRows,
		txes: []
	};
}

export async function initDepositUtxo(db: BoxDB) {
	if (db.boxRows?.length == 0) {
		const aliceAndBobDeposits = await initDeposits();
		db_addBoxes(db, aliceAndBobDeposits);
	}
}

function nextId(table: HasId[]): number {
	const maxId = Math.max(...table.map((row) => row.id), 0);
	return maxId;
}

export function db_addBox(db: BoxDB, box: Box) {
	const boxParams = parseBox(box);
	if (boxParams) {
		const newRow: BoxRow = {
			id: nextId(db.boxRows),
			contract: boxParams.contract,
			parameters: boxParams.parameters,
			box,
			unspent: true
		};
		db.boxRows.push(newRow);
		persistBox(newRow); // Insert into database
	} else {
		console.error('db_addBox() invalid box: ', JSON.stringify(box));
	}
}

export function db_removeBoxesByBoxIds(db: BoxDB, removeBoxIds: string[]) {
	const deleteBoxIds = db.boxRows
		.filter((row) => removeBoxIds.includes(row.box.boxId))
		.map((row) => row.id);
	if (deleteBoxIds.length > 0) {
		deleteMultipleBoxes(deleteBoxIds);
		db.boxRows = db.boxRows.filter((row) => !deleteBoxIds.includes(row.id));
	}
}

export function db_addBoxes(db: BoxDB, boxRows: Box[]) {
	const newBoxRows = boxRows
		.map((box) => {
			const boxParams = parseBox(box);
			if (boxParams) {
				return {
					id: nextId(db.boxRows),
					contract: boxParams.contract,
					parameters: boxParams.parameters,
					box,
					unspent: true
				} as BoxRow;
			} else {
				console.error('db_addBoxes() invalid box: ', JSON.stringify(box));
				return null;
			}
		})
		.filter((row) => row !== null) as BoxRow[];

	db.boxRows.push(...newBoxRows);
	persistMultipleBoxes(newBoxRows); // Insert multiple rows into database
}

export function db_addTx(db: BoxDB, tx: EIP12UnsignedTransaction) {
	const newRow: TxRow = {
		id: nextId(db.txes),
		unsignedTx: tx,
		commitments: [],
		hintbags: []
	};
	db.txes.push(newRow);
}

// application level
export function userBoxes(address: string) {}

// parsing

export function contractTypeFromErgoTree(box: Box): ContractType {
	const address = new ErgoTree(box.ergoTree).toAddress().toString();
	if (address == DEPOSIT_ADDRESS) {
		return 'DEPOSIT';
	} else if (address == BUY_ORDER_ADDRESS) {
		return 'BUY';
	} else if (address == SELL_ORDER_ADDRESS) {
		return 'SELL';
	} else if (address == SWAP_ORDER_ADDRESS) {
		return 'SWAP';
	} else {
		return 'UNKNOWN';
	}
}

export function parseBox(
	box: Box,
	getContractType = contractTypeFromErgoTree
): BoxParameters | undefined {
	const contractType = getContractType(box);
	if (contractType == 'DEPOSIT') {
		const r4 = decodeR4(box);
		const r5 = decodeR5(box);
		if (r4 && r5) {
			return {
				contract: 'DEPOSIT',
				parameters: {
					userPk: r4.userPk,
					poolPk: r4.poolPk,
					unlockHeight: r5
				}
			};
		}
	} else if (contractType == 'BUY') {
		const r4 = decodeR4(box);
		const r5 = decodeR5(box);
		const r6 = decodeTokenIdFromR6(box);
		const r7 = decodeR7(box);
		const r8 = decodeR8(box);
		if (r4 && r5 && r6 && r7 && r8) {
			return {
				contract: 'BUY',
				parameters: {
					userPk: r4.userPk,
					poolPk: r4.poolPk,
					unlockHeight: r5,
					tokenId: r6,
					buyRate: r7,
					buyerMultisigAddress: r8
				}
			};
		}
	} else if (contractType == 'SELL') {
		const r4 = decodeR4(box);
		const r5 = decodeR5(box);
		const r6 = decodeTokenIdFromR6(box);
		const r7 = decodeR7(box);
		const r8 = decodeR8(box);
		if (r4 && r5 && r6 && r7 && r8) {
			return {
				contract: 'SELL',
				parameters: {
					userPk: r4.userPk,
					poolPk: r4.poolPk,
					unlockHeight: r5,
					tokenId: r6,
					sellRate: r7,
					sellerMultisigAddress: r8
				}
			};
		}
	} else if (contractType == 'SWAP') {
		const r4 = decodeR4(box);
		const r5 = decodeR5(box);
		const r6 = decodeTokenIdPairFromR6(box);
		const r7 = decodeR7(box);
		const r8 = decodeR8(box);
		const r9 = decodeR9(box);
		if (r4 && r5 && r6 && r7 && r8) {
			return {
				contract: 'SWAP',
				parameters: {
					userPk: r4.userPk,
					poolPk: r4.poolPk,
					unlockHeight: r5,
					buyingTokenId: r6.buyingTokenId,
					sellingTokenId: r6.sellingTokenId,
					rate: r7,
					sellerMultisigAddress: r8,
					denom: r9,
					...pairAndSideByTokenIds(r6.sellingTokenId, r6.buyingTokenId)
				}
			};
		}
	}
}

export function pairAndSideByTokenIds(
	tokenId: string,
	additionalTokenId: string = ''
): { pair: string; side: string } {
	let pair = tradingPairs.find(
		(pair) => pair.tokens.includes(tokenId) && pair.tokens.includes(additionalTokenId)
	);
	if (pair) {
		return {
			pair: pair.name,
			side: pair.tokens.indexOf(tokenId) == 0 ? 'sell' : 'buy'
		};
	} else {
		return {
			pair: '',
			side: 'sell'
		};
	}
}

export function decodeR4(box: Box): { userPk: string; poolPk: string } | undefined {
	const r4 = box.additionalRegisters.R4;

	if (r4) {
		const parsed = parse<Uint8Array[]>(r4);
		return {
			userPk: ErgoAddress.fromPublicKey(parsed[0]).toString(),
			poolPk: ErgoAddress.fromPublicKey(parsed[1]).toString()
		};
	}
}

export function decodeR5(box: Box): number | undefined {
	const r5 = box.additionalRegisters.R5;
	if (r5) {
		const parsed = parse<number>(r5);
		return parsed;
	}
}

export function decodeTokenIdFromR6(box: Box): string | undefined {
	const r6 = box.additionalRegisters.R6;
	if (r6) {
		const parsed = Buffer.from(parse(r6)).toString('hex');
		return parsed;
	}
}

export function decodeR7(box: Box): bigint | undefined {
	const r7 = box.additionalRegisters.R7;
	if (r7) {
		const parsed = parse<bigint>(r7);
		return parsed;
	}
}

export function decodeR8(box: Box): string | undefined {
	const r8 = box.additionalRegisters.R8;
	if (r8) {
		const hexBuffer = Buffer.from(parse(r8)).toString('hex');
		const parsed = ErgoAddress.fromErgoTree(hexBuffer).toString();
		return parsed;
	}
}

export function decodeR9(box: Box): bigint | undefined {
	const r9 = box.additionalRegisters.R9;
	if (r9) {
		const parsed = parse<bigint>(r9);
		return parsed;
	}
}

export function decodeTokenIdPairFromR6(box: Box):
	| {
			sellingTokenId: string;
			buyingTokenId: string;
	  }
	| undefined {
	const r6 = box.additionalRegisters.R6;
	if (r6) {
		const parsed = parse<Uint8Array[]>(r6);
		return {
			sellingTokenId: Buffer.from(parsed[0]).toString('hex'),
			buyingTokenId: Buffer.from(parsed[1]).toString('hex')
		};
	}
}
