import { beforeAll, describe, expect, it } from 'vitest';
import {
	contractTypeFromErgoTree,
	decodeR4,
	decodeR5,
	decodeTokenIdFromR6,
	decodeR7,
	decodeR8,
	decodeTokenIdPairFromR6,
	parseBox
} from './db';
import { SAFE_MIN_BOX_VALUE, type Box } from '@fleet-sdk/core';
import { PRINTER_ADDRESS, PRINTER_MNEMONIC, PRINTER_UTXO } from '../../lib/constants/fakeUtxos';
import {
	BOB_ADDRESS,
	BUY_ORDER_ADDRESS,
	DEPOSIT_ADDRESS,
	SELL_ORDER_ADDRESS,
	SWAP_ORDER_ADDRESS
} from '../../lib/constants/addresses';
import { BOB_MNEMONIC } from '../../lib/constants/mnemonics';
import { deposit } from '../../lib/wallet/deposit';
import { signTx, signTxMulti } from '../../lib/wallet/multisig-server';
import { boxAtAddress } from '../../lib/utils/test-helper';
import { createSellOrderTx } from '../../lib/wallet/sell';
import { createSwapOrderTx } from '../../lib/wallet/swap';
import { buy } from '../../lib/wallet/buy';

const depositBox = {
	boxId: '9721de0f8ec7da47b2b31083856bf24819a1d7d755e0e0e57c42fb6ff7a8eff8',
	transactionId: '57fb04e45dd1bd63feb5b2191608d2c4f5f6bb4547efca64f664aa83a15582e3',
	blockId: '8ee92294745d0246f21a43d1ef791f220115395324d745b495120d4e33a50fd4',
	value: '10000000',
	index: 0,
	globalIndex: 5626549,
	creationHeight: 1265580,
	settlementHeight: 1265588,
	ergoTree:
		'100204000402d801d601d9010163b2e4c6720104147300009591a3dad9010263e4c67202050401a7da720101a7ea02da720101a7dad9010263b2e4c67202041473010001a7',
	ergoTreeConstants: '0: 0\n1: 1',
	ergoTreeScript:
		'{\n  val func1 = {(box1: Box) => box1.R4[Coll[SigmaProp]].get(placeholder[Int](0)) }\n  if (HEIGHT > {(box2: Box) => box2.R5[Int].get }(SELF)) { func1(SELF) } else {\n    func1(SELF) && {(box2: Box) => box2.R4[Coll[SigmaProp]].get(placeholder[Int](1)) }(SELF)\n  }\n}',
	address:
		't5UVmPtqprz5zN2M2X5fRTajpYD2CYuamxePkcwNFc2t9Yc3DhNMyB81fLAqoL7t91hzyYacMA8uVzkpTYTRdg4A6gZHFZxVsvLo',
	assets: [
		{
			tokenId: 'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
			index: 0,
			amount: '100000000000',
			name: 'TestToken Test2',
			decimals: 9,
			type: 'EIP-004'
		}
	],
	additionalRegisters: {
		R4: '1402cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2ccd025d163103d491a5193c7b18182442877ce8fcf3ffb9ae9c295d9c98a16dcb0551',
		R5: '04f8dd9a01'
	},
	spentTransactionId: null,
	mainChain: true
};

const DEPOSIT_TOKEN = {
	name: 'TestToken Test2',
	tokenId: 'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
	amount: 100_000_000_000n,
	decimals: 9
};

const CHAIN_HEIGHT = 1250600;
const UNLOCK_DELTA = 100;
const BUYER_UNLOCK_HEIGHT = CHAIN_HEIGHT + UNLOCK_DELTA;
const BUYER_PK = BOB_ADDRESS;
const BUYER_MNEMONIC = BOB_MNEMONIC;

describe('contractTypeFromErgoTree', () => {
	it('returns sell contract', () => {
		expect(contractTypeFromErgoTree(depositBox), 'buy box').toBe('DEPOSIT');
	});
});

describe('deposit box parser', () => {
	it('R4 can be parsed', () => {
		const expected = {
			poolPk: '9fE4Hk2QXzij6eKt73ki93iWVKboZgRPgV95VZYmazdzqdjPEW8',
			userPk: '9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU'
		};
		expect(decodeR4(depositBox), 'userPk, poolPk').toStrictEqual(expected);
	});
	it('R5 can be parsed', () => {
		const expected = 1267580;
		expect(decodeR5(depositBox), 'unlock height').toStrictEqual(expected);
	});
	it('box recognized and parsed', () => {
		const expected = {
			contract: 'DEPOSIT',
			parameters: {
				userPk: '9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU',
				poolPk: '9fE4Hk2QXzij6eKt73ki93iWVKboZgRPgV95VZYmazdzqdjPEW8',
				unlockHeight: 1267580
			}
		};
		const actual = parseBox(depositBox);
		expect(actual, 'deposit type and parameters').toStrictEqual(expected);
	});
});

