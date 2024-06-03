import {
	ErgoBox,
	ErgoBoxes,
	Propositions,
	ReducedTransaction,
	TransactionHintsBag,
	UnsignedTransaction,
	extract_hints,
	Input,
	Wallet,
	SecretKey,
	SecretKeys
	// @ts-ignore
} from 'ergo-lib-wasm-browser';
import { ErgoAddress } from '@fleet-sdk/core';
import { mnemonicToSeedSync } from 'bip39';
import type {
	EIP12UnsignedInput,
	EIP12UnsignedTransaction,
	SignedTransaction
} from '@fleet-sdk/common';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { fakeContextBrowser } from './fakeContextBrowser';

type JSONTransactionHintsBag = any;

export async function b(
	unsignedTx: EIP12UnsignedTransaction,
	userMnemonic: string,
	userAddress: string,
	publicCommits: JSONTransactionHintsBag
) {
	const publicBag = TransactionHintsBag.from_json(JSON.stringify(publicCommits));
	const proverAlice = await getProver(userMnemonic);
	const reducedTx = reducedFromUnsignedTx(unsignedTx);
	const initialCommitsAlice = proverAlice.generate_commitments_for_reduced_transaction(reducedTx);

	const combinedHints = TransactionHintsBag.empty();

	for (let i = 0; i < unsignedTx.inputs.length; i++) {
		combinedHints.add_hints_for_input(i, initialCommitsAlice.all_hints_for_input(i));
		combinedHints.add_hints_for_input(i, publicBag.all_hints_for_input(i));
	}

	const partialSignedTx = proverAlice.sign_reduced_transaction_multi(reducedTx, combinedHints);

	const hAlice = ErgoAddress.fromBase58(userAddress).ergoTree.slice(6);
	let extractedHints = extract_hints(
		partialSignedTx,
		fakeContextBrowser(),
		ErgoBoxes.from_boxes_json(unsignedTx.inputs),
		ErgoBoxes.empty(),
		arrayToProposition([hAlice]),
		arrayToProposition([])
	).to_json();
	return extractedHints;
}

function reducedFromUnsignedTx(unsignedTx: EIP12UnsignedTransaction) {
	const inputBoxes = ErgoBoxes.from_boxes_json(unsignedTx.inputs);
	const wasmUnsignedTx = UnsignedTransaction.from_json(JSON.stringify(unsignedTx));
	let context = fakeContextBrowser();
	let reducedTx = ReducedTransaction.from_unsigned_tx(
		wasmUnsignedTx,
		inputBoxes,
		ErgoBoxes.empty(),
		context
	);
	return reducedTx;
}

export async function txHasErrors(signedTransaction: SignedTransaction): Promise<false | string> {
	const endpoint = 'https://gql.ergoplatform.com/';
	const query = `
      mutation CheckTransaction($signedTransaction: SignedTransaction!) {
        checkTransaction(signedTransaction: $signedTransaction)
      }
    `;

	const variables = {
		signedTransaction: signedTransaction
	};

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query: query,
			variables: variables
		})
	});

	if (!response.ok) {
		throw new Error(response.statusText);
	}

	const jsonResp = await response.json();
	if (jsonResp.data?.checkTransaction) {
		return false;
	} else {
		return jsonResp.errors;
	}
}

export async function submitTx(signedTransaction: SignedTransaction): Promise<false | string> {
	const endpoint = 'https://gql.ergoplatform.com/';
	const query = `
      mutation SubmitTransaction($signedTransaction: SignedTransaction!) {
        submitTransaction(signedTransaction: $signedTransaction)
      }
    `;

	const variables = {
		signedTransaction: signedTransaction
	};

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query: query,
			variables: variables
		})
	});

	if (!response.ok) {
		throw new Error('Network response was not ok: ' + response.statusText);
	}

	const jsonResp = await response.json();
	if (jsonResp.data?.submitTransaction) {
		return jsonResp.data.submitTransaction;
	} else {
		return false;
	}
}

enum WalletType {
	ReadOnly = 'READ_ONLY',
	Normal = 'NORMAL',
	MultiSig = 'MULTI_SIG'
}

interface TokenInfo {
	tokenId: string;
	balance: string;
}

interface StateWallet {
	id: number;
	name: string;
	networkType: string;
	seed: string;
	xPub: string;
	type: WalletType;
	requiredSign: number;
	version: number;
	balance: string;
	tokens: Array<TokenInfo>;
	addresses: Array<StateAddress>;
}

export interface StateAddress {
	id: number;
	name: string;
	address: string;
	path: string;
	idx: number;
	balance: string;
	walletId: number;
	proceedHeight: number;
	tokens: Array<TokenInfo>;
}

