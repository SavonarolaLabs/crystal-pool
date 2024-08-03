import type { Box, EIP12UnsignedTransaction, SignedTransaction } from '@fleet-sdk/common';
import {
	db_addProxyDepositBoxes,
	db_addSentProxyToDepositTx,
	db_depositBoxes,
	db_storeSignedSwapTx,
	db_storeSignedWithdrawTx,
	type BoxDB
} from './db/db';
import {
	a,
	c,
	signTx,
	signTxInput,
	type JSONTransactionHintsBag
} from '$lib/wallet/multisig-server';
import { createSwapOrderTx, executeSwap } from '$lib/wallet/swap';
import { ErgoAddress, RECOMMENDED_MIN_FEE_VALUE, SAFE_MIN_BOX_VALUE } from '@fleet-sdk/core';
import { DEPOSIT_ADDRESS, SWAP_ORDER_ADDRESS } from '$lib/constants/addresses';
import { SHADOW_MNEMONIC } from '$lib/constants/mnemonics';
import { Transaction, UnsignedTransaction } from 'ergo-lib-wasm-nodejs';
import { createWithdrawToAddressTx } from '$lib/wallet/deposit';
import { fetchHeight } from '$lib/external/height';
import type { WithdrawRequestParams } from '$lib/types/request';
import type { SwapRequest } from '$lib/types/trading';
import type { Server } from 'socket.io';
import { proxyOutputs } from './parser/recognizer/proxyRecognizer';
import type { TransactionNode } from '$lib/types/node';
import type { BoxRow, BoxRowNoId } from '$lib/types/boxRow';
import { sumNanoErg } from '$lib/utils/helper';
import { forwardProxyToDeposit } from '$lib/wallet/depositProxy';
import { sendTx } from '$lib/external/transaction';
import {
	sendPeerBalanceUpdate,
	sendPeerProxyDepositErrorInsufficientErg,
	sendPeerProxyDepositFixInsufficientErg
} from './ioSocket';

export type TxWithCommits = {
	unsignedTx: EIP12UnsignedTransaction;
	publicCommitsPool: JSONTransactionHintsBag;
};

// WITHDRAW

export async function withdrawTxWithCommits(
	withdrawParams: WithdrawRequestParams,
	db: BoxDB
): Promise<TxWithCommits> {
	const height = await fetchHeight();
	const depositInputs: any = db_depositBoxes(withdrawParams.address, db);

	const unsignedTx = createWithdrawToAddressTx(withdrawParams, depositInputs, height);

	const { privateCommitsPool, publicCommitsPool } = await a(unsignedTx);
	return { unsignedTx, publicCommitsPool };
}

// SWAP ORDER

export async function swapOrderTxWithCommits(
	swapParams: SwapRequest,
	db: BoxDB
): Promise<TxWithCommits> {
	const height = await fetchHeight();
	const depositInputs: any = db_depositBoxes(swapParams.makerPk, db);

	const unsignedTx = createSwapOrderTx(
		swapParams.makerPk,
		depositInputs.map((db) => db.box),
		swapParams.nanoErg,
		swapParams.makerToken,
		swapParams.takerTokenId,
		swapParams.price,
		height
	);

	const { privateCommitsPool, publicCommitsPool } = await a(unsignedTx);
	return { unsignedTx, publicCommitsPool };
}

export async function signSwap(unsignedTx, hints, db) {
	const { privateCommitsPool, publicCommitsPool } = await a(unsignedTx);
	const signedTxWasm = await c(unsignedTx, privateCommitsPool, hints);
	const signedTx = signedTxWasm.to_js_eip12();
	db_storeSignedSwapTx(signedTx, db);
	return signedTx;
}

export async function signWithdraw(unsignedTx, hints, db) {
	const { privateCommitsPool, publicCommitsPool } = await a(unsignedTx);
	const signedTxWasm = await c(unsignedTx, privateCommitsPool, hints);
	const signedTx = signedTxWasm.to_js_eip12();
	db_storeSignedWithdrawTx(signedTx, db);
	return signedTx;
}

export function createExecuteSwapOrderTx(swapParams: SwapRequest, db: BoxDB) {
	const height = 1273521;

	const swapOrderInputBoxes: any = db.boxRows.filter(
		(b) =>
			b.contract == 'SWAP' &&
			//@ts-ignore
			b.parameters.side == 'SELL' &&
			//@ts-ignore
			b.parameters.rate == rate &&
			//@ts-ignore
			b.parameters.denom == denom
	);
	swapOrderInputBoxes.length = 1;

	const paymentInputBoxes: any = db.boxRows.filter(
		(b) => b.contract == 'DEPOSIT' && b.parameters.userPk == swapParams.address
	);
	//console.log('userAddress', swapParams.address);
	if (swapOrderInputBoxes.length < 1 || paymentInputBoxes.length < 1) {
		console.dir({ swapOrderInputBoxes, paymentInputBoxes });
		throw new Error(
			'not enough boxes, swapOrderInputBoxes:' +
				swapOrderInputBoxes.length +
				', paymentInputBoxes:' +
				paymentInputBoxes.length
		);
	}

	const buyingAmount = +swapParams.price * +swapParams.amount;
	const paymentAmount = +swapOrderInputBoxes[0].box.assets[0].amount;

	const tokensFromSwapContract = {
		tokenId: swapParams.buyingTokenId,
		amount: BigInt(buyingAmount)
	};
	const tokensAsPayment = { tokenId: swapParams.sellingTokenId, amount: BigInt(paymentAmount) };

	const unsignedTx = executeSwap(
		height,
		swapOrderInputBoxes.map((b) => b.box),
		paymentInputBoxes.map((b) => b.box),
		tokensAsPayment,
		tokensFromSwapContract
	);
	return unsignedTx;
}

