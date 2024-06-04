import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	DEPOSIT_ADDRESS,
	SWAP_ORDER_ADDRESS
} from '$lib/constants/addresses';
import { ALICE_MNEMONIC, BOB_MNEMONIC, SHADOW_MNEMONIC } from '$lib/constants/mnemonics';
import { createWithdrawTx } from '$lib/wallet/deposit';
import { signMultisig, signTxInput } from '$lib/wallet/multisig-server';
import { beforeAll, describe, expect, it } from 'vitest';
import { SAFE_MIN_BOX_VALUE } from '@fleet-sdk/core';
import { getDepositsBoxesByAddress, updateContractBoxes } from '$lib/utils/test-helper';
import {
	type Amount,
	type Box,
	type EIP12UnsignedTransaction,
	type OneOrMore
} from '@fleet-sdk/common';
import { TOKEN } from '$lib/constants/tokens';
import { createSwapOrderTxR9, executeSwap } from '$lib/wallet/swap';
import BigNumber from 'bignumber.js';
import { UnsignedTransaction } from 'ergo-lib-wasm-nodejs';
import { depositAgentAlice, signTxAgentAlice } from '$lib/server-agent/alice';
import { depositAgentBob, signTxAgentBob } from '$lib/server-agent/bob';
import { createAndMultisigSwapTx } from '$lib/ui/service/tradingService';

//REAL_BOX_DATA
const CHAIN_HEIGHT = 1277300;
const DEPOSITOR_UNLOCK_HEIGHT = 1300000;
const DEPOSITOR_PK = BOB_ADDRESS;
const DEPOSITOR_MNEMONIC = BOB_MNEMONIC;

describe.only('Alice Swap Creation and Execution', () => {
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
		depositTxAlice = await signTxAgentAlice(depositUTxAlice);

		const depositUTxBob = depositAgentBob(DEPOSIT_TOKEN_BTC, value);
		depositTxBob = await signTxAgentBob(depositUTxBob);

		depositBoxes = updateContractBoxes(depositTxAlice, depositBoxes, DEPOSIT_ADDRESS); //
		depositBoxes = updateContractBoxes(depositTxBob, depositBoxes, DEPOSIT_ADDRESS); //
	});

	it('execute swap order A/B/C', async () => {
		const price = '20000'; //input
		const amount = 10000n; // BigInt(10 ** TOKEN.rsBTC.decimals); //1 BTC
		const real_price = realPrice(price).toString(10);
		const nanoErg = SAFE_MIN_BOX_VALUE;

		//BLOCK create swap // ALICE <----------- BOX

		const swapParams = {
			address: '9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU',
			price: '0.002',
			amount: '10000',
			sellingTokenId: '5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
			buyingTokenId: 'f60bff91f7ae3f3a5f0c2d35b46ef8991f213a61d7f7e453d344fa52a42d9f9a'
		};

		const swapUTx = await createAndMultisigSwapTx(swapParams);

		const swapTx = await signTxAgentBob(swapUTx);
		expect(swapTx.id).toBeTruthy();

		swapBoxes = updateContractBoxes(swapTx, swapBoxes, SWAP_ORDER_ADDRESS);
		depositBoxes = updateContractBoxes(swapTx, depositBoxes, DEPOSIT_ADDRESS);

		expect(swapBoxes).toBeTruthy();
		expect(depositBoxes).toBeTruthy();
	});
});

function getBobDeposits(allBoxes: Box[]) {
	return getDepositsBoxesByAddress(allBoxes, BOB_ADDRESS);
}
function getAliceDeposits(allBoxes: Box[]) {
	return getDepositsBoxesByAddress(allBoxes, ALICE_ADDRESS);
}

function createSwapOrderTxR9AgentBob(
	inputBoxes: OneOrMore<Box<Amount>>,
	price: string,
	amount: Amount,
	nanoErg: bigint
): EIP12UnsignedTransaction {
	const swapUTx = createSwapOrderTxR9(
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

function executeSwapAgentAlice(
	swapOrderBoxes: Box<Amount>[],
	paymentInputBoxes: Box<Amount>[],
	tokensFromSwapContract: { tokenId: string; amount: Amount },
	paymentInTokens: { tokenId: string; amount: Amount }
): EIP12UnsignedTransaction {
	//console.log(paymentInputBoxes);
	const executeSwapUTx = executeSwap(
		CHAIN_HEIGHT,
		swapOrderBoxes,
		paymentInputBoxes,
		tokensFromSwapContract,
		paymentInTokens,
		SAFE_MIN_BOX_VALUE
	);
	return executeSwapUTx;
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

function calculateAmount(price: string, amount: Amount) {
	const bigPrice = BigNumber(price);
	const bigAmount = BigNumber(Number(amount));
	const paymentAmount = bigPrice.multipliedBy(bigAmount);
	return paymentAmount;
}
