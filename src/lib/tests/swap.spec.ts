import { compileContract } from '$lib/compiler/compile';
import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	BUY_ORDER_ADDRESS,
	DEPOSIT_ADDRESS,
	SELL_ORDER_ADDRESS,
	SHADOWPOOL_ADDRESS,
	SWAP_ORDER_ADDRESS
} from '$lib/constants/addresses';
import { ALICE_MNEMONIC, BOB_MNEMONIC, SHADOW_MNEMONIC } from '$lib/constants/mnemonics';
import { utxos } from '$lib/data/utxos';
import { boxesAtAddress, boxesAtAddressUnsigned } from '$lib/utils/test-helper';
import {
	a,
	arrayToProposition,
	bInput,
	c,
	cInput,
	signMultisigEIP12,
	signTx,
	signTxInput,
	signTxMulti,
	submitTx,
	txHasErrors
} from '$lib/wallet/multisig-server';
import { ErgoAddress, ErgoTree, SAFE_MIN_BOX_VALUE, type Box } from '@fleet-sdk/core';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { describe, expect, it } from 'vitest';
import { createSwapOrderTxR9, executeSwap, createSwapOrderTx } from '../wallet/swap';
import { TOKEN } from '$lib/constants/tokens';
import { sumAssetsFromBoxes } from '$lib/utils/helper';
import { parseBox } from '../../server/db/db';
import type { BoxParameters, ContractType } from '$lib/types/boxRow';
import { createWithdrawTx, deposit } from '$lib/wallet/deposit';
import {
	ErgoBoxes,
	extract_hints,
	Transaction,
	UnsignedTransaction,
	type Input
} from 'ergo-lib-wasm-nodejs';
import { fakeContextX } from '$lib/constants/fakeContext';
import type { SignedTransaction } from '@fleet-sdk/common';
import { getContractBoxes } from '$lib/external/box';

