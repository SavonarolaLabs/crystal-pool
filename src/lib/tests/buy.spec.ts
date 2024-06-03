import { beforeAll, describe, expect, it } from 'vitest';
import { SAFE_MIN_BOX_VALUE, type Box } from '@fleet-sdk/core';
import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	BUY_ORDER_ADDRESS,
	DEPOSIT_ADDRESS
} from '$lib/constants/addresses';
import {
	PRINTER_ADDRESS,
	PRINTER_MNEMONIC,
	PRINTER_UTXO
} from '$lib/constants/fakeUtxos';
import { deposit } from '$lib/wallet/deposit';
import {
	signTx,
	signTxMulti,
	submitTx,
	txHasErrors
} from '$lib/wallet/multisig-server';
import { buy } from '$lib/wallet/buy';
import { BOB_MNEMONIC } from '$lib/constants/mnemonics';
import { boxAtAddress, boxesAtAddress } from '$lib/utils/test-helper';
import { utxos } from '$lib/data/utxos';

//PRINTER_BOX_DATA
// const CHAIN_HEIGHT = 1250600;
// const UNLOCK_DELTA = 100;
// const BUYER_UNLOCK_HEIGHT = CHAIN_HEIGHT + UNLOCK_DELTA;
// const BUYER_PK = BOB_ADDRESS;
// const BUYER_MNEMONIC = BOB_MNEMONIC;

// const DEPOSIT_TOKEN = {
// 	name: 'TestToken Test2',
// 	tokenId: 'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
// 	amount: 100_000_000_000n,
// 	decimals: 9
// };

//REAL_BOX_DATA
const CHAIN_HEIGHT = 1275107;
const BUYER_UNLOCK_HEIGHT = 1300000;
const BUYER_PK = BOB_ADDRESS;
const BUYER_MNEMONIC = BOB_MNEMONIC;

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

const RATE = 1n;
let depositBox: Box;

describe.skip('Printer BOX buy()', () => {
	beforeAll(async () => {
		const depositUTx = deposit(
			CHAIN_HEIGHT,
			PRINTER_UTXO,
			PRINTER_ADDRESS,
			BUYER_PK,
			BUYER_UNLOCK_HEIGHT,
			DEPOSIT_TOKEN_BTC,
			10n * SAFE_MIN_BOX_VALUE
		);

		const depositTx = await signTx(depositUTx, PRINTER_MNEMONIC);
		depositBox = boxAtAddress(depositTx, DEPOSIT_ADDRESS);
	});

	it('returns change to DEPOSIT_ADDRESS', async () => {
		const token = {
			name: 'TestToken Test2',
			tokenId:
				'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
			amount: 10_000_000_000n,
			decimals: 9
		};

		const buyOrderUTx = buy(
			CHAIN_HEIGHT,
			[depositBox],
			BUYER_PK,
			RATE,
			BUYER_UNLOCK_HEIGHT,
			token,
			SAFE_MIN_BOX_VALUE
		);
		const buyOrderTx = await signTxMulti(
			buyOrderUTx,
			BUYER_MNEMONIC,
			BUYER_PK
		);

		const buyOrderBox = boxAtAddress(buyOrderTx, BUY_ORDER_ADDRESS);
		expect(buyOrderBox, 'buy order box in output').toBeDefined();

		expect(
			boxesAtAddress(buyOrderTx, DEPOSIT_ADDRESS).length,
			'amount of change boxes'
		).toBe(1);
	});
});

describe('deposit Real BOX buy()', () => {
	let depositTx;
	beforeAll(async () => {
		const depositUTx = deposit(
			CHAIN_HEIGHT,
			utxos[BUYER_PK], //<-------- FROM
			BUYER_PK, //<-------- ChangeAddress
			ALICE_ADDRESS, //<-------- Deposit Receiver Address
			BUYER_UNLOCK_HEIGHT,
			DEPOSIT_TOKEN_BTC, //<-------- TOKEN
			10n * SAFE_MIN_BOX_VALUE
		);

		depositTx = await signTx(depositUTx, BUYER_MNEMONIC); // FROM - SIGN
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