export function arrayToProposition(input: Array<string>): Propositions {
	const output = new Propositions();
	input.forEach((pk) => {
		const proposition = Uint8Array.from(Buffer.from('cd' + pk, 'hex'));
		output.add_proposition_from_byte(proposition);
	});
	return output;
}

export async function getProver(mnemonic: string): Promise<Wallet> {
	const secretKeys = new SecretKeys();
	secretKeys.add(getWalletAddressSecret(mnemonic));
	return Wallet.from_secrets(secretKeys);
}

export async function signTxByAddress(
	mnemonic: string,
	address: string,
	tx: EIP12UnsignedTransaction
): Promise<SignedTransaction> {
	const prover = await getProver(mnemonic);

	const boxesToSign = tx.inputs.filter(
		(i) => i.ergoTree == ErgoAddress.fromBase58(address).ergoTree
	);
	const boxes_to_spend = ErgoBoxes.empty();
	boxesToSign.forEach((box) => {
		boxes_to_spend.add(ErgoBox.from_json(JSON.stringify(box)));
	});

	const signedTx = prover.sign_transaction(
		fakeContextBrowser(),
		UnsignedTransaction.from_json(JSON.stringify(tx)),
		boxes_to_spend,
		ErgoBoxes.empty()
	);
	return signedTx.to_js_eip12();
}

export async function signTxByInputs(
	mnemonic: string,
	boxesToSign: EIP12UnsignedInput[],
	tx: EIP12UnsignedTransaction
): Promise<SignedTransaction> {
	const prover = await getProver(mnemonic);

	const boxes_to_spend = ErgoBoxes.empty();
	boxesToSign.forEach((box) => {
		boxes_to_spend.add(ErgoBox.from_json(JSON.stringify(box)));
	});

	const signedTx = prover.sign_transaction(
		fakeContextBrowser(),
		UnsignedTransaction.from_json(JSON.stringify(tx)),
		boxes_to_spend,
		ErgoBoxes.empty()
	);
	return signedTx.to_js_eip12();
}

export async function signTx(
	tx: EIP12UnsignedTransaction,
	mnemonic: string
): Promise<SignedTransaction> {
	const prover = await getProver(mnemonic);

	const boxesToSign = tx.inputs;
	const boxes_to_spend = ErgoBoxes.empty();
	boxesToSign.forEach((box) => {
		boxes_to_spend.add(ErgoBox.from_json(JSON.stringify(box)));
	});

	const signedTx = prover.sign_transaction(
		fakeContextBrowser(),
		UnsignedTransaction.from_json(JSON.stringify(tx)),
		boxes_to_spend,
		ErgoBoxes.empty()
	);
	return signedTx.to_js_eip12();
}

export async function signTxAllInputs(
	mnemonic: string,
	tx: EIP12UnsignedTransaction
): Promise<SignedTransaction> {
	const prover = await getProver(mnemonic);

	const boxesToSign = tx.inputs;
	const boxes_to_spend = ErgoBoxes.empty();
	boxesToSign.forEach((box) => {
		boxes_to_spend.add(ErgoBox.from_json(JSON.stringify(box)));
	});

	const signedTx = prover.sign_transaction(
		fakeContextBrowser(),
		UnsignedTransaction.from_json(JSON.stringify(tx)),
		boxes_to_spend,
		ErgoBoxes.empty()
	);
	return signedTx.to_js_eip12();
}

export async function signTxInput(
	mnemonic: string,
	tx: EIP12UnsignedTransaction,
	index: number
): Promise<Input> {
	const prover = await getProver(mnemonic);

	const boxesToSign = tx.inputs;
	const boxes_to_spend = ErgoBoxes.empty();
	boxesToSign.forEach((box) => {
		boxes_to_spend.add(ErgoBox.from_json(JSON.stringify(box)));
	});

	const signedInput = prover.sign_tx_input(
		index,
		fakeContextBrowser(),
		UnsignedTransaction.from_json(JSON.stringify(tx)),
		boxes_to_spend,
		ErgoBoxes.empty()
	);
	return signedInput;
}

const getWalletAddressSecret = (mnemonic: string, idx: number = 0) => {
	let seed = mnemonicToSeedSync(mnemonic);
	const path = calcPathFromIndex(idx);
	const bip32 = BIP32Factory(ecc);
	const extended = bip32.fromSeed(seed).derivePath(path);
	return SecretKey.dlog_from_bytes(Uint8Array.from(extended.privateKey ?? Buffer.from('')));
};

const RootPathWithoutIndex = "m/44'/429'/0'/0";
const calcPathFromIndex = (index: number) => `${RootPathWithoutIndex}/${index}`;