export async function signExecuteSwapOrder(unsignedTx, proof, db: BoxDB) {
	const inputIndexDeposit = unsignedTx.inputs.findIndex(
		(box: Box) => box.ergoTree == ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree
	);
	const inputIndexSwap = unsignedTx.inputs.findIndex(
		(box: Box) => box.ergoTree == ErgoAddress.fromBase58(SWAP_ORDER_ADDRESS).ergoTree
	);
	const signed = await signTxInput(SHADOW_MNEMONIC, unsignedTx, inputIndexSwap);
	const proofSwap = JSON.parse(signed.spending_proof().to_json());

	//console.log('proof', proof);
	//console.log('proofSwap', proofSwap);

	const wasmUnsigned = UnsignedTransaction.from_json(JSON.stringify(unsignedTx));
	const transaction = Transaction.from_unsigned_tx(wasmUnsigned, [proof, proofSwap]);

	const txId = UnsignedTransaction.from_json(JSON.stringify(unsignedTx)).id().to_str();

	unsignedTx.txId = txId;
	//ADD FUNCTION
	const proofs = [proof, proofSwap].map((p) => p.proofBytes); // TODO: more than 1 input
	const signedTx = addOutputIds(unsignedTx, proofs);

	db_storeSignedSwapTx(signedTx, db);
	return unsignedTx;
}

function addOutputIds(unsignedTx: EIP12UnsignedTransaction, proofs: string[]): SignedTransaction {
	//TODO: ADD TYPE
	const uint8arrays = proofs.map(hexStringToUint8Array);
	const wasmUnsigned = UnsignedTransaction.from_json(JSON.stringify(unsignedTx));
	const transaction = Transaction.from_unsigned_tx(wasmUnsigned, uint8arrays);
	return transaction.to_js_eip12();
}

function hexStringToUint8Array(hexString: string): Uint8Array {
	if (hexString.length % 2 !== 0) {
		throw new Error('Invalid hex string');
	}

	const array = new Uint8Array(hexString.length / 2);

	for (let i = 0; i < hexString.length; i += 2) {
		array[i / 2] = parseInt(hexString.substr(i, 2), 16);
	}
	return array;
}

export function checkIfTransactionIsProxyDeposit(tx: TransactionNode, db: BoxDB, io: Server) {
	const boxes: BoxRowNoId[] = proxyOutputs(tx);
	if (boxes.length > 0) {
		handleIncomingProxyDeposit(tx, boxes, db, io);
	} else {
		//console.log('transaction processed, no boxes found');
	}
}

export async function handleIncomingProxyDeposit(
	tx: TransactionNode,
	boxesNoId: BoxRowNoId[],
	db: BoxDB,
	io: Server
) {
	const boxes = db_addProxyDepositBoxes(db, boxesNoId);
	const userPk = boxes[0].parameters.userPk;
	const height = boxes[0].parameters.unlockHeight;

	const allUsersProxyDeposits: BoxRow[] = db.boxRows.filter((row: BoxRow) => {
		!row.spent && row.parameters.userPk == userPk && row.parameters.unlockHeight == height;
	});

	const totalNanoErg: bigint = sumNanoErg(allUsersProxyDeposits.map((r) => r.box));
	if (totalNanoErg >= SAFE_MIN_BOX_VALUE + RECOMMENDED_MIN_FEE_VALUE) {
		const height = await fetchHeight();
		const forwardingTx = forwardProxyToDeposit(allUsersProxyDeposits, height);
		const signedTx = await signTx(forwardingTx, SHADOW_MNEMONIC);
		const tx = await sendTx(signedTx);
		if (tx) {
			db_addSentProxyToDepositTx(db, allUsersProxyDeposits, signedTx);
			const someTokensWereStuck = allUsersProxyDeposits.length > boxes.length;
			if (someTokensWereStuck) {
				sendPeerProxyDepositFixInsufficientErg(db, userPk, allUsersProxyDeposits);
			}
			sendPeerBalanceUpdate(db, userPk);
		} else {
			//TODO: if transaction submition fails, retry and send messenger notification
		}
	} else {
		sendPeerProxyDepositErrorInsufficientErg(db, userPk, allUsersProxyDeposits);
	}
}
