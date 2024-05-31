import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	DEPOSIT_ADDRESS,
	SWAP_ORDER_ADDRESS
} from '$lib/constants/addresses';
import {
	ALICE_MNEMONIC,
	BOB_MNEMONIC,
	SHADOW_MNEMONIC
} from '$lib/constants/mnemonics';
import {
	signMultisig,
	signTxByAddress,
	signTxInput,
	txHasErrors
} from '$lib/wallet/multisig-server';
import { utxos } from '$lib/data/utxos';
import {
	ErgoAddress,
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	SAFE_MIN_BOX_VALUE,
	TransactionBuilder
} from '@fleet-sdk/core';
import { beforeAll, describe, expect, it } from 'vitest';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { createSwapOrderTx, createSwapOrderTxR9 } from '../wallet/swap';
import BigNumber from 'bignumber.js';
import { depositAddress } from '$lib/constants/depositAddress';
import { decodeR5 } from '$lib/db/db';

const sellingTokenId =
	'69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8'; //HoldErgDoge Test1
const buyingTokenId =
	'd2d0deb3b0b2c511e523fd43ae838ba7b89e4583f165169b90215ff11d942c1f'; //SwapToken Test1
const orderValue = SAFE_MIN_BOX_VALUE;

const tokenForSale = {
	tokenId: '69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
	amount: '100'
};

const price = 2n;

let height = 1_260_252; // await fetchHeight()
let unlockHeight = 1300000;

let swapOrderBoxes: any;

describe('OLD Swap order', async () => {
	beforeAll(async () => {
		const unsignedTx = createSwapOrderTx(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxos[BOB_ADDRESS],
			tokenForSale,
			price,
			height,
			unlockHeight,
			sellingTokenId,
			buyingTokenId
		);

		const signedTx = await signTxByAddress(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsignedTx
		);
		swapOrderBoxes = [signedTx.outputs[0]];
	});

	//swapOrderBoxes

	it('execute swap order', async () => {
		const buyAmount = 50n;
		const error = 0n;
		const buyerPk = ALICE_ADDRESS;
		const currentHeight = height;

		const paymentInTokens = {
			tokenId: buyingTokenId,
			amount: buyAmount * price
		}; // Сколько заплатили в Других токенах

		//Seller Output
		const outputPayment = new OutputBuilder(
			SAFE_MIN_BOX_VALUE,
			DEPOSIT_ADDRESS
		)
			.setAdditionalRegisters({
				R4: swapOrderBoxes[0].additionalRegisters.R4,
				R5: swapOrderBoxes[0].additionalRegisters.R5,
				R6: swapOrderBoxes[0].additionalRegisters.R6
			})
			.addTokens(paymentInTokens);

		const tempOutputSwapOrder = JSON.parse(
			JSON.stringify(swapOrderBoxes[0])
		);

		tempOutputSwapOrder.assets[0].amount =
			BigInt(tokenForSale.amount) - buyAmount;

		//Swap Order Output
		const outputSwapOrder = new OutputBuilder(
			tempOutputSwapOrder.value,
			SWAP_ORDER_ADDRESS
		)
			.addTokens(tempOutputSwapOrder.assets)
			.setAdditionalRegisters(tempOutputSwapOrder.additionalRegisters);

		const unsignedTransaction = new TransactionBuilder(currentHeight)
			.configureSelector((selector) =>
				selector.ensureInclusion(swapOrderBoxes.map((b) => b.boxId))
			)
			.from([...swapOrderBoxes, ...utxos[buyerPk]])
			.to([outputPayment, outputSwapOrder])
			.sendChangeTo(buyerPk) //add registers
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		//Sign inputs
		const unsignedTx = unsignedTransaction; // <---
		let swapContractUtxo = swapOrderBoxes;

		const shadowIndex = unsignedTx.inputs.findIndex((b) =>
			swapContractUtxo.map((b) => b.boxId).includes(b.boxId)
		);
		expect(shadowIndex).toBe(0);

		const signedShadowInput = await signTxInput(
			SHADOW_MNEMONIC,
			unsignedTx,
			shadowIndex
		);

		const shadowInputProof = JSON.parse(
			signedShadowInput.spending_proof().to_json()
		);
		expect(shadowInputProof.proofBytes.length).greaterThan(10);

		const aliceIndex = unsignedTx.inputs.findIndex((b) =>
			utxos[ALICE_ADDRESS].map((b) => b.boxId).includes(b.boxId)
		);
		expect(aliceIndex).toBe(1);
		expect(unsignedTx.inputs[aliceIndex].ergoTree).toBe(
			ErgoAddress.fromBase58(ALICE_ADDRESS).ergoTree
		);
		const signedAliceInput = await signTxInput(
			ALICE_MNEMONIC,
			unsignedTx,
			aliceIndex
		);
		const aliceInputProof = JSON.parse(
			signedAliceInput.spending_proof().to_json()
		);
		expect(aliceInputProof.proofBytes.length).greaterThan(10);

		const txId = wasm.UnsignedTransaction.from_json(
			JSON.stringify(unsignedTx)
		)
			.id()
			.to_str();

		unsignedTx.inputs[shadowIndex] = {
			boxId: unsignedTx.inputs[shadowIndex].boxId,
			spendingProof: shadowInputProof
		};
		unsignedTx.inputs[aliceIndex] = {
			boxId: unsignedTx.inputs[aliceIndex].boxId,
			spendingProof: aliceInputProof
		};

		unsignedTx.id = txId;
	});
});
//FxyP1tYPbxZVwjCTB
const CONTRACT_WITH_R9 =
	'LRDNLdTJ798EJwU1MNKHJpduriCU7vijfJv8bUvYP58Uxq7JNuKdoa3XXTYaT7qFf8QUQnhPkjpH9wFuLmSNE7qGrdx1mMiZowJQ2aPhqGJqMvkShrEpGstTuDhHFNTjj8HBFQpQJjUfjAdYJjvmk7axctvKQnDDkns9BPunBAi3qxj8L4AwVUULrRmGkVjdBzAAVNsPMyzv178pgtEZ2kmYUK1s6f91ntZ2PratWWjQg2gWMUHoSprCFDUXizrL7tHGeJT4D5dtgnZGTZti7fG5w5CBykmcmJJcyXigoUTEk2ZX2Mc9oyZWobjcQJVpY21Jr6HExZYg3qbfVnrVUeBtjmxjjQouNo2CRwKr4AmpbvsPG27negVMwTHA43ohig8i7EteWj36NY6b9vsRgvZ5V7EZTFrwdvtYHoyDFfcQ7X5tVK78B3aBvpvxxA4utB1H5ewuH2fqzmUkCaxjgLw1VgC6rMQpMpRTTAzrLAaYRe6qSGs7CiAEwHVNyXAoV2z4iscCX2ZMMDDvbX8pCQoz42VXvPhvyMLCGS5iPHbjd2L1jCwjjLfcXebNjNMSsvTMddDhh6szXbyvs5AbFRzxCrmeM6K8kGqQbjiQRtKARNkGkb18ZsDhQiEWRMzbQaeeF4Yut3aBJEUqXGG68MjfECTHz9A5NNd5KBodY8jiN6w7wKLE2vnLA7Fv4RQSmRoPuhnNJaC8gnbWJYrHWYRbNspMCX8WLRsFymA7ccWJuT1aoNZ3NsrtFGUUc97sFXxR5Pe8H7FaKKBvVyhb4kp3S3qTJq1sAzCyHyCVxgQvnJsACdyWukGHP6fewJqKWb6WdG8FKYrMmSdDYwCebSx8JrHVk3bQua34SrPcyrYweNFTUC4reAeadW5fUvPEwU71n9Ubw867P46qgbT8o7ZnDtHsdyYznNQrQkpW3hvToZbG4KxXvdpU2uggm733PS468kK7NuESYwscnwMy6UetJ1PdjC1YcsYB4oZ2kEukaYaq6B8kXgLxicApDxDeadNeUCSBXdHrFndCSWwcmth74dyapqQ2aVBNqt96rUGF5UaezaMSDRGsZPVXqbqMVGHQNHT4JsMMetZT';