describe('buy order box parser', () => {
	let buyOrderBox: Box;

	beforeAll(async () => {
		const depositUTx = deposit(
			CHAIN_HEIGHT,
			PRINTER_UTXO,
			PRINTER_ADDRESS,
			BUYER_PK,
			BUYER_UNLOCK_HEIGHT,
			DEPOSIT_TOKEN,
			10n * SAFE_MIN_BOX_VALUE
		);
		const depositTx = await signTx(depositUTx, PRINTER_MNEMONIC);
		const depositBox = boxAtAddress(depositTx, DEPOSIT_ADDRESS);

		const token = {
			name: 'TestToken Test2',
			tokenId: 'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
			amount: 10_000_000_000n,
			decimals: 9
		};
		const RATE = 1n;

		const buyOrderUTx = buy(
			CHAIN_HEIGHT,
			[depositBox],
			BUYER_PK,
			RATE,
			BUYER_UNLOCK_HEIGHT,
			token,
			SAFE_MIN_BOX_VALUE
		);
		const buyOrderTx = await signTxMulti(buyOrderUTx, BUYER_MNEMONIC, BUYER_PK);
		buyOrderBox = boxAtAddress(buyOrderTx, BUY_ORDER_ADDRESS);
	});
	it('R4', () => {
		const expected = {
			poolPk: '9fE4Hk2QXzij6eKt73ki93iWVKboZgRPgV95VZYmazdzqdjPEW8',
			userPk: '9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU'
		};
		expect(decodeR4(buyOrderBox), 'userPk poolPk').toStrictEqual(expected);
	});
	it('R5', () => {
		const expected = 1250700;
		expect(decodeR5(buyOrderBox), 'unlock height').toStrictEqual(expected);
	});
	it('R6', () => {
		const expected = 'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab';
		expect(decodeTokenIdFromR6(buyOrderBox), 'tokenId').toStrictEqual(expected);
	});
	it('R7', () => {
		const expected = 1n;
		expect(decodeR7(buyOrderBox), 'rate').toStrictEqual(expected);
	});
	it('R8', () => {
		const expected =
			't5UVmPtqprz5zN2M2X5fRTajpYD2CYuamxePkcwNFc2t9Yc3DhNMyB81fLAqoL7t91hzyYacMA8uVzkpTYTRdg4A6gZHFZxVsvLo';
		expect(decodeR8(buyOrderBox), 'deposit address').toStrictEqual(expected);
	});
	it('box recognized and parsed', () => {
		const expected = {
			contract: 'BUY',
			parameters: {
				userPk: '9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU',
				poolPk: '9fE4Hk2QXzij6eKt73ki93iWVKboZgRPgV95VZYmazdzqdjPEW8',
				unlockHeight: 1250700,
				tokenId: 'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
				buyRate: 1n,
				buyerMultisigAddress:
					't5UVmPtqprz5zN2M2X5fRTajpYD2CYuamxePkcwNFc2t9Yc3DhNMyB81fLAqoL7t91hzyYacMA8uVzkpTYTRdg4A6gZHFZxVsvLo'
			}
		};
		const actual = parseBox(buyOrderBox);
		expect(actual, 'buy type and parameters').toStrictEqual(expected);
	});
});

describe(`sell order box parser`, () => {
	let sellOrderBox: Box;

	beforeAll(async () => {
		const depositUTx = deposit(
			CHAIN_HEIGHT,
			PRINTER_UTXO,
			PRINTER_ADDRESS,
			BUYER_PK,
			BUYER_UNLOCK_HEIGHT,
			DEPOSIT_TOKEN,
			10n * SAFE_MIN_BOX_VALUE
		);
		const depositTx = await signTx(depositUTx, PRINTER_MNEMONIC);
		const depositBox = boxAtAddress(depositTx, DEPOSIT_ADDRESS);

		const token = {
			name: 'TestToken Test2',
			tokenId: 'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
			amount: 10_000_000_000n,
			decimals: 9
		};
		const RATE = 1n;

		const sellOrderUTx = createSellOrderTx(
			BUYER_PK,
			DEPOSIT_ADDRESS,
			[depositBox],
			token,
			RATE,
			CHAIN_HEIGHT,
			BUYER_UNLOCK_HEIGHT
		);
		const sellOrderTx = await signTxMulti(sellOrderUTx, BUYER_MNEMONIC, BUYER_PK);

		sellOrderBox = boxAtAddress(sellOrderTx, SELL_ORDER_ADDRESS);
	});
	it('R4', () => {
		const expected = {
			userPk: '9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU',
			poolPk: '9fE4Hk2QXzij6eKt73ki93iWVKboZgRPgV95VZYmazdzqdjPEW8'
		};
		expect(decodeR4(sellOrderBox), 'userPk poolPk').toStrictEqual(expected);
	});
	it('R5', () => {
		const expected = 1250700;
		expect(decodeR5(sellOrderBox), 'unlock height').toStrictEqual(expected);
	});
	it('R6', () => {
		const expected = 'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab';
		expect(decodeTokenIdFromR6(sellOrderBox), 'tokenId').toStrictEqual(expected);
	});
	it('R7', () => {
		const expected = 1n;
		expect(decodeR7(sellOrderBox), 'rate').toStrictEqual(expected);
	});
	it('R8', () => {
		const expected =
			't5UVmPtqprz5zN2M2X5fRTajpYD2CYuamxePkcwNFc2t9Yc3DhNMyB81fLAqoL7t91hzyYacMA8uVzkpTYTRdg4A6gZHFZxVsvLo';
		expect(decodeR8(sellOrderBox), 'deposit address').toStrictEqual(expected);
	});
	it('box recognized and parsed', () => {
		const expected = {
			contract: 'SELL',
			parameters: {
				userPk: '9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU',
				poolPk: '9fE4Hk2QXzij6eKt73ki93iWVKboZgRPgV95VZYmazdzqdjPEW8',
				unlockHeight: 1250700,
				tokenId: 'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
				sellRate: 1n,
				sellerMultisigAddress:
					't5UVmPtqprz5zN2M2X5fRTajpYD2CYuamxePkcwNFc2t9Yc3DhNMyB81fLAqoL7t91hzyYacMA8uVzkpTYTRdg4A6gZHFZxVsvLo'
			}
		};
		const actual = parseBox(sellOrderBox);
		expect(actual, 'sell type and parameters').toStrictEqual(expected);
	});
});

