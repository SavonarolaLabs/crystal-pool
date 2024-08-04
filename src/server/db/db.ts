import { boxesAtAddress } from '$lib/utils/test-helper';
import { type Box, type EIP12UnsignedTransaction, type SignedTransaction } from '@fleet-sdk/common';
import { DEPOSIT_ADDRESS, SWAP_ORDER_ADDRESS } from '../../lib/constants/addresses';
import { initDeposits } from '../../lib/server-agent/simulator';
import type { BoxRow, BoxRowNoId, ContractType } from '../../lib/types/boxRow';
import type { TxRow } from '../../lib/types/txRow';
import { serializeBigInt } from '../../lib/utils/serializeBigInt';
import {
	deleteAllBoxes,
	deleteMultipleBoxes,
	loadBoxRows,
	markBoxesAsSpent,
	persistBox
} from './sqlDb';
import type { ConfirmedTransaction } from '$lib/types/explorer';
import type { SubmittedTxRox, TxPurpose } from '$lib/types/fallibleTxRow';
import { parseBox } from '../parser/boxParser';
import type { ClientSocket } from '$lib/types/server';
import type { PK } from '$lib/types/trading';

interface HasId {
	id: number;
}

export type BoxDB = {
	boxRows: BoxRow[];
	unsignedTxs: TxRow[];
	unprocessedDepositTxIds: string[];
	mempoolTxIds: Set<string>;
	submittedTxs: SubmittedTxRox[];
	connectedClients: Map<PK, ClientSocket>;
};

export async function initDb(): Promise<BoxDB> {
	const boxRows: BoxRow[] = (await loadBoxRows()) ?? [];
	return {
		boxRows,
		unsignedTxs: [],
		unprocessedDepositTxIds: [],
		mempoolTxIds: new Set(),
		submittedTxs: [],
		connectedClients: new Map()
	};
}

export async function db_clearDB(db: BoxDB) {
	await deleteAllBoxes();
	db.boxRows.length = 0;
	db.unsignedTxs = [];
	db.unprocessedDepositTxIds = [];
	db.mempoolTxIds = new Set();
	db.submittedTxs = [];
	db.connectedClients = new Map();
}

export async function db_initDepositUtxo(db: BoxDB) {
	if (db.boxRows?.length == 0) {
		const aliceAndBobDeposits = await initDeposits();
		db_addBoxes(db, aliceAndBobDeposits);
	}
}

function nextId(table: HasId[]): number {
	const maxId = Math.max(...table.map((row) => row.id), 0) + 1;
	return maxId;
}

export function db_addBox(db: BoxDB, box: Box): BoxRow | undefined {
	const boxParams = parseBox(box);
	if (boxParams) {
		const newRow: BoxRow = {
			id: nextId(db.boxRows),
			contract: boxParams.contract,
			parameters: boxParams.parameters,
			box,
			spent: false
		};
		db.boxRows.push(newRow);
		persistBox(newRow); // Insert into database
		return newRow;
	} else {
		console.error('db_addBox() invalid box: ', JSON.stringify(box));
	}
}

export function db_addBoxRowNoId(db: BoxDB, boxRowNoId: BoxRowNoId): BoxRow {
	const newRow: BoxRow = {
		id: nextId(db.boxRows),
		contract: boxRowNoId.contract,
		parameters: boxRowNoId.parameters,
		box: boxRowNoId.box,
		spent: boxRowNoId.spent
	};
	db.boxRows.push(newRow);
	persistBox(newRow); // Insert into database
	return newRow;
}

export function db_removeBoxesByBoxIds(db: BoxDB, removeBoxIds: string[]) {
	const deleteBoxIds = db.boxRows
		.filter((row) => removeBoxIds.includes(row.box.boxId))
		.map((row) => row.id);

	if (deleteBoxIds.length > 0) {
		deleteMultipleBoxes(deleteBoxIds);
		db.boxRows = db.boxRows.filter((row) => !deleteBoxIds.includes(row.id)); //
	}
}

export function db_addBoxes(db: BoxDB, boxRows: Box[]): BoxRow[] {
	const insertedBoxes: Array<BoxRow | undefined> = [];
	for (let i = 0; i < boxRows.length; i++) {
		const row = db_addBox(db, boxRows[i]);
		insertedBoxes.push(row);
	}
	return insertedBoxes.filter((x) => x) as BoxRow[];
}

export function db_spendBoxes(db: BoxDB, boxRows: BoxRow[]): BoxRow[] {
	const ids = boxRows.map((br) => br.id);
	const rows = db.boxRows.filter((r) => ids.includes(r.id));
	rows.forEach((r) => {
		r.spent = true;
	});
	markBoxesAsSpent(rows);
	return rows;
}