const CONTRACT_FOR_TEST = `{	
	def getSellerPk(box: Box)              	= box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
	def getPoolPk(box: Box)                	= box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
	def unlockHeight(box: Box)             	= box.R5[Int].get
	def getSellingTokenId(box: Box)        	= box.R6[(Coll[Byte],Coll[Byte])].getOrElse((Coll[Byte](),Coll[Byte]()))._1
	def getBuyingTokenId(box: Box)         	= box.R6[(Coll[Byte],Coll[Byte])].getOrElse((Coll[Byte](),Coll[Byte]()))._2
	def getRate(box: Box)                  	= box.R7[Long].get
	def getSellerMultisigAddress(box: Box)  = box.R8[Coll[Byte]].get
  def getDenom(box: Box)                  = box.R9[Long].get



	def tokenId(box: Box) = box.tokens(0)._1
	def tokenAmount(box: Box) = box.tokens(0)._2


//------------------------
	def isSameContract(box: Box) = 
		box.propositionBytes == SELF.propositionBytes

	def isSameTokenPair (box: Box) = 
		getSellingTokenId(SELF) == getSellingTokenId(box) &&
		getBuyingTokenId(SELF)  == getBuyingTokenId(box)

	
  def hasSellingToken(box: Box) = 
		getSellingTokenId(SELF) == getSellingTokenId(box) &&
		box.tokens.size > 0 &&
		getSellingTokenId(SELF) == tokenId(box)

	def hasBuyingToken(box: Box) = 
		getBuyingTokenId(SELF) == getBuyingTokenId(box) &&
		box.tokens.size > 0 &&
		getBuyingTokenId(SELF) == tokenId(box)

  	def isGreaterZeroRate(box:Box) =
		getRate(box) > 0

	def isSameSeller(box: Box)   = 
		getSellerPk(SELF) == getSellerPk(box) &&
		getPoolPk(SELF) == getPoolPk(box)

  	def isSameUnlockHeight(box: Box)  = 
		unlockHeight(SELF) == unlockHeight(box)

 	def isSameMultisig(box: Box)    =
		getSellerMultisigAddress(SELF) == getSellerMultisigAddress(box)

	def isLegitInput(box: Box) =
		isSameContract(box) &&
		isSameSeller(box) &&
		isSameUnlockHeight(box) && 
		isSameTokenPair(box) &&
		hasSellingToken(box) &&
		isGreaterZeroRate(box) &&
		isSameMultisig(box)
//-------------------------
  val maxDenom: Long = INPUTS
		.filter(isLegitInput)
		.fold(0L, {(r:Long, box:Box) => {
			if(r > getDenom(box)) r else getDenom(box)
		}}) // TAKE MAX DENOM
  
    def getRateInMaxDenom(box:Box) = getRate(box)*maxDenom/getDenom(box) //1>

  	def sumTokenAmount(a:Long, b: Box) = a + tokenAmount(b)
  	def sumTokenAmountXRate(a:Long, b: Box) = a + tokenAmount(b) * getRateInMaxDenom(b)   // <---------------- REWORK WITH MAX DENOM

    val maxSellRate: Long = INPUTS
      .filter(isLegitInput)
      .fold(0L, {(r:Long, box:Box) => {
        if(r > getRateInMaxDenom(box)) r else getRateInMaxDenom(box)
      }})

      def hasMaxSellRate(box: Box) =
    getRate(box)*maxDenom==getDenom(box)*maxSellRate //include denom

  	def isLegitSellOrderOutput(box: Box) =
	  	isLegitInput(box)&&
	  	hasMaxSellRate(box)

  //-------------------------
	def isPaymentBox(box:Box) =
		isSameSeller(box) &&
		isSameUnlockHeight(box) &&
		hasBuyingToken(box) &&
		getSellerMultisigAddress(SELF) == box.propositionBytes

	def sumSellTokensIn(boxes: Coll[Box]): Long = boxes
		.filter(isLegitInput) 
		.fold(0L, sumTokenAmount)

	def sumSellTokensOut(boxes: Coll[Box]): Long = boxes
		.filter(isLegitSellOrderOutput)
		.fold(0L, sumTokenAmount)

	def sumBuyTokensPaid(boxes: Coll[Box]): Long = boxes
		.filter(isPaymentBox) 
		.fold(0L, sumTokenAmount)
//-------------------------

//-----------------
  	val tokensSold = sumSellTokensIn(INPUTS) - sumSellTokensOut(OUTPUTS) //rsBTC on contract (delta) (10000)

  	val tokensPaid = sumBuyTokensPaid(OUTPUTS) //sigUSD PAID (20) + ADD DENOM (1000) = > 20_000 

    	val inSellTokensXRate = INPUTS  //VOLUME INPUT ON CONTRACT
		.filter(isLegitInput) 
		.fold(0L, sumTokenAmountXRate)   // 2*10000

     	val outSellTokensXRate = OUTPUTS //VOLUME OUTPUT ON CONTRACT 
		.filter(isLegitSellOrderOutput)
		.fold(0L, sumTokenAmountXRate)  // Учитывает макс деном  

    val sellTokensXRate = inSellTokensXRate - outSellTokensXRate  // DELTA VOLUME в Макс деноме
    val expectedRate = sellTokensXRate / tokensSold   // 23125124 in DENOM MAX

    val isPaidAtFairRate = maxDenom*tokensPaid/tokensSold >= expectedRate  //sigUSD PAID (20) + ADD DENOM (1000) = > 20_000. * MAX_DENOM
    //1000
    //20
    //10000
    //>=
    //2
	
  if(HEIGHT > unlockHeight(SELF)){
		getSellerPk(SELF)
	}else{
    getSellerPk(SELF) && getPoolPk(SELF) || sigmaProp(isPaidAtFairRate) && getPoolPk(SELF)
	}
}`;

const CONTRACT_WITH_R9 = compileContract(CONTRACT_FOR_TEST);
let height = 1_284_140;
let unlockHeight = 1300000;

function customRecognizer(box: Box): ContractType {
	const address = new ErgoTree(box.ergoTree).toAddress().toString();
	if (address == DEPOSIT_ADDRESS) {
		return 'DEPOSIT';
	} else if (address == BUY_ORDER_ADDRESS) {
		return 'BUY';
	} else if (address == SELL_ORDER_ADDRESS) {
		return 'SELL';
	} else if (address == CONTRACT_WITH_R9) {
		return 'SWAP';
	} else {
		return 'UNKNOWN';
	}
}

function parseBoxCustom(box: Box): BoxParameters | undefined {
	return parseBox(box, customRecognizer);
}

