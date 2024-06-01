import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	DEPOSIT_ADDRESS,
	SHADOWPOOL_ADDRESS
} from '$lib/constants/addresses';
import { ALICE_MNEMONIC, BOB_MNEMONIC } from '$lib/constants/mnemonics';
import { createWithdrawTx, deposit } from '$lib/wallet/deposit';
import { signMultisig, signTx, submitTx, txHasErrors } from '$lib/wallet/multisig-server';
import { beforeAll, describe, expect, it } from 'vitest';
import { utxos } from '$lib/data/utxos';
import { SAFE_MIN_BOX_VALUE } from '@fleet-sdk/core';
import { boxAtAddress } from '$lib/utils/test-helper';

//REAL_BOX_DATA
const CHAIN_HEIGHT = 1277184;
const DEPOSITOR_UNLOCK_HEIGHT = 1300000;
const DEPOSITOR_PK = BOB_ADDRESS;
const DEPOSITOR_MNEMONIC = BOB_MNEMONIC;

const DEPOSIT_TOKEN_BTC = {
	name: 'rsBTC',
	tokenId: '5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
	amount: 10n ** 9n / 1000n,
	decimals: 9
};
const DEPOSIT_TOKEN_SIGUSD = {
	name: 'SigUSD',
	tokenId: '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04',
	amount: 100n,
	decimals: 2
};

describe('deposit and withdraw virtual BOX', () => {
	let depositTx;
	let depositBox;

	beforeAll(async () => {
		const depositUTx = deposit(
			CHAIN_HEIGHT,
			utxos[DEPOSITOR_PK], //<-------- FROM
			DEPOSITOR_PK, //<-------- ChangeAddress
			DEPOSITOR_PK, //<-------- Deposit Receiver Address
			DEPOSITOR_UNLOCK_HEIGHT,
			DEPOSIT_TOKEN_BTC, //<-------- TOKEN
			10n * SAFE_MIN_BOX_VALUE
		);

		depositTx = await signTx(depositUTx, DEPOSITOR_MNEMONIC);
		depositBox = boxAtAddress(depositTx, DEPOSIT_ADDRESS);
	});
	//1231
	it('withdraw virtual depositBox', async () => {
		const withdrawUTx = createWithdrawTx(DEPOSITOR_PK, [depositBox], CHAIN_HEIGHT);
		const withdrawTx = await signMultisig(withdrawUTx, DEPOSITOR_MNEMONIC, DEPOSITOR_PK);
		expect(withdrawTx.to_js_eip12().id).toBeTruthy();
	});
});

describe('deposit Real Box', () => {
	let depositTx;
	let depositBox;

	beforeAll(async () => {
		const depositUTx = deposit(
			CHAIN_HEIGHT,
			utxos[DEPOSITOR_PK], //<-------- FROM
			DEPOSITOR_PK, //<-------- ChangeAddress
			DEPOSITOR_PK, //<-------- Deposit Receiver Address
			DEPOSITOR_UNLOCK_HEIGHT,
			DEPOSIT_TOKEN_BTC, //<-------- TOKEN
			10n * SAFE_MIN_BOX_VALUE
		);

		depositTx = await signTx(depositUTx, DEPOSITOR_MNEMONIC); // FROM - SIGN
		depositBox = boxAtAddress(depositTx, DEPOSIT_ADDRESS);
		//console.log(depositTx);
	});
	//1231
	it('txHasErrors depositTx', async () => {
		expect(await txHasErrors(depositTx)).toBe(false);
	});

	it.skip('submit depositTx', async () => {
		expect(await submitTx(depositTx)).not.toBe(false);
	});
});

describe('withdraw Real BOX from DEPOSIT_ADDRESS', () => {
	let depositTx;
	let depositBox;
	let withdrawTxEIP12;
	const DEPOSITOR_PK = ALICE_ADDRESS;
	const DEPOSITOR_MNEMONIC = ALICE_MNEMONIC;

	beforeAll(async () => {
		depositBox = utxos[DEPOSIT_ADDRESS][0];
		const withdrawUTx = createWithdrawTx(DEPOSITOR_PK, [depositBox], CHAIN_HEIGHT);
		const withdrawTx = await signMultisig(withdrawUTx, DEPOSITOR_MNEMONIC, DEPOSITOR_PK);
		withdrawTxEIP12 = withdrawTx.to_js_eip12();
	});
	//1231
	it.skip('txHasErrors withdraw', async () => {
		expect(withdrawTxEIP12.id).toBeTruthy();
		expect(await txHasErrors(withdrawTxEIP12)).toBe(false);
	});

	it.skip('submit withdraw', async () => {
		expect(withdrawTxEIP12.id).toBeTruthy();
		expect(await submitTx(withdrawTxEIP12)).not.toBe(false);
	});
});