const oldOne =
	'z7VueFDPFLMq2wB1hmBzqt3r51fSGCn9b4aFcLysRVVd7nS8qSBR6bTRMTU3NvXFQrCeQwho7nN1XVQSMJTucdyBpz324CZhUAzbJ1sYwTXDMUioKKuc85Qv7NTbqsQ43tGYehQzENcaWYRsPrccsrPN9gRjTZB3pPKSMW5xhbz2oBtohB3hgwKwfZr7bcYxodkbSQH422gRPYayvZA5tkuQ1cew97KVA2soHci2TbKC1819dGSYbYekjbD3BmgmEYbQom9hzxdEbAHdkqbqdh6rvuzdZNCyGqNddUvA8V97GzanfSpcGsNtWGxR9MJrycwHCtTR2qGkSVdM4cXw9VRF2hmuFfntTgqVA3j5WHuFUWaiTVWTUD9udsWhJnYmHez5Qu5kxKm73FREGAuqd7hCUBsYYUxqKWmqNgRGTgsPjAGh63Ne6PLrP8GDAKUYKkkRoXW28g8r4RLjhRCxwd22tXBweLPFRfawCVPD96aBQdogZNLYshUm3KRub6tQmRDJQaJgC84mW4G2xwjAeSioyH4wvHNBfUnrdJKeGuNZ1HWWojJzVRGeYeVHFcb5A2J4M6MKg8QGLjd1AixeTbHTxiyQ4ifg2AXDSdArXt2EbS4hgHizuaqCCrojyyqRKHcK2ngAFj154DGPn9xuTLA4826vv8W6eoPsHXp33UKTwbc54A7TftiHv444YnHYtDcWTaqzYCihC7PYpikzE9YX9rSGyLjZJ1rTnizdu6aa8g2DnW1xDmVfaXGiPazrNBtjBkVjczbytQs4wabJJCwT8p1oyBEyMrSpDmePk7EBmDSejdiNK86TzBAanACypgEbh39K2L98B6RJ4ZMBxcYhY6Gc3WdegMiYUn3LWfYjYhtcVB7KJQ6hRH8n3E3mHVUEK3wWKEfF9VZUJYyx1kvWjZynwoyjjSjjfe315Rf1o3B85cTDJcZcej336KuJrUDYYMZCV9qKbjEhQh9C3rr3ThWszzY35FUmsbVLVE8Mum2LZCZMockhu6Qjg4RXLYmtxveexeLp32cnWfpT6BTLUY79SzeBFu4XZLCyyFT1s8cKGT1k9vL7fkJ7FLTchexMFEHUwD2Yd';