describe.skip('Execute Swap with R9', async () => {
	const tokenForSale = {
		tokenId: TOKEN.rsBTC.tokenId,
		price: '0.002',
		amount: '10000'
	};
	const paymentToken = {
		tokenId: TOKEN.sigUSD.tokenId,
		amount: 20n
	};

	it('swap[BOB] + multisig_deposit[ALICE]', async () => {
		let depositTx = deposit(
			height,
			[utxos[BOB_ADDRESS][0]],
			BOB_ADDRESS,
			BOB_ADDRESS,
			unlockHeight,
			tokenForSale
		);
		let signedDepositTx = await signTx(depositTx, BOB_MNEMONIC);
		let depositsBob = boxesAtAddress(signedDepositTx, DEPOSIT_ADDRESS);
		expect(depositsBob.length).toBe(1);

		let depositTxAlice = deposit(
			height,
			[utxos[ALICE_ADDRESS][0]],
			ALICE_ADDRESS,
			ALICE_ADDRESS,
			unlockHeight,
			paymentToken
		);
		let signedDepositTxAlice = await signTx(depositTxAlice, ALICE_MNEMONIC);
		let depositsAlice = boxesAtAddress(signedDepositTxAlice, DEPOSIT_ADDRESS);
		expect(depositsAlice.length).toBe(1);

		let unsignedTx1 = createSwapOrderTxR9(
			BOB_ADDRESS,
			depositsBob,
			tokenForSale,
			tokenForSale.price,
			height,
			paymentToken.tokenId,
			CONTRACT_WITH_R9
		);

		const bobSwapTx = await signTxMulti(unsignedTx1, BOB_MNEMONIC, BOB_ADDRESS);
		const swapOrderBoxes = boxesAtAddress(bobSwapTx, CONTRACT_WITH_R9);
		expect(swapOrderBoxes, 'swap order boxes').toBeDefined();
		expect(swapOrderBoxes.length, 'swap order boxes length').toBe(1);

		const paymentInTokens = {
			tokenId: paymentToken.tokenId,
			amount: BigInt(Number(tokenForSale.amount) * Number(tokenForSale.price))
		};

		const executeSwapOrderTx = executeSwap(
			height,
			swapOrderBoxes,
			depositsAlice,
			tokenForSale,
			paymentInTokens,
			SAFE_MIN_BOX_VALUE
		);

		expect(executeSwapOrderTx.inputs.length).toBe(2);

		expect(boxesAtAddressUnsigned(executeSwapOrderTx, DEPOSIT_ADDRESS).length).toBe(2);
		expect(boxesAtAddressUnsigned(executeSwapOrderTx, SWAP_ORDER_ADDRESS).length).toBe(0);
		expect(parseBoxCustom(executeSwapOrderTx.inputs[0])?.contract).toBe('SWAP');
		expect(parseBoxCustom(executeSwapOrderTx.inputs[0])?.parameters.userPk).toBe(BOB_ADDRESS);
		expect(parseBoxCustom(executeSwapOrderTx.inputs[0])?.parameters.poolPk).toBe(
			SHADOWPOOL_ADDRESS
		);
		expect(parseBoxCustom(executeSwapOrderTx.inputs[0])?.parameters.unlockHeight).toBe(1300000);

		const sInput0 = await signTxInput(
			SHADOW_MNEMONIC,
			JSON.parse(JSON.stringify(executeSwapOrderTx)),
			0
		);
		expect(sInput0, 'shadow can sign index:0').toBeDefined();

		expect(parseBoxCustom(executeSwapOrderTx.inputs[1])?.contract).toBe('DEPOSIT');
		expect(parseBoxCustom(executeSwapOrderTx.inputs[1])?.parameters.userPk).toBe(ALICE_ADDRESS);
		expect(parseBoxCustom(executeSwapOrderTx.inputs[1])?.parameters.unlockHeight).toBe(1300000);

		// multisig signing a single input[1]
		const { privateCommitsPool, publicCommitsPool } = await a(executeSwapOrderTx);
		expect(publicCommitsPool).toBeDefined();

		const sInput1: Input = await bInput(
			executeSwapOrderTx,
			ALICE_MNEMONIC,
			ALICE_ADDRESS,
			publicCommitsPool,
			1
		);

		function hexToUint8Array(str: string): Uint8Array {
			const utf8: string = unescape(encodeURIComponent(str));
			const array = new Uint8Array(utf8.length);
			for (let i = 0; i < utf8.length; i++) {
				array[i] = utf8.charCodeAt(i);
			}
			return array;
		}

		function getProof(input: Input) {
			return hexToUint8Array(input.spending_proof().to_json());
		}

		// const transaction = proverAlice.sign_reduced_transaction_multi(reducedTx, combinedHints);
		const unsigned_tx = UnsignedTransaction.from_json(JSON.stringify(executeSwapOrderTx));
		const tx = Transaction.from_unsigned_tx(unsigned_tx, [
			getProof(sInput0),
			getProof(sInput1)
		]);
		//expect(executeSwapOrderTx.inputs).toBe(1);

		const hUser = ErgoAddress.fromBase58(ALICE_ADDRESS).ergoTree.slice(6);
		let extractedHints = extract_hints(
			tx,
			fakeContextX(),
			ErgoBoxes.from_boxes_json(executeSwapOrderTx.inputs),
			ErgoBoxes.empty(),
			arrayToProposition([hUser]),
			arrayToProposition([])
		).to_json();
		//		 expect(extractedHints).toBe(1);

		const signedInput = await cInput(executeSwapOrderTx, privateCommitsPool, extractedHints, 1);
		const utx = UnsignedTransaction.from_json(JSON.stringify(executeSwapOrderTx));
		const signedTx = Transaction.from_unsigned_tx(utx, [
			getProof(sInput0),
			getProof(signedInput)
		]).to_js_eip12();
		expect(signedTx).toBeDefined();

		//console.log(unsignedTx1) + BobChangeFromCreate
		const changeFromCreateSwap = boxesAtAddress(bobSwapTx, DEPOSIT_ADDRESS); //Deposit
		const changeFromSwapExecute = boxesAtAddress(signedTx, DEPOSIT_ADDRESS); //Deposit

		const aliceWithdrawBoxes = changeFromSwapExecute.filter(
			(b) => parseBox(b)?.parameters.userPk == ALICE_ADDRESS
		);
		//console.log(aliceWithdrawBoxes);

		const bobWithdrawBoxes = [
			...changeFromSwapExecute.filter((b) => parseBox(b)?.parameters.userPk == BOB_ADDRESS),
			...changeFromCreateSwap
		];
		//console.log(bobWithdrawBoxes);

		const withdrawUTxAlice = createWithdrawTx(ALICE_ADDRESS, aliceWithdrawBoxes, height);
		const withdrawTxAlice = await signTxMulti(withdrawUTxAlice, ALICE_MNEMONIC, ALICE_ADDRESS);
		expect(withdrawTxAlice).toBeTruthy();

		const withdrawUTxBob = createWithdrawTx(BOB_ADDRESS, bobWithdrawBoxes, height);
		//console.log(withdrawUTxBob);
		const withdrawTxBob = await signTxMulti(withdrawUTxBob, BOB_MNEMONIC, BOB_ADDRESS);
		expect(withdrawTxBob).toBeTruthy();
		//console.log(changeFromSwapExecute);
	});
});

