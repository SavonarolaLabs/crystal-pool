import type { Box, EIP12UnsignedTransaction } from "@fleet-sdk/common";
import { db_depositBoxes, db_storeSignedSwapTx, type BoxDB } from "./db/db";
import { a, c, signTxInput, type JSONTransactionHintsBag } from "$lib/wallet/multisig-server";
import { createSwapOrderTxR9, executeSwap, splitSellRate } from "$lib/wallet/swap";
import { ErgoAddress } from "@fleet-sdk/core";
import { DEPOSIT_ADDRESS, SWAP_ORDER_ADDRESS } from "$lib/constants/addresses";
import { SHADOW_MNEMONIC } from "$lib/constants/mnemonics";
import { UnsignedTransaction } from "ergo-lib-wasm-nodejs";

export type SwapParams = {
	address: string;
	price: string;
	amount: string;
	sellingTokenId: string;
	buyingTokenId: string;
};

export type TxWithCommits = { 
	unsignedTx: EIP12UnsignedTransaction, 
	publicCommitsPool: JSONTransactionHintsBag,
}

export async function swapOrderTxWithCommits(swapParams: SwapParams, db:BoxDB): Promise<TxWithCommits> {
	const height = 1273521;
	const depositInputs: any = db_depositBoxes(swapParams.address, db)

	const unsignedTx = createSwapOrderTxR9(
		swapParams.address,
		depositInputs.map((db) => db.box),
		{
			tokenId: swapParams.sellingTokenId,
			amount: swapParams.amount
		},
		swapParams.price,
		height,
		swapParams.buyingTokenId
	);

	const { privateCommitsPool, publicCommitsPool } = await a(unsignedTx);
	return { unsignedTx, publicCommitsPool };
}

export async function signSwap(unsignedTx, hints, db){
	const { privateCommitsPool, publicCommitsPool } = await a(unsignedTx);
	const signedTxWasm = await c(unsignedTx, privateCommitsPool, hints);
	const signedTx = signedTxWasm.to_js_eip12();
	db_storeSignedSwapTx(signedTx, db);
	return signedTx;
}

export function createExecuteSwapOrderTx(swapParams: SwapParams, db: BoxDB) {
	const [rate, denom] = splitSellRate(swapParams.price);
	const height = 1273521;

	const swapOrderInputBoxes: any = db.boxRows.filter(
		(b) =>
			b.contract == 'SWAP' &&
			//@ts-ignore
			b.parameters.side == 'sell' &&
			//@ts-ignore
			b.parameters.rate == rate &&
			//@ts-ignore
			b.parameters.denom == denom
	);
	swapOrderInputBoxes.length = 1;

	const paymentInputBoxes: any = db.boxRows.filter(
		(b) => b.contract == 'DEPOSIT' && b.parameters.userPk == swapParams.address
	);
	console.log('userAddress', swapParams.address);
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

export async function signExecuteSwapOrder(unsignedTx, proof, db){
	const inputIndexDeposit = unsignedTx.inputs.findIndex(
		(box: Box) => box.ergoTree == ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree
	);
	const inputIndexSwap = unsignedTx.inputs.findIndex(
		(box: Box) => box.ergoTree == ErgoAddress.fromBase58(SWAP_ORDER_ADDRESS).ergoTree
	);
	const signed = await signTxInput(SHADOW_MNEMONIC, unsignedTx, inputIndexSwap);
	const proofSwap = JSON.parse(signed.spending_proof().to_json());

	const txId = UnsignedTransaction.from_json(JSON.stringify(unsignedTx)).id().to_str();

	unsignedTx.inputs[inputIndexDeposit].spendingProof = proof;
	unsignedTx.inputs[inputIndexSwap].spendingProof = proofSwap;
	unsignedTx.txId = txId;

	db_storeSignedSwapTx(unsignedTx, db);
	return unsignedTx;
}