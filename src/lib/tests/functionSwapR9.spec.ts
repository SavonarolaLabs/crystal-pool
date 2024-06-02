import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	DEPOSIT_ADDRESS,
	SHADOWPOOL_ADDRESS,
	SWAP_ORDER_ADDRESS
} from '$lib/constants/addresses';
import { ALICE_MNEMONIC, BOB_MNEMONIC, SHADOW_MNEMONIC } from '$lib/constants/mnemonics';
import { createWithdrawTx, deposit } from '$lib/wallet/deposit';
import {
	signMultisig,
	signTx,
	signTxInput,
	submitTx,
	txHasErrors
} from '$lib/wallet/multisig-server';
import { beforeAll, describe, expect, it } from 'vitest';
import { utxos } from '$lib/data/utxos';
import {
	ErgoAddress,
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	SAFE_MIN_BOX_VALUE,
	SInt,
	TransactionBuilder
} from '@fleet-sdk/core';
import {
	boxAtAddress,
	boxesAtAddress,
	boxesFromAddress,
	getDepositsBoxesByAddress,
	updateContractBoxes
} from '$lib/utils/test-helper';
import {
	first,
	type Amount,
	type Box,
	type EIP12UnsignedTransaction,
	type OneOrMore,
	type SignedTransaction,
	type TokenAmount
} from '@fleet-sdk/common';
import { TOKEN } from '$lib/constants/tokens';
import { createSwapOrderTxR9, executeSwap, splitSellRate } from '$lib/wallet/swap';
import BigNumber from 'bignumber.js';
import { decodeR4, parseBox } from '$lib/db/db';
import { UnsignedTransaction } from 'ergo-lib-wasm-nodejs';
import { SByte, SColl, SGroupElement, SLong, SPair, SSigmaProp } from '@fleet-sdk/serializer';
import { asBigInt, calcTokenChange, sumNanoErg } from '$lib/utils/helper';

//REAL_BOX_DATA
const CHAIN_HEIGHT = 1277300;
const DEPOSITOR_UNLOCK_HEIGHT = 1300000;
const DEPOSITOR_PK = BOB_ADDRESS;
const DEPOSITOR_MNEMONIC = BOB_MNEMONIC;

describe('Deposit/Withdraw AGENTS', () => {
	let depositTxAlice;
	let depositTxBob;
	let swapBoxes: Box[];
	let depositBoxes: Box[];

	const DEPOSIT_TOKEN_BTC = {
		name: TOKEN.rsBTC.name,
		tokenId: TOKEN.rsBTC.tokenId,
		amount: 10n * 10n ** BigInt(TOKEN.rsBTC.decimals),
		decimals: TOKEN.rsBTC.decimals
	};

	const DEPOSIT_TOKEN_SIGUSD = {
		name: 'SigUSD',
		tokenId: TOKEN.sigUSD.tokenId,
		amount: 10n * 70_000n * 10n ** BigInt(TOKEN.sigUSD.decimals),
		decimals: TOKEN.sigUSD.decimals
	};

	beforeAll(async () => {
		const value = 5n * 10n ** 9n;

		const depositUTxAlice = depositAgentAlice(DEPOSIT_TOKEN_SIGUSD, value);
		const depositUTxBob = depositAgentBob(DEPOSIT_TOKEN_BTC, value);

		depositTxAlice = await signTxAgentAlice(depositUTxAlice);
		depositTxBob = await signTxAgentBob(depositUTxBob);

		depositBoxes = updateContractBoxes(depositTxAlice, depositBoxes, DEPOSIT_ADDRESS); //
		depositBoxes = updateContractBoxes(depositTxBob, depositBoxes, DEPOSIT_ADDRESS); //
	});
	it('withdraw virtual depositBox', async () => {
		const withdrawUTxAlice = createWithdrawTx(
			ALICE_ADDRESS,
			getAliceDeposits(depositBoxes),
			CHAIN_HEIGHT
		);
		const withdrawTxAlice = await signMultisig(withdrawUTxAlice, ALICE_MNEMONIC, ALICE_ADDRESS);
		expect(withdrawTxAlice.to_js_eip12().id).toBeTruthy();

		const withdrawUTxBob = createWithdrawTx(
			BOB_ADDRESS,
			getBobDeposits(depositBoxes),
			CHAIN_HEIGHT
		);
		const withdrawTxBob = await signMultisig(withdrawUTxBob, BOB_MNEMONIC, BOB_ADDRESS);
		expect(withdrawTxBob.to_js_eip12().id).toBeTruthy();
	});

	it('create swap order', async () => {
		const price = '20000'; //input
		const amount = 10000n; // BigInt(10 ** TOKEN.rsBTC.decimals); //1 BTC
		const real_price = realPrice(price).toString(10);
		const nanoErg = SAFE_MIN_BOX_VALUE;

		const swapUTx = createSwapOrderTxR9AgentBob(
			getBobDeposits(depositBoxes),
			real_price,
			amount,
			nanoErg
		);

		swapBoxes = updateContractBoxes(swapUTx, swapBoxes, SWAP_ORDER_ADDRESS); // достает из аутпутов
		depositBoxes = updateContractBoxes(swapUTx, depositBoxes, DEPOSIT_ADDRESS); //

		expect(swapBoxes).toBeTruthy(); //OUTPUT -> DEPOSIT
		expect(depositBoxes).toBeTruthy(); //OUTPUT -> DEPOSIT
	});
});

function getBobDeposits(allBoxes: Box[]) {
	return getDepositsBoxesByAddress(allBoxes, BOB_ADDRESS);
}
function getAliceDeposits(allBoxes: Box[]) {
	return getDepositsBoxesByAddress(allBoxes, ALICE_ADDRESS);
}

//TO HELPER

function depositAgentAlice(
	tokens: OneOrMore<TokenAmount<Amount>>,
	value: bigint
): EIP12UnsignedTransaction {
	const depositUTx = deposit(
		1277300,
		utxos[ALICE_ADDRESS], //<-------- FROM
		ALICE_ADDRESS, //<-------- ChangeAddress
		ALICE_ADDRESS, //<-------- Deposit Receiver Address
		1300000,
		tokens,
		value
	);
	return depositUTx;
}
function depositAgentBob(
	tokens: OneOrMore<TokenAmount<Amount>>,
	value: bigint
): EIP12UnsignedTransaction {
	const depositUTx = deposit(
		1277300,
		utxos[BOB_ADDRESS], //<-------- FROM
		BOB_ADDRESS, //<-------- ChangeAddress
		BOB_ADDRESS, //<-------- Deposit Receiver Address
		1300000,
		tokens,
		value
	);
	return depositUTx;
}

async function signTxAgentBob(tx: EIP12UnsignedTransaction): Promise<SignedTransaction> {
	return await signTx(tx, BOB_MNEMONIC);
}
async function signTxAgentAlice(tx: EIP12UnsignedTransaction): Promise<SignedTransaction> {
	return await signTx(tx, ALICE_MNEMONIC);
}
function createSwapOrderTxR9_new(
	sellerPK: string,
	sellerMultisigAddress: string,
	inputBoxes: OneOrMore<Box<Amount>>,
	token: { tokenId: string; amount: Amount },
	sellRate: string,
	currentHeight: number,
	unlockHeight: number,
	sellingTokenId: string,
	buyingTokenId: string,
	contractAddress: string,
	nanoErg: bigint
): EIP12UnsignedTransaction {
	const [bigRate, bigDenom] = splitSellRate(sellRate);

	const outputSwapOrder = new OutputBuilder(nanoErg, contractAddress)
		.addTokens(token)
		.setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())),
				SGroupElement(first(ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).getPublicKeys()))
			]).toHex(),
			R5: SInt(unlockHeight).toHex(),
			R6: SPair(SColl(SByte, sellingTokenId), SColl(SByte, buyingTokenId)).toHex(),
			R7: SLong(bigRate).toHex(),
			R8: SColl(SByte, ErgoAddress.fromBase58(sellerMultisigAddress).ergoTree).toHex(),
			R9: SLong(bigDenom).toHex()
		});

	const change = new OutputBuilder(
		sumNanoErg(inputBoxes) - asBigInt(nanoErg) - RECOMMENDED_MIN_FEE_VALUE,
		DEPOSIT_ADDRESS
	)
		.setAdditionalRegisters({
			R4: inputBoxes[0].additionalRegisters.R4,
			R5: inputBoxes[0].additionalRegisters.R5
		})
		.addTokens(calcTokenChange([...inputBoxes], token));

	const unsignedTransaction = new TransactionBuilder(currentHeight)
		.configureSelector((selector) => selector.ensureInclusion([inputBoxes].map((b) => b.boxId)))
		.from(inputBoxes)
		.to([outputSwapOrder, change])
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	return unsignedTransaction;
}

function createSwapOrderTxR9AgentBob(
	inputBoxes: OneOrMore<Box<Amount>>,
	price: string,
	amount: Amount,
	nanoErg: bigint
): EIP12UnsignedTransaction {
	const swapUTx = createSwapOrderTxR9_new(
		BOB_ADDRESS,
		DEPOSIT_ADDRESS,
		inputBoxes,
		{ tokenId: TOKEN.rsBTC.tokenId, amount: amount },
		price,
		CHAIN_HEIGHT,
		1300000,
		TOKEN.rsBTC.tokenId,
		TOKEN.sigUSD.tokenId,
		SWAP_ORDER_ADDRESS,
		nanoErg
	);
	return swapUTx;
}

function realPrice(price: string) {
	// load and calculate decimals
	const priceInput = new BigNumber(price);

	const decimalsToken = TOKEN.rsBTC.decimals;
	const decimalsCurrency = TOKEN.sigUSD.decimals;
	const bigDecimalsToken = BigNumber(10).pow(decimalsToken);
	const bigDecimalsCurrency = BigNumber(10).pow(decimalsCurrency);

	const bigDecimalsDelta = bigDecimalsToken.dividedBy(bigDecimalsCurrency);

	// apply decimals
	const real_price = priceInput.dividedBy(bigDecimalsDelta);
	return real_price;
}
