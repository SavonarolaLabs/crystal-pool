import { get } from 'svelte/store';
import { createSwapTx, executeSwapTx, signExecuteSwapTx, signSwapTx } from './crystalPoolService';
import { user_address, user_mnemonic } from '../ui_state';
import type { Box } from '@fleet-sdk/common';
import { b, signTxInput } from '$lib/wallet/multisig-client';
import { parse } from '@fleet-sdk/serializer';
import { ErgoAddress } from '@fleet-sdk/core';

export type SwapRequest = {
	address: string;
	price: string;
	amount: string;
	sellingTokenId: string;
	buyingTokenId: string;
};

export async function createAndMultisigSwapTx(swapParams: SwapRequest) {
	const { unsignedTx, publicCommitsPool } = await createSwapTx(swapParams);

	const extractedHints = await b(
		unsignedTx,
		get(user_mnemonic),
		get(user_address),
		publicCommitsPool
	);

	let signedTx = await signSwapTx(extractedHints, unsignedTx);
	return signedTx;
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

export async function executeAndSignInputsSwapTx(swapParams: SwapRequest) {
	const unsignedTx = await executeSwapTx(swapParams);
		const inputIndex = unsignedTx.inputs
		.findIndex((b: Box) => decodeR4(b)?.userPk == swapParams.address);
	const signed = await signTxInput(get(user_mnemonic), unsignedTx, inputIndex);
	const proof = JSON.parse(signed.spending_proof().to_json());
	console.log({proof})
	
	const signedTx = await signExecuteSwapTx(proof, unsignedTx);
	console.log({signedTx})
	return signedTx;
}
