import { boxesAtAddress } from '$lib/utils/test-helper';
import { type Box, type EIP12UnsignedTransaction, type SignedTransaction } from '@fleet-sdk/common';
import { DEPOSIT_ADDRESS, SWAP_ORDER_ADDRESS } from '../../lib/constants/addresses';
import { initDeposits } from '../../lib/server-agent/simulator';
import type { BoxRow, ContractType } from '../../lib/types/boxRow';
import type { TxRow } from '../../lib/types/txRow';
import { parseBox } from './boxParser';
import { serializeBigInt } from './serializeBigInt';
import { deleteAllBoxes, deleteMultipleBoxes, loadBoxRows, persistBox } from './sqlDb';

interface HasId {
	id: number;
}

export type BoxDB = {
	boxRows: BoxRow[];
	txes: TxRow[];
	unprocessedDepositTxIds: string[];
	mempoolTxIds: Set<string>;
};

export async function initDb(): Promise<BoxDB> {
	const boxRows: BoxRow[] = (await loadBoxRows()) ?? [];
	return {
		boxRows,
		txes: [],
		unprocessedDepositTxIds: [],
		mempoolTxIds: new Set()
	};
}

export async function db_clearDB(db: BoxDB) {
	await deleteAllBoxes();
	db.boxRows.length = 0;
	db.txes = [];
	db.unprocessedDepositTxIds = [];
	db.mempoolTxIds = new Set();
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
		db.boxRows = db.boxRows.filter((row) => !deleteBoxIds.includes(row.id)); //
	}
}

export function db_addBoxes(db: BoxDB, boxRows: Box[]) {
	for (let i = 0; i < boxRows.length; i++) {
		db_addBox(db, boxRows[i]);
	}
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

export function db_setMempoolTxIds(db: BoxDB, txIds: string[]) {
	db.mempoolTxIds = new Set(...txIds);
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
