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
import { SAFE_MIN_BOX_VALUE } from '@fleet-sdk/core';
import { boxAtAddress } from '$lib/utils/test-helper';
import type {
	Amount,
	Box,
	EIP12UnsignedTransaction,
	OneOrMore,
	SignedTransaction,
	TokenAmount
} from '@fleet-sdk/common';
import { TOKEN } from '$lib/constants/tokens';
import { createSwapOrderTxR9, executeSwap } from '$lib/wallet/swap';
import BigNumber from 'bignumber.js';
import { parseBox } from '$lib/db/db';
import { UnsignedTransaction } from 'ergo-lib-wasm-nodejs';

//REAL_BOX_DATA
const CHAIN_HEIGHT = 1277300;
const DEPOSITOR_UNLOCK_HEIGHT = 1300000;
const DEPOSITOR_PK = BOB_ADDRESS;
const DEPOSITOR_MNEMONIC = BOB_MNEMONIC;

describe('Deposit/Withdraw AGENTS', () => {
	let depositTxAlice;
	let depositTxBob;
	let depositBoxAlice: Box;
	let depositBoxBob: Box;
	let swapBoxBob: Box;

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

		depositBoxAlice = boxAtAddress(depositTxAlice, DEPOSIT_ADDRESS);
		depositBoxBob = boxAtAddress(depositTxBob, DEPOSIT_ADDRESS);
	});
	it('withdraw virtual depositBox', async () => {
		const withdrawUTxAlice = createWithdrawTx(ALICE_ADDRESS, [depositBoxAlice], CHAIN_HEIGHT);
		const withdrawTxAlice = await signMultisig(withdrawUTxAlice, ALICE_MNEMONIC, ALICE_ADDRESS);
		expect(withdrawTxAlice.to_js_eip12().id).toBeTruthy();

		const withdrawUTxBob = createWithdrawTx(BOB_ADDRESS, [depositBoxBob], CHAIN_HEIGHT);
		const withdrawTxBob = await signMultisig(withdrawUTxBob, BOB_MNEMONIC, BOB_ADDRESS);
		expect(withdrawTxBob.to_js_eip12().id).toBeTruthy();
	});

	it('create swap order', async () => {
		const price = '20000'; //input
		const amount = 10000n; // BigInt(10 ** TOKEN.rsBTC.decimals); //1 BTC
		const real_price = realPrice(price).toString(10);
		console.log('🚀 ~ it ~ real_price:', real_price);

		const swapUTx = createSwapOrderTxR9AgentBob(depositBoxBob, real_price, amount);
		const swapTx = await signTxAgentBob(swapUTx);
		expect(swapTx.id).toBeTruthy();

		swapBoxBob = boxAtAddress(swapTx, SWAP_ORDER_ADDRESS);
		depositBoxBob = boxAtAddress(swapTx, DEPOSIT_ADDRESS);

		//---------------------- Execute Swap Order ---------------------//
		//amount price

		//Если продает 1 БТС за 67000 долларов
		//то продает 10**8 сатоши за 67000 долларов
		//то есть 10**8 сатоши за 67000 * 100 центов
		//Реальная цена 1 сатоши -  0.006700005 цента
		//Но количество которое покупает = amount
		//Количество которое должен заплатить = amount * price в центах уже

		const paymentAmount = calculateAmount(real_price, amount).toString(10);
		console.log('🚀 ~ it ~ paymentAmount:', paymentAmount);
		const tokensAsPayment = { tokenId: TOKEN.sigUSD.tokenId, amount: paymentAmount };

		const executeSwapUTx = executeSwapAgentAlice(
			[swapBoxBob],
			[depositBoxAlice],
			{ tokenId: TOKEN.rsBTC.tokenId, amount: amount },
			{ tokenId: TOKEN.sigUSD.tokenId, amount: paymentAmount }
		);

		//console.dir(executeSwapUTx, { depth: null });

		//BOX FROM DEPOSIT
		const signedAliceInput = await signTxInput(
			ALICE_MNEMONIC,
			JSON.parse(JSON.stringify(executeSwapUTx)),
			1
		);
		const aliceProof = signedAliceInput.spending_proof().to_json();

		const boxParams = parseBox(swapBoxBob);
		// console.log(boxParams);
		// console.log(SHADOWPOOL_ADDRESS);
		expect(boxParams?.parameters.poolPk).toBe(SHADOWPOOL_ADDRESS);
		//console.log(signedAliceInput.spending_proof().to_json());

		//BOX FROM SWAP
		const signedShadowInput = await signTxInput(
			SHADOW_MNEMONIC,
			JSON.parse(JSON.stringify(executeSwapUTx)),
			0
		);
		const shadowProof = signedShadowInput.spending_proof().to_json();

		// ------------ take ID -----------
		const txId = UnsignedTransaction.from_json(JSON.stringify(executeSwapUTx)).id().to_str();

		executeSwapUTx.inputs[0] = {
			boxId: executeSwapUTx.inputs[0].boxId,
			spendingProof: shadowProof
		};
		executeSwapUTx.inputs[1] = {
			boxId: executeSwapUTx.inputs[1].boxId,
			spendingProof: aliceProof
		};

		executeSwapUTx.id = txId;
		console.log(executeSwapUTx.id);

		//---------------------- Execute Swap Order ---------------------//
	});
});

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

function createSwapOrderTxR9AgentBob(
	inputBoxes: OneOrMore<Box<Amount>>,
	price: string,
	amount: Amount
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
		SWAP_ORDER_ADDRESS
	);
	return swapUTx;
}

function executeSwapAgentAlice(
	swapOrderBoxes: Box<Amount>[],
	paymentInputBoxes: Box<Amount>[],
	tokensFromSwapContract: { tokenId: string; amount: Amount },
	paymentInTokens: { tokenId: string; amount: Amount }
): EIP12UnsignedTransaction {
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