export function db_addTx(db: BoxDB, tx: EIP12UnsignedTransaction) {
	const newRow: TxRow = {
		id: nextId(db.unsignedTxs),
		unsignedTx: tx,
		commitments: [],
		hintbags: []
	};
	db.unsignedTxs.push(newRow);
}

export function db_addSubmittedTx(db: BoxDB, tx: ConfirmedTransaction, purpose: TxPurpose) {
	const newRow: SubmittedTxRox = {
		id: nextId(db.submittedTxs),
		tx: { confirmed: tx },
		purpose
	};
	db.submittedTxs.push(newRow);
}

export function db_addSubmittedUnconfirmedTx(db: BoxDB, tx: SignedTransaction, purpose: TxPurpose) {
	const newRow: SubmittedTxRox = {
		id: nextId(db.submittedTxs),
		tx: { unconfirmed: tx },
		purpose
	};
	db.submittedTxs.push(newRow);
}

// helper functions
export function db_depositBoxes(userAddress: string, db: BoxDB): BoxRow[] {
	return db.boxRows.filter((b) => b.contract == 'DEPOSIT' && b.parameters.userPk == userAddress);
}

export function db_storeSignedSwapTx(signedTx: SignedTransaction, db: BoxDB) {
	db_removeBoxesByBoxIds(
		db,
		signedTx.inputs.map((box) => box.boxId)
	);

	const boxes1 = boxesAtAddress(signedTx, SWAP_ORDER_ADDRESS);
	const boxes2 = boxesAtAddress(signedTx, DEPOSIT_ADDRESS);
	db_addBoxes(db, [...boxes1, ...boxes2]);
}

export function db_storeSignedWithdrawTx(signedTx: SignedTransaction, db: BoxDB) {
	db_removeBoxesByBoxIds(
		db,
		signedTx.inputs.map((box) => box.boxId)
	);

	const deposits = boxesAtAddress(signedTx, DEPOSIT_ADDRESS);
	db_addBoxes(db, deposits);
}

export function db_addUnprocessedDepositTxId(db: BoxDB, txId: string) {
	db.unprocessedDepositTxIds.push(txId);
}

export function db_addProxyDepositBoxes(db: BoxDB, boxesNoId: BoxRowNoId[]): BoxRow[] {
	const boxesAdded: BoxRow[] = [];
	boxesNoId.forEach((row: BoxRowNoId) => {
		let existingBoxRow = db.boxRows.find((r) => r.box.boxId == row.box.boxId);
		if (!existingBoxRow) {
			boxesAdded.push(db_addBoxRowNoId(db, row));
		} else {
			boxesAdded.push(existingBoxRow);
		}
	});
	return boxesAdded;
}

export function db_addMempoolDepositTx(db: BoxDB, tx: ConfirmedTransaction): BoxRow[] {
	db.unprocessedDepositTxIds = db.unprocessedDepositTxIds.filter((id) => id != tx.id);
	db_addSubmittedTx(db, tx, 'DEPOSIT');
	const deposits = boxesAtAddress(tx, DEPOSIT_ADDRESS);
	return db_addBoxes(db, deposits);
}

export function db_addSentProxyToDepositTx(
	db: BoxDB,
	proxyBoxRows: BoxRow[],
	tx: SignedTransaction
): BoxRow[] {
	db_spendBoxes(db, proxyBoxRows);
	const deposits = boxesAtAddress(tx, DEPOSIT_ADDRESS);
	db_addSubmittedTx(db, tx, 'PROXY_TO_DEPOSIT');

	return db_addBoxes(db, deposits);
}

export function db_setMempoolTxIds(db: BoxDB, txIds: string[]) {
	db.mempoolTxIds = new Set(txIds);
}

export function db_addMempoolTxId(db: BoxDB, txId: string) {
	db.mempoolTxIds.add(txId);
}

// serialization functinos
export function db_getBoxesString(db: BoxDB) {
	const serializedData = serializeBigInt(db.boxRows);
	return serializedData;
}

export function db_getBoxesByAddressString(db: BoxDB, address: string) {
	const userBoxes = db.boxRows.filter((box) => box.parameters.userPk == address);
	const serializedData = serializeBigInt(userBoxes);
	return serializedData;
}

export function db_getBoxesByContractString(db: BoxDB, contract: ContractType) {
	const userBoxes = db.boxRows.filter((box) => box.contract == contract);
	const serializedData = serializeBigInt(userBoxes);
	return serializedData;
}