describe('New Swap order with R9', async () => {
	const price = '0.002';
	const tokenForSale = {
		tokenId:
			'5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
		amount: '10000'
	};
	const sellingTokenId =
		'5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d';
	const buyingTokenId =
		'03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04';

	beforeAll(async () => {
		const unsignedTx = createSwapOrderTxR9(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxos[BOB_ADDRESS],
			tokenForSale,
			price,
			height,
			unlockHeight,
			sellingTokenId,
			buyingTokenId,
			CONTRACT_WITH_R9
		);

		const signedTx = await signTxByAddress(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsignedTx
		);
		swapOrderBoxes = [signedTx.outputs[0]];
	});

	//swapOrderBoxes

	it('alice can swap order with price <1', async () => {
		const buyAmount = 10000n;
		const error = 0n;
		const buyerPk = ALICE_ADDRESS;
		const currentHeight = height;

		const paymentInTokens = {
			tokenId: buyingTokenId,
			amount: BigInt(Number(buyAmount) * price)
		}; //TODO:FIX ROUNDING AND MAKE ACCURATE CALCULATIONS

		//Seller Output
		const outputPayment = new OutputBuilder(
			SAFE_MIN_BOX_VALUE,
			DEPOSIT_ADDRESS
		)
			.setAdditionalRegisters({
				R4: swapOrderBoxes[0].additionalRegisters.R4,
				R5: swapOrderBoxes[0].additionalRegisters.R5,
				R6: swapOrderBoxes[0].additionalRegisters.R6
			})
			.addTokens(paymentInTokens);

		const aliceBox = utxos[DEPOSIT_ADDRESS][0];
		const newUnlockHeight = decodeR5(aliceBox);
		//04c0d89e01
		console.log('newUnlockHeight', newUnlockHeight);
		const tempOutputSwapOrder = JSON.parse(
			JSON.stringify(swapOrderBoxes[0])
		);

		tempOutputSwapOrder.assets[0].amount =
			BigInt(tokenForSale.amount) - buyAmount;

		//outputSwapOrder
		//Swap Order Output
		// const outputSwapOrder = new OutputBuilder(
		// 	tempOutputSwapOrder.value,
		// 	SWAP_ORDER_ADDRESS
		// )
		// 	.addTokens(tempOutputSwapOrder.assets)
		// 	.setAdditionalRegisters(tempOutputSwapOrder.additionalRegisters);

		const unsignedTransaction = new TransactionBuilder(currentHeight)
			.configureSelector((selector) =>
				selector.ensureInclusion(swapOrderBoxes.map((b) => b.boxId))
			)
			.from([...swapOrderBoxes, aliceBox])
			.to([outputPayment])
			.sendChangeTo(ALICE_ADDRESS) //add registers and DONT SEND
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signedTx = await signMultisig(
			unsignedTransaction,
			ALICE_MNEMONIC,
			ALICE_ADDRESS
		);
		//console.dir(signedTx.to_js_eip12(), { depth: null });

		expect(await txHasErrors(signedTx.to_js_eip12())).not.toBe(false);
	});

	it('BOB can cancell with seller sign', async () => {
		const buyAmount = 10000n;
		const error = 0n;
		const buyerPk = ALICE_ADDRESS;
		const currentHeight = height;
		console.log(swapOrderBoxes[0].value);
		const outputPayment = new OutputBuilder(
			BigInt(swapOrderBoxes[0].value),
			DEPOSIT_ADDRESS
		)
			.setAdditionalRegisters({
				R4: swapOrderBoxes[0].additionalRegisters.R4,
				R5: swapOrderBoxes[0].additionalRegisters.R5,
				R6: swapOrderBoxes[0].additionalRegisters.R6
			})
			.addTokens(swapOrderBoxes[0].assets[0]);

		const unsignedTransaction = new TransactionBuilder(currentHeight)
			.configureSelector((selector) =>
				selector.ensureInclusion(swapOrderBoxes.map((b) => b.boxId))
			)
			.from([...swapOrderBoxes, ...utxos[BOB_ADDRESS]])
			.to([outputPayment])
			.sendChangeTo(BOB_ADDRESS) //add registers and DONT SEND
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signedTx = await signMultisig(
			unsignedTransaction,
			BOB_MNEMONIC,
			BOB_ADDRESS
		);
		//console.dir(signedTx.to_js_eip12(), { depth: null });

		expect(await txHasErrors(signedTx.to_js_eip12())).not.toBe(false);
	});
});