describe.skip('E2E: ', async () => {
	const tokenForSale = {
		tokenId: TOKEN.rsBTC.tokenId,
		price: '0.002',
		amount: '10000'
	};
	const paymentToken = {
		tokenId: TOKEN.sigUSD.tokenId,
		amount: 20n
	};

	it.skip(
		'Part1. Deposit swap[BOB] + multisig_deposit[ALICE]',
		async () => {
			let depositTx = deposit(
				height,
				[utxos[BOB_ADDRESS][0]], //add 1 more box
				BOB_ADDRESS,
				BOB_ADDRESS,
				unlockHeight,
				tokenForSale
			);
			let signedDepositTxBob = await signTx(depositTx, BOB_MNEMONIC);
			let depositsBob = boxesAtAddress(signedDepositTxBob, DEPOSIT_ADDRESS);
			expect(depositsBob.length).toBe(1);

			let depositTxAlice = deposit(
				height,
				[utxos[ALICE_ADDRESS][0]], //add 1 more box
				ALICE_ADDRESS,
				ALICE_ADDRESS,
				unlockHeight,
				paymentToken
			);
			let signedDepositTxAlice = await signTx(depositTxAlice, ALICE_MNEMONIC);
			let depositsAlice = boxesAtAddress(signedDepositTxAlice, DEPOSIT_ADDRESS);
			expect(depositsAlice.length).toBe(1);

			// expect(await txHasErrors(signedDepositTxBob)).toBe(false);
			// expect(await txHasErrors(signedDepositTxAlice)).toBe(false);

			let unsignedTx1 = createSwapOrderTxR9(
				BOB_ADDRESS,
				depositsBob,
				tokenForSale,
				tokenForSale.price,
				height,
				paymentToken.tokenId,
				CONTRACT_WITH_R9
			);

			const bobSwapTx = await signTxMulti(unsignedTx1, BOB_MNEMONIC, BOB_ADDRESS);
			const swapOrderBoxes = boxesAtAddress(bobSwapTx, CONTRACT_WITH_R9);
			expect(swapOrderBoxes, 'swap order boxes').toBeDefined();
			expect(swapOrderBoxes.length, 'swap order boxes length').toBe(1);

			const paymentInTokens = {
				tokenId: paymentToken.tokenId,
				amount: BigInt(Number(tokenForSale.amount) * Number(tokenForSale.price))
			};

			const executeSwapOrderTx = executeSwap(
				height,
				swapOrderBoxes,
				depositsAlice,
				tokenForSale,
				paymentInTokens,
				SAFE_MIN_BOX_VALUE
			);

			expect(executeSwapOrderTx.inputs.length).toBe(2);

			expect(boxesAtAddressUnsigned(executeSwapOrderTx, DEPOSIT_ADDRESS).length).toBe(2);
			expect(boxesAtAddressUnsigned(executeSwapOrderTx, SWAP_ORDER_ADDRESS).length).toBe(0);
			expect(parseBoxCustom(executeSwapOrderTx.inputs[0])?.contract).toBe('SWAP');
			expect(parseBoxCustom(executeSwapOrderTx.inputs[0])?.parameters.userPk).toBe(
				BOB_ADDRESS
			);
			expect(parseBoxCustom(executeSwapOrderTx.inputs[0])?.parameters.poolPk).toBe(
				SHADOWPOOL_ADDRESS
			);
			expect(parseBoxCustom(executeSwapOrderTx.inputs[0])?.parameters.unlockHeight).toBe(
				1300000
			);

			const sInput0 = await signTxInput(
				SHADOW_MNEMONIC,
				JSON.parse(JSON.stringify(executeSwapOrderTx)),
				0
			);
			expect(sInput0, 'shadow can sign index:0').toBeDefined();

			expect(parseBoxCustom(executeSwapOrderTx.inputs[1])?.contract).toBe('DEPOSIT');
			expect(parseBoxCustom(executeSwapOrderTx.inputs[1])?.parameters.userPk).toBe(
				ALICE_ADDRESS
			);
			expect(parseBoxCustom(executeSwapOrderTx.inputs[1])?.parameters.unlockHeight).toBe(
				1300000
			);

			// multisig signing a single input[1]
			const { privateCommitsPool, publicCommitsPool } = await a(executeSwapOrderTx);
			expect(publicCommitsPool).toBeDefined();

			const sInput1: Input = await bInput(
				executeSwapOrderTx,
				ALICE_MNEMONIC,
				ALICE_ADDRESS,
				publicCommitsPool,
				1
			);

			function hexToUint8Array(str: string): Uint8Array {
				const utf8: string = unescape(encodeURIComponent(str));
				const array = new Uint8Array(utf8.length);
				for (let i = 0; i < utf8.length; i++) {
					array[i] = utf8.charCodeAt(i);
				}
				return array;
			}

			function getProof(input: Input) {
				return hexToUint8Array(input.spending_proof().to_json());
			}

			// const transaction = proverAlice.sign_reduced_transaction_multi(reducedTx, combinedHints);
			const unsigned_tx = UnsignedTransaction.from_json(JSON.stringify(executeSwapOrderTx));
			const tx = Transaction.from_unsigned_tx(unsigned_tx, [
				getProof(sInput0),
				getProof(sInput1)
			]);
			//expect(executeSwapOrderTx.inputs).toBe(1);

			const hUser = ErgoAddress.fromBase58(ALICE_ADDRESS).ergoTree.slice(6);
			let extractedHints = extract_hints(
				tx,
				fakeContextX(),
				ErgoBoxes.from_boxes_json(executeSwapOrderTx.inputs),
				ErgoBoxes.empty(),
				arrayToProposition([hUser]),
				arrayToProposition([])
			).to_json();
			//		 expect(extractedHints).toBe(1);

			const signedInput = await cInput(
				executeSwapOrderTx,
				privateCommitsPool,
				extractedHints,
				1
			);
			const utx = UnsignedTransaction.from_json(JSON.stringify(executeSwapOrderTx));
			const signedTx = Transaction.from_unsigned_tx(utx, [
				getProof(sInput0),
				getProof(signedInput)
			]).to_js_eip12();
			expect(signedTx).toBeDefined();

			//console.log(unsignedTx1) + BobChangeFromCreate
			const changeFromCreateSwap = boxesAtAddress(bobSwapTx, DEPOSIT_ADDRESS); //Deposit
			const changeFromSwapExecute = boxesAtAddress(signedTx, DEPOSIT_ADDRESS); //Deposit

			const aliceWithdrawBoxes = changeFromSwapExecute.filter(
				(b) => parseBox(b)?.parameters.userPk == ALICE_ADDRESS
			);
			//console.log(aliceWithdrawBoxes);

			const bobWithdrawBoxes = [
				...changeFromSwapExecute.filter(
					(b) => parseBox(b)?.parameters.userPk == BOB_ADDRESS
				),
				...changeFromCreateSwap
			];
			//console.log(bobWithdrawBoxes);

			const withdrawUTxAlice = createWithdrawTx(ALICE_ADDRESS, aliceWithdrawBoxes, height);
			const withdrawTxAlice = await signTxMulti(
				withdrawUTxAlice,
				ALICE_MNEMONIC,
				ALICE_ADDRESS
			);
			expect(withdrawTxAlice).toBeTruthy();

			const withdrawUTxBob = createWithdrawTx(BOB_ADDRESS, bobWithdrawBoxes, height);
			//console.log(withdrawUTxBob);
			const withdrawTxBob = await signTxMulti(withdrawUTxBob, BOB_MNEMONIC, BOB_ADDRESS);
			expect(withdrawTxBob).toBeTruthy();
			//console.log(changeFromSwapExecute);

			//DEPOSIT:
			expect(await SubmitWithDelay(signedDepositTxBob)).not.toBe(false);
			expect(await SubmitWithDelay(signedDepositTxAlice)).not.toBe(false);

			//Swap
			expect(await SubmitWithDelay(bobSwapTx)).not.toBe(false);

			//Execute
			expect(await SubmitWithDelay(signedTx)).not.toBe(false);

			//Withdraw
			expect(await SubmitWithDelay(withdrawTxBob)).not.toBe(false);
			expect(await SubmitWithDelay(withdrawTxAlice)).not.toBe(false);
		},
		20 * 1000
	);
});