describe('swap order box parser', async () => {
	let swapOrderBox: Box;
	beforeAll(async () => {
		const depositUTx = deposit(
			CHAIN_HEIGHT,
			PRINTER_UTXO,
			PRINTER_ADDRESS,
			BUYER_PK,
			BUYER_UNLOCK_HEIGHT,
			DEPOSIT_TOKEN,
			10n * SAFE_MIN_BOX_VALUE
		);
		const depositTx = await signTx(depositUTx, PRINTER_MNEMONIC);
		const depositBox = boxAtAddress(depositTx, DEPOSIT_ADDRESS);

		const sellingTokenId = DEPOSIT_TOKEN.tokenId;
		const buyingTokenId = 'd2d0deb3b0b2c511e523fd43ae838ba7b89e4583f165169b90215ff11d942c1f';

		const tokenForSwap = {
			tokenId: sellingTokenId,
			amount: '100'
		};
		const price = 1n;

		const swapOrderUTx = createSwapOrderTx(
			BUYER_PK,
			DEPOSIT_ADDRESS,
			[depositBox],
			tokenForSwap,
			price,
			CHAIN_HEIGHT,
			BUYER_UNLOCK_HEIGHT,
			sellingTokenId,
			buyingTokenId
		);

		const swapOrderTx = await signTxMulti(swapOrderUTx, BUYER_MNEMONIC, BUYER_PK);
		swapOrderBox = boxAtAddress(swapOrderTx, SWAP_ORDER_ADDRESS);
	});
	it('R4', () => {
		const expected = {
			userPk: '9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU',
			poolPk: '9fE4Hk2QXzij6eKt73ki93iWVKboZgRPgV95VZYmazdzqdjPEW8'
		};
		expect(decodeR4(swapOrderBox), 'userPk poolPk').toStrictEqual(expected);
	});
	it('R5', () => {
		const expected = 1250700;
		expect(decodeR5(swapOrderBox), 'unlock height').toStrictEqual(expected);
	});
	it('R6', () => {
		const expected = {
			sellingTokenId: 'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
			buyingTokenId: 'd2d0deb3b0b2c511e523fd43ae838ba7b89e4583f165169b90215ff11d942c1f'
		};
		expect(decodeTokenIdPairFromR6(swapOrderBox), 'tokenId').toStrictEqual(expected);
	});
	it('R7', () => {
		const expected = 1n;
		expect(decodeR7(swapOrderBox), 'rate').toStrictEqual(expected);
	});
	it('R8', () => {
		const expected =
			't5UVmPtqprz5zN2M2X5fRTajpYD2CYuamxePkcwNFc2t9Yc3DhNMyB81fLAqoL7t91hzyYacMA8uVzkpTYTRdg4A6gZHFZxVsvLo';
		expect(decodeR8(swapOrderBox), 'deposit address').toStrictEqual(expected);
	});
	it('box recognized and parsed', () => {
		const expected = {
			contract: 'SWAP',
			parameters: {
				userPk: '9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU',
				poolPk: '9fE4Hk2QXzij6eKt73ki93iWVKboZgRPgV95VZYmazdzqdjPEW8',
				unlockHeight: 1250700,
				sellingTokenId: 'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
				buyingTokenId: 'd2d0deb3b0b2c511e523fd43ae838ba7b89e4583f165169b90215ff11d942c1f',
				rate: 1n,
				sellerMultisigAddress:
					't5UVmPtqprz5zN2M2X5fRTajpYD2CYuamxePkcwNFc2t9Yc3DhNMyB81fLAqoL7t91hzyYacMA8uVzkpTYTRdg4A6gZHFZxVsvLo'
			}
		};
		const actual = parseBox(swapOrderBox);
		expect(actual, 'sell type and parameters').toStrictEqual(expected);
	});
});