describe('E2E: only execute', async () => {
	let utxoTestSwapContract = [];
	utxoTestSwapContract = await getContractBoxes(CONTRACT_WITH_R9);
	const test = JSON.parse(JSON.stringify(utxoTestSwapContract, null, 2));

	const tokenForSale = {
		tokenId: TOKEN.rsBTC.tokenId,
		price: '0.002',
		amount: '10000'
	};
	const paymentToken = {
		tokenId: TOKEN.sigUSD.tokenId,
		amount: 20n
	};

	it(
		'Part1. Deposit swap[BOB] + multisig_deposit[ALICE]',
		async () => {
			const swapOrderBoxes = test[0]; //<----- Take
			const depositsAlice = utxos[DEPOSIT_ADDRESS]; //<----- Take

			const aliceDepositBoxes = depositsAlice.filter(
				(b) => parseBox(b)?.parameters.userPk == ALICE_ADDRESS
			);

			const paymentInTokens = {
				tokenId: paymentToken.tokenId,
				amount: BigInt(Number(tokenForSale.amount) * Number(tokenForSale.price))
			};

			const executeSwapOrderTx = executeSwap(
				height,
				[swapOrderBoxes],
				[aliceDepositBoxes[0]],
				tokenForSale,
				paymentInTokens,
				SAFE_MIN_BOX_VALUE
			);

			// console.log('Unsigned TX:');
			// console.dir(executeSwapOrderTx);
			console.log('PARSE BOX 0:');
			console.log(parseBoxCustom(executeSwapOrderTx.inputs[0]));
			console.log('PARSE BOX 1:');
			console.log(parseBoxCustom(executeSwapOrderTx.inputs[1]));

			expect(executeSwapOrderTx.inputs.length).toBe(2);

			expect(boxesAtAddressUnsigned(executeSwapOrderTx, DEPOSIT_ADDRESS).length).toBe(2);
			expect(boxesAtAddressUnsigned(executeSwapOrderTx, SWAP_ORDER_ADDRESS).length).toBe(0);
			expect(parseBoxCustom(executeSwapOrderTx.inputs[0])?.contract).toBe('SWAP');
			expect(parseBoxCustom(executeSwapOrderTx.inputs[0])?.parameters.userPk).toBe(
				BOB_ADDRESS
			);
			expect(parseBoxCustom(executeSwapOrderTx.inputs[0])?.parameters.poolPk).toBe(
				SHADOWPOOL_ADDRESS
			);
			expect(parseBoxCustom(executeSwapOrderTx.inputs[0])?.parameters.unlockHeight).toBe(
				1300000
			);

			const sInput0 = await signTxInput(
				SHADOW_MNEMONIC,
				JSON.parse(JSON.stringify(executeSwapOrderTx)),
				0
			);
			expect(sInput0, 'shadow can sign index:0').toBeDefined();

			expect(parseBoxCustom(executeSwapOrderTx.inputs[1])?.contract).toBe('DEPOSIT');
			expect(parseBoxCustom(executeSwapOrderTx.inputs[1])?.parameters.userPk).toBe(
				ALICE_ADDRESS
			);
			expect(parseBoxCustom(executeSwapOrderTx.inputs[1])?.parameters.unlockHeight).toBe(
				1300000
			);

			// multisig signing a single input[1]
			const { privateCommitsPool, publicCommitsPool } = await a(executeSwapOrderTx);
			expect(publicCommitsPool).toBeDefined();

			const sInput1: Input = await bInput(
				executeSwapOrderTx,
				ALICE_MNEMONIC,
				ALICE_ADDRESS,
				publicCommitsPool,
				1
			);

			function hexToUint8Array(str: string): Uint8Array {
				const utf8: string = unescape(encodeURIComponent(str));
				const array = new Uint8Array(utf8.length);
				for (let i = 0; i < utf8.length; i++) {
					array[i] = utf8.charCodeAt(i);
				}
				return array;
			}

			function getProof(input: Input) {
				return hexToUint8Array(input.spending_proof().to_json());
			}

			// const transaction = proverAlice.sign_reduced_transaction_multi(reducedTx, combinedHints);
			const unsigned_tx = UnsignedTransaction.from_json(JSON.stringify(executeSwapOrderTx));
			const tx = Transaction.from_unsigned_tx(unsigned_tx, [
				getProof(sInput0),
				getProof(sInput1)
			]);
			//expect(executeSwapOrderTx.inputs).toBe(1);

			const hUser = ErgoAddress.fromBase58(ALICE_ADDRESS).ergoTree.slice(6);
			let extractedHints = extract_hints(
				tx,
				fakeContextX(),
				ErgoBoxes.from_boxes_json(executeSwapOrderTx.inputs),
				ErgoBoxes.empty(),
				arrayToProposition([hUser]),
				arrayToProposition([])
			).to_json();
			//		 expect(extractedHints).toBe(1);

			const signedInput = await cInput(
				executeSwapOrderTx,
				privateCommitsPool,
				extractedHints,
				1
			);
			const utx = UnsignedTransaction.from_json(JSON.stringify(executeSwapOrderTx));
			const signedTx = Transaction.from_unsigned_tx(utx, [
				getProof(sInput0),
				getProof(signedInput)
			]).to_js_eip12();
			expect(signedTx).toBeDefined();

			//Execute
			//console.log('proof1');
			//console.dir(sInput0.spending_proof().to_json(), { depth: null });

			//signedTx.inputs[0].spendingProof = JSON.parse(sInput0.spending_proof().to_json());
			//signedTx.inputs[1].spendingProof = JSON.parse(signedInput.spending_proof().to_json());

			// console.log('FINAL TX:');
			// console.dir(signedTx, { depth: null });

			expect(await txHasErrors(signedTx)).toBe(false);
			//expect(await SubmitWithDelay(signedTx)).not.toBe(false);
		},
		20 * 1000
	);
});

async function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function SubmitWithDelay(signedTransaction: SignedTransaction) {
	let noError = false;
	while (true) {
		noError = await txHasErrors(signedTransaction);
		if (noError === false) {
			await submitTx(signedTransaction);
			break; // Выход из цикла после выполнения функции submitTx
		}
		await delay(1000); // Ожидание 1 секунду перед следующей проверкой
	}
}
