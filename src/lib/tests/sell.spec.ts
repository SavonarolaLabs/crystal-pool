import { beforeAll, describe, expect, it } from 'vitest';
import {
	ErgoAddress,
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	SAFE_MIN_BOX_VALUE,
	TransactionBuilder,
	type Box
} from '@fleet-sdk/core';
import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	DEPOSIT_ADDRESS,
	SHADOWPOOL_ADDRESS
} from '$lib/constants/addresses';
import { TOKEN } from '$lib/constants/tokens';
import { deposit, depositNoTokens } from '$lib/wallet/deposit';
import { utxos } from '$lib/data/utxos';
import {
	arrayToProposition,
	getProver,
	signTx,
	signTxInput,
	signTxMulti,
	type JSONTransactionHintsBag
} from '$lib/wallet/multisig-server';
import { boxesAtAddress } from '$lib/utils/test-helper';
import { ALICE_MNEMONIC, BOB_MNEMONIC, SHADOW_MNEMONIC } from '$lib/constants/mnemonics';
import { createSellOrderTxR9, executeSell } from '$lib/wallet/sell';
import { compileContract } from '$lib/compiler/compile';
import {
	BlockHeader,
	BlockHeaders,
	ErgoBoxes,
	ErgoStateContext,
	extract_hints,
	Input,
	Parameters,
	PreHeader,
	ReducedTransaction,
	Transaction,
	TransactionHintsBag,
	UnsignedTransaction,
	validate_tx,
	verify_tx_input_proof
} from 'ergo-lib-wasm-nodejs';
import type { EIP12UnsignedTransaction, SignedTransaction } from '@fleet-sdk/common';

const CONTRACT_FOR_TEST = `{	
	def getSellerPk(box: Box)              = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
	def getPoolPk(box: Box)                = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
	def unlockHeight(box: Box)             = box.R5[Int].get
	def getTokenId(box: Box)               = box.R6[Coll[Byte]].getOrElse(Coll[Byte]()) 
	def getSellRate(box: Box)              = box.R7[Long].get
	def getSellerMultisigAddress(box: Box) = box.R8[Coll[Byte]].get
	def getDenom(box: Box)                 = box.R9[Long].get //add getDenom


 	def tokenId(box: Box) = box.tokens(0)._1
	def tokenAmount(box: Box) = box.tokens(0)._2
  
	def isSameContract(box: Box) = 
		box.propositionBytes == SELF.propositionBytes
  
	def isSameToken(box: Box)    = 
	  	getTokenId(SELF) == getTokenId(box) && 	// R6 
	  	box.tokens.size > 0 &&				
		getTokenId(SELF) == tokenId(box) 		// first token 

  	def isGreaterZeroRate(box:Box) =
    	getSellRate(box) > 0
  
	def isSameSeller(box: Box)   = 
    	getSellerPk(SELF) == getSellerPk(box) &&
    	getPoolPk(SELF) == getPoolPk(box)

  	def isSameUnlockHeight(box: Box)  = 
    	unlockHeight(SELF) == unlockHeight(box)

  	def isSameMultisig(box: Box)    =
    	getSellerMultisigAddress(SELF) == getSellerMultisigAddress(box)

	def isLegitInputBox(b: Box) = {
	    isSameContract(b) && 
    	isSameToken(b) && 
    	isSameMultisig(b) && 
    	isSameSeller(b) && 
    	isGreaterZeroRate(b) &&
		isSameUnlockHeight(b)
	} 

	def isPaymentBox(box:Box) = {
		isSameSeller(box) &&
    	isSameUnlockHeight(box) &&
		getTokenId(SELF) == getTokenId(box) &&
		getSellerMultisigAddress(SELF) == box.propositionBytes
	}
  
	def sumTokensIn(boxes: Coll[Box]): Long = boxes
		.filter(isLegitInputBox) 
		.fold(0L, {(a:Long, b: Box) => a + b.tokens(0)._2})

	def sumTokensValueIn(boxes: Coll[Box]): Long = boxes
	.filter(isLegitInputBox) 
	.fold(0L, {(a:Long, b: Box) => a + getSellRate(b)*b.tokens(0)._2/getDenom(b)})
  
	val tokensValueIn: Long = sumTokensValueIn(INPUTS)


	//------------------ MAX SELL BLOCK ------------------
	val maxDenom: Long = INPUTS
		.filter(isLegitInputBox)
		.fold(0L, {(r:Long, box:Box) => {
		if(r > getDenom(box)) r else getDenom(box)
	}}) //LegitInput - LegitInputBox

    def getRateInMaxDenom(box:Box) = getSellRate(box)*maxDenom/getDenom(box) 

	val maxSellRate = INPUTS
    	.filter(isLegitInputBox)
    	.fold(0L, {(r:Long, box:Box) => {
		    if(r > getRateInMaxDenom(box)) r else getRateInMaxDenom(box)
		}})
	
	def hasMaxSellRate(box: Box) =
    getSellRate(box)*maxDenom==getDenom(box)*maxSellRate 

	def sumTokensInAtMaxRate(boxes: Coll[Box]): Long = boxes
		.filter(isLegitInputBox)
		.filter(hasMaxSellRate)
		.fold(0L, {(a:Long, b: Box) => a + tokenAmount(b)})
  

	def isMaxRateChangeBox(box: Box) = {
		isSameSeller(box) &&
		isSameUnlockHeight(box) &&
		isSameToken(box) &&
		hasMaxSellRate (box) &&  
		isSameMultisig(box) &&
		isSameContract(box)
	}
	//------------------ MAX SELL BLOCK ------------------

  
	def tokensRemaining(boxes: Coll[Box]): Long = boxes
		.filter(isMaxRateChangeBox)
		.fold(0L, {(a:Long, b: Box) => a + tokenAmount(b)}) 
	
	def valueRemaining(boxes: Coll[Box]): Long = boxes
		.filter(isMaxRateChangeBox)
		.fold(0L, {(a:Long, b: Box) => a + getSellRate(b)*tokenAmount(b)/getDenom(b)}) //TODO: CHECK 1.6 / 0.6 / 0.1 ...
	
	val tokensBack: Long = tokensRemaining(OUTPUTS)		
	val tokensValueOut: Long = valueRemaining(OUTPUTS)
	val soldValue: Long = tokensValueIn - tokensValueOut 

	val nanoErgsPaid: Long = OUTPUTS
		.filter(isPaymentBox)
		.fold(0L, {(a:Long, b: Box) => a + b.value})
  
	val tokensInputAtMaxRate = sumTokensInAtMaxRate(INPUTS) 
	val sellOrderChangeBoxIsFine = tokensInputAtMaxRate > tokensBack	
	val sellerPaid: Boolen = soldValue <= nanoErgsPaid  

	val orderFilled = sellerPaid && sellOrderChangeBoxIsFine  			

	if(HEIGHT > unlockHeight(SELF)){
		getSellerPk(SELF)
	}else{
		getSellerPk(SELF) && getPoolPk(SELF) || sigmaProp(orderFilled) && getPoolPk(SELF)
	}
}`;

const CONTRACT_FOR_TEST_OLD = `{	
	def getSellerPk(box: Box)              = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
	def getPoolPk(box: Box)                = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
	def unlockHeight(box: Box)             = box.R5[Int].get
	def getTokenId(box: Box)               = box.R6[Coll[Byte]].getOrElse(Coll[Byte]()) 
	def getSellRate(box: Box)              = box.R7[Long].get
	def getSellerMultisigAddress(box: Box) = box.R8[Coll[Byte]].get

 	def tokenId(box: Box) = box.tokens(0)._1
	def tokenAmount(box: Box) = box.tokens(0)._2
  
	def isSameContract(box: Box) = 
		box.propositionBytes == SELF.propositionBytes
  
	def isSameToken(box: Box)    = 
	  	getTokenId(SELF) == getTokenId(box) &&
	  	box.tokens.size > 0 &&
		getTokenId(SELF) == tokenId(box)

  	def isGreaterZeroRate(box:Box) =
    	getSellRate(box) > 0
  
	def isSameSeller(box: Box)   = 
    	getSellerPk(SELF) == getSellerPk(box) &&
    	getPoolPk(SELF) == getPoolPk(box)

  	def isSameUnlockHeight(box: Box)  = 
    	unlockHeight(SELF) == unlockHeight(box)

  	def isSameMultisig(box: Box)    =
    	getSellerMultisigAddress(SELF) == getSellerMultisigAddress(box)

	def isLegitInputBox(b: Box) = {
	    isSameContract(b) && 
    	isSameToken(b) && 
    	isSameMultisig(b) && 
    	isSameSeller(b) && 
    	isGreaterZeroRate(b)
	}
  
	def isPaymentBox(box:Box) = {
		isSameSeller(box) &&
    	isSameUnlockHeight(box) &&
		getTokenId(SELF) == getTokenId(box) &&
		getSellerMultisigAddress(SELF) == box.propositionBytes
	}
  
	def sumTokensIn(boxes: Coll[Box]): Long = boxes
		.filter(isLegitInputBox) 
		.fold(0L, {(a:Long, b: Box) => a + b.tokens(0)._2})
  
	val tokensIn: Long = sumTokensIn(INPUTS)
  
	val avgRateInputs: Long = INPUTS
    	.filter(isLegitInputBox)
    	.fold(0L, {(a:Long, b: Box) => {
    	  a + getSellRate(b)*tokenAmount(b)
    	}}) / tokensIn 
	
	val maxSellRate = INPUTS
    	.filter(isLegitInputBox)
    	.fold(0L, {(r:Long, box:Box) => {
		    if(r > getSellRate(box)) r else getSellRate(box)
		}})
  
	def sumTokensInAtMaxRate(boxes: Coll[Box]): Long = boxes
		.filter(isLegitInputBox)
		.filter({(b: Box)=> getSellRate(b) == maxSellRate})
		.fold(0L, {(a:Long, b: Box) => a + tokenAmount(b)})
  
	def isMaxRateChangeBox(box: Box) = {
		isSameSeller(box) &&
		isSameUnlockHeight(box) &&
		isSameToken(box) &&
		maxSellRate == getSellRate(box) &&
		isSameMultisig(box) &&
		isSameContract(box)
	}
  
	def tokensRemaining(boxes: Coll[Box]): Long = boxes
		.filter(isMaxRateChangeBox)
		.fold(0L, {(a:Long, b: Box) => a + tokenAmount(b)}) 
	
	val tokensBack: Long = tokensRemaining(OUTPUTS)
	val tokensSold: Long = tokensIn - tokensBack
  
	val nanoErgsPaid: Long = OUTPUTS
		.filter(isPaymentBox)
		.fold(0L, {(a:Long, b: Box) => a + b.value})
  
  	val valueOfSoldTokens: Long  = tokensIn * avgRateInputs - tokensBack * maxSellRate
  	val amountOfSoldTokens: Long = tokensIn - tokensBack
	val avgTokenPrice: Long =  valueOfSoldTokens / amountOfSoldTokens

	val tokensInputAtMaxRate = sumTokensInAtMaxRate(INPUTS) 
	val sellOrderChangeBoxIsFine = tokensInputAtMaxRate > tokensBack 
	val sellerPaid: Boolen = tokensSold * avgTokenPrice <= nanoErgsPaid
  
	val orderFilled = sellerPaid && sellOrderChangeBoxIsFine
  
	if(HEIGHT > unlockHeight(SELF)){
		getSellerPk(SELF)
	}else{
		getSellerPk(SELF) && getPoolPk(SELF) || sigmaProp(orderFilled) && getPoolPk(SELF)
	}
}`;

const CONTRACT_OLD = compileContract(CONTRACT_FOR_TEST_OLD);
const CONTRACT_WITH_R9 = compileContract(CONTRACT_FOR_TEST);

let height = 1_209_955;
let unlockHeight = 1300000;

describe('limit sell order - OLD', () => {
	let sellOrderBoxes: Box[];
	let depositsAlice: Box[];

	//To check basic contract
	const tokenForSale = {
		tokenId: TOKEN.rsBTC.tokenId,
		price: '2',
		amount: 1_000_000n
	};

	//To check R9 contract
	const tokenForSale0 = {
		tokenId: TOKEN.rsBTC.tokenId,
		price: '0.02',
		amount: 100_000_000n
	};

	//Need checks that what u pay is more than Min Safe Box
	const minimalErgo = SAFE_MIN_BOX_VALUE; //1_000_000n
	const ergoFee = RECOMMENDED_MIN_FEE_VALUE; //1_100_000n

	let paymentInErgo = 20_000_000n; //2_000_000 fair price

	beforeAll(async () => {
		//DEPOSIT
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

		let depositTxAlice = depositNoTokens(
			height,
			[utxos[ALICE_ADDRESS][0]],
			ALICE_ADDRESS,
			ALICE_ADDRESS,
			unlockHeight,
			2n * paymentInErgo
		);
		let signedDepositTxAlice = await signTx(depositTxAlice, ALICE_MNEMONIC);
		depositsAlice = boxesAtAddress(signedDepositTxAlice, DEPOSIT_ADDRESS);
		expect(depositsAlice.length).toBe(1);

		const sellUTx = createSellOrderTxR9(
			BOB_ADDRESS,
			depositsBob,
			tokenForSale,
			tokenForSale.price,
			height,
			CONTRACT_OLD
		);

		const bobSwapTx = await signTxMulti(sellUTx, BOB_MNEMONIC, BOB_ADDRESS);
		sellOrderBoxes = boxesAtAddress(bobSwapTx, CONTRACT_OLD); //NEW SELL CONTRACT
	});

	it('sell box defined', async () => {
		expect(sellOrderBoxes, 'sell order boxes').toBeDefined();
		expect(sellOrderBoxes.length, 'sell order boxes length').toBe(1);
	});

	it('execture sell contract', async () => {
		const executeSellOrderTx = executeSell(
			height,
			sellOrderBoxes,
			depositsAlice,
			tokenForSale,
			paymentInErgo
		);
		expect(executeSellOrderTx.inputs.length).toBe(2);

		//console.log(executeSellOrderTx);
		//Basic sign
		const sInput0 = await signTxInput(
			SHADOW_MNEMONIC,
			JSON.parse(JSON.stringify(executeSellOrderTx)),
			0
		);
		expect(sInput0, 'shadow can sign index:0').toBeDefined();
	});
});

describe('limit sell order - NEW', () => {
	let sellOrderBoxes: Box[];
	let depositsAlice: Box[];

	//To check basic contract
	const tokenForSale0 = {
		tokenId: TOKEN.rsBTC.tokenId,
		price: '2',
		amount: 1_000_000n
	};

	//To check R9 contract
	const tokenForSale = {
		tokenId: TOKEN.rsBTC.tokenId,
		price: '0.02',
		amount: 100_000_000n
	};

	//Need checks that what u pay is more than Min Safe Box
	const minimalErgo = SAFE_MIN_BOX_VALUE; //1_000_000n
	const ergoFee = RECOMMENDED_MIN_FEE_VALUE; //1_100_000n

	let paymentInErgo = 20_000_000n; //2_000_000 fair price

	beforeAll(async () => {
		//DEPOSIT
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

		let depositTxAlice = depositNoTokens(
			height,
			[utxos[ALICE_ADDRESS][0]],
			ALICE_ADDRESS,
			ALICE_ADDRESS,
			unlockHeight,
			2n * paymentInErgo
		);
		let signedDepositTxAlice = await signTx(depositTxAlice, ALICE_MNEMONIC);

		depositsAlice = boxesAtAddress(signedDepositTxAlice, DEPOSIT_ADDRESS);
		expect(depositsAlice.length).toBe(1);

		const sellUTx = createSellOrderTxR9(
			BOB_ADDRESS,
			depositsBob,
			tokenForSale,
			tokenForSale.price,
			height,
			CONTRACT_WITH_R9
		);

		const bobSwapTx = await signTxMulti(sellUTx, BOB_MNEMONIC, BOB_ADDRESS);
		sellOrderBoxes = boxesAtAddress(bobSwapTx, CONTRACT_WITH_R9); //NEW SELL CONTRACT
	}); //

	it('sell box defined', async () => {
		expect(sellOrderBoxes, 'sell order boxes').toBeDefined();
		expect(sellOrderBoxes.length, 'sell order boxes length').toBe(1);
	});

	it('execture sell contract', async () => {
		const executeSellOrderUTx = executeSell(
			height,
			sellOrderBoxes,
			depositsAlice,
			tokenForSale,
			paymentInErgo
		);
		expect(executeSellOrderUTx.inputs.length).toBe(2);

		//------------------------------ INPUT 0 (SELL SHADOW) ------------------------------
		const signedInput0 = await signTxInput(
			SHADOW_MNEMONIC,
			JSON.parse(JSON.stringify(executeSellOrderUTx)),
			0
		);
		expect(signedInput0, 'shadow can sign index:0').toBeDefined();

		const unsigned_tx = UnsignedTransaction.from_json(JSON.stringify(executeSellOrderUTx));
		const tx = Transaction.from_unsigned_tx(unsigned_tx, [
			getProof(signedInput0),
			getProof(signedInput0)
		]);
		const inputBoxes = ErgoBoxes.from_boxes_json(executeSellOrderUTx.inputs);
		const dataBoxes = ErgoBoxes.empty();

		let verified0 = verify_tx_input_proof(0, fakeContext(), tx, inputBoxes, dataBoxes);
		expect(verified0, 'index 0 proof').toBe(true);

		//------------------------------ INPUT 1 (DEPOSIT MULTISIG) ------------------------------
		const { privateCommitsPool, publicCommitsPool } =
			await signTxMultiStep1(executeSellOrderUTx);
		expect(publicCommitsPool).toBeDefined();

		const sInput1: Input = await signInputMultiStep2(
			executeSellOrderUTx,
			ALICE_MNEMONIC,
			ALICE_ADDRESS,
			publicCommitsPool,
			1
		);

		const unsigned_tx2 = UnsignedTransaction.from_json(JSON.stringify(executeSellOrderUTx));
		const tx2 = Transaction.from_unsigned_tx(unsigned_tx2, [
			getProof(sInput1),
			getProof(sInput1)
		]);
		const hUser = ErgoAddress.fromBase58(ALICE_ADDRESS).ergoTree.slice(6);

		let extractedHints = extract_hints(
			tx2,
			fakeContext(),
			ErgoBoxes.from_boxes_json(executeSellOrderUTx.inputs),
			ErgoBoxes.empty(),
			arrayToProposition([hUser]),
			arrayToProposition([])
		).to_json();

		const signedInput1 = await signInputMultiStep3(
			executeSellOrderUTx,
			privateCommitsPool,
			extractedHints,
			1
		);

		const unsigned_tx3 = UnsignedTransaction.from_json(JSON.stringify(executeSellOrderUTx));
		const tx3 = Transaction.from_unsigned_tx(unsigned_tx3, [
			getProof(signedInput0),
			getProof(signedInput1)
		]);

		//------------------------------ VERIFY INPUTS + TX ------------------------------
		verified0 = verify_tx_input_proof(0, fakeContext(), tx3, inputBoxes, dataBoxes);
		expect(verified0, 'index 0 proof').toBe(true);

		let verified1 = verify_tx_input_proof(1, fakeContext(), tx3, inputBoxes, dataBoxes);
		expect(verified1, 'index 0 proof').toBe(true);

		const signedWithId = tx3.to_js_eip12();
		signedWithId.id = tx3.id().to_str();

		expect(
			() => validateTx(signedWithId, executeSellOrderUTx),
			'withdraw tx validation'
		).not.toThrowError();
	});
});

//FUNCTIONS

export function getProof(input: Input): Uint8Array {
	return input.spending_proof().proof();
}

export const headers = [
	`{
        "extensionId" : "1d6a13a3ad0723eeb2c1de056d17be6ea1908393c5768e46cc83898e5cd025dd",
        "difficulty" : "1814331624783872",
        "votes" : "000000",
        "timestamp" : 1709121479915,
        "size" : 220,
        "stateRoot" : "4eb3abbd5e0b5cbf6dce3d3eca4a90b4c9dc62c26046257547b3baedf842425a19",
        "height" : 1209955,
        "nBits" : 117862944,
        "version" : 3,
        "id" : "378dba6a164fc2410cfc0c81ce345865a58cf3b7a4b11c30b93fc3ac2fcd77e5",
        "adProofsRoot" : "98763f39f0e9e688a5405d610b71803d0232cdf6351b9254423ec75bae4260d7",
        "transactionsRoot" : "905a4454ec3316dd930e5fc23d65184cfa7aac0ab5a8de1eee52b711977aaf53",
        "extensionHash" : "d0e5ab822165d32806d1e73650daaaa4308ff0ada90b2cc2c4889091bf4a3b0c",
        "powSolutions" : {
          "pk" : "0274e729bb6615cbda94d9d176a2f1525068f12b330e38bbbf387232797dfd891f",
          "w" : "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
          "n" : "69cee2c16146605e",
          "d" : 0
        },
        "adProofsId" : "ee4884854325248b1c2c6a17fb3188bdefaa59eb166ee96e0e8586639414cea2",
        "transactionsId" : "f1c11b39c4aff5f3870be6ecea1e976775d2af16548c42b0795735e3d114c44b",
        "parentId" : "7b282808fc13bf596de3192b2bf399b3de3fccc95a31199774413f62d05e010b"
      }`,
	`{
        "extensionId" : "22ff689392bac51a0f67e54d8b1affe6141d1d64076a6a1e532807e9def6a59e",
        "difficulty" : "1814331624783872",
        "votes" : "000000",
        "timestamp" : 1709121496177,
        "size" : 220,
        "stateRoot" : "3da4ca9fefbd750616c88e1daffb1d9182485c6fa689035b654f6066f98e367219",
        "height" : 1209956,
        "nBits" : 117862944,
        "version" : 3,
        "id" : "903c0fd3c16f78326ba94dc0941901dedd7adb2a53db4477251b0d2a42e1694c",
        "adProofsRoot" : "0bb908cef4690ae344eb2e7e4bd6b7b982ddc67387ff1f4cdf995df5b77a9fda",
        "transactionsRoot" : "4c4ee981c7cc8f2a432f9fe570c4b205f50371b9d0834a862436100c61d66670",
        "extensionHash" : "d0e5ab822165d32806d1e73650daaaa4308ff0ada90b2cc2c4889091bf4a3b0c",
        "powSolutions" : {
          "pk" : "0354045cf65562b8ca10c2352626c411edcf4a728146f0d6bd35dde9273e7abae1",
          "w" : "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
          "n" : "7c05c7830878692b",
          "d" : 0
        },
        "adProofsId" : "deae549ac40539368d86125ebc5ea7c025a97d9cb9a023299e62fc08bafe55e1",
        "transactionsId" : "357d0ec3d5c41d83783a5365d122b57cdcc7b44afd2b8d835d0872d3d89fdf6c",
        "parentId" : "378dba6a164fc2410cfc0c81ce345865a58cf3b7a4b11c30b93fc3ac2fcd77e5"
      }`,
	`{
        "extensionId" : "e5537ad2aabf7f2d879508096fa8ee675f1d3ed8f24ff5b6ca1b49c849dcccdc",
        "difficulty" : "1814331624783872",
        "votes" : "000000",
        "timestamp" : 1709121610322,
        "size" : 220,
        "stateRoot" : "11adce1c02e321de709d8b9989c98c35a1bb5c123ab6896d468a63b2316b6cbb19",
        "height" : 1209957,
        "nBits" : 117862944,
        "version" : 3,
        "id" : "c851ee374e924999c681f3b1097c966f69f869c2870c8d3ecdaa985b845e5f06",
        "adProofsRoot" : "036d19c08b067139a24b15a807afa3ce22d86bd1046bc0407375b63d7509d8d2",
        "transactionsRoot" : "d7f228b846ab294f344161e75dec20f4f53fa5aebb869cafaa5cb1a60d395892",
        "extensionHash" : "d0e5ab822165d32806d1e73650daaaa4308ff0ada90b2cc2c4889091bf4a3b0c",
        "powSolutions" : {
          "pk" : "03677d088e4958aedcd5cd65845540e91272eba99e4d98e382f5ae2351e0dfbefd",
          "w" : "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
          "n" : "0e6f428011ebf3b2",
          "d" : 0
        },
        "adProofsId" : "3a8592e6fd40932c5de1d845b413726a4e34b76be90e6ca0893c207e06ea5506",
        "transactionsId" : "c9233d46390ffce777862578a1a8729a1a0e49ad94f68ff5bf174a4443161b59",
        "parentId" : "903c0fd3c16f78326ba94dc0941901dedd7adb2a53db4477251b0d2a42e1694c"
      }`,
	`{
        "extensionId" : "6e83dea79fc2d13f98373d3df27db1bd6568f05a0fc4912eeb0ebfe9b4425660",
        "difficulty" : "1814331624783872",
        "votes" : "000000",
        "timestamp" : 1709121633189,
        "size" : 220,
        "stateRoot" : "a733ea3071cf348b1cc9db7d8926eb225c7b52611aa91001b010600a49a8febd19",
        "height" : 1209958,
        "nBits" : 117862944,
        "version" : 3,
        "id" : "6dc0f04ea3f0ac40126ff9672bf9e56ccf6eaa13c30c73193ac7f14be0ae5e37",
        "adProofsRoot" : "31faf32691e5aac26c59a89c0d4ffee92c92e408d8366b0d866226cc75b667c4",
        "transactionsRoot" : "09f68375649b95613b7f20dbb0f1249328bc220e2a512679106edb10784e4e58",
        "extensionHash" : "d0e5ab822165d32806d1e73650daaaa4308ff0ada90b2cc2c4889091bf4a3b0c",
        "powSolutions" : {
          "pk" : "0274e729bb6615cbda94d9d176a2f1525068f12b330e38bbbf387232797dfd891f",
          "w" : "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
          "n" : "2ac1b07c32577f49",
          "d" : 0
        },
        "adProofsId" : "9cc89f5108ca0925890feb1a59a83384e5fa8b82e83f9129cc35402711813c48",
        "transactionsId" : "35ecf7d06381acbbe74df7d7b967777c8b54955ae7d72a52448ae47d3a944b11",
        "parentId" : "c851ee374e924999c681f3b1097c966f69f869c2870c8d3ecdaa985b845e5f06"
      }`,
	`{
        "extensionId" : "a7925aba13f020a4c7f99716f755ed992256d5ffe51796bd1cad8bdd82be8fcc",
        "difficulty" : "1814331624783872",
        "votes" : "000000",
        "timestamp" : 1709121682807,
        "size" : 220,
        "stateRoot" : "b2e6c9e58de9a38bf93d2f0d82c7a075766d4fa0ada36b9232992289cd30919b19",
        "height" : 1209959,
        "nBits" : 117862944,
        "version" : 3,
        "id" : "f1384657f47f71df003a9b61b790dd61e50c14739bc8a4136df3f1613716ef2b",
        "adProofsRoot" : "9fa2752b462229033fa375164b4e2c25d975566cd1d3d04c31a81242b3ce5174",
        "transactionsRoot" : "90da7a11cbc60a527a58306cd9680e0f5ad6d8659f04b9e094a61126069f86ad",
        "extensionHash" : "d0e5ab822165d32806d1e73650daaaa4308ff0ada90b2cc2c4889091bf4a3b0c",
        "powSolutions" : {
          "pk" : "039805829f5ea548f1bbe194ca609f44f47d52c0c0fa4a5f4b41c77d2c0debfa1e",
          "w" : "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
          "n" : "0bbf00019ecaa4c0",
          "d" : 0
        },
        "adProofsId" : "f8e6fd6fbfb25a33904c80af01ea2e5abe7bcf8b7b258dd5244fb7e0df031696",
        "transactionsId" : "bd3168acace3654ef3915c4f0583f2a8ea6f04b1d4102292226eb9dd69354cc8",
        "parentId" : "6dc0f04ea3f0ac40126ff9672bf9e56ccf6eaa13c30c73193ac7f14be0ae5e37"
      }`,
	`{
        "extensionId" : "9865d1b362e65581f96223a210aa1ae2480763650248ce7eb3375fd3fa9aba7f",
        "difficulty" : "1814331624783872",
        "votes" : "000000",
        "timestamp" : 1709121716422,
        "size" : 220,
        "stateRoot" : "a7361de391e9485d873b68a73ac7d4980d244bb809e7a3b6ca847d6927ca0add19",
        "height" : 1209960,
        "nBits" : 117862944,
        "version" : 3,
        "id" : "932a58dfd28b6fdf741943b0ddc9f7e1c461ec90b8ca90b7d2e1a5f5ec754d31",
        "adProofsRoot" : "62baaee4c145e615fa5c91f238703bfbf71e34682a9975d446579d2cd3344e1b",
        "transactionsRoot" : "957f38a9d2e091eaa55764712500c9f8c5839eac78cc67d0f3e2b18dbb7828b7",
        "extensionHash" : "d0e5ab822165d32806d1e73650daaaa4308ff0ada90b2cc2c4889091bf4a3b0c",
        "powSolutions" : {
          "pk" : "033602a81fce83c18c4c591f4aea8f2732f479d6b08a21ec57c0de683e8e3815ad",
          "w" : "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
          "n" : "dfd41800e2e0ca5d",
          "d" : 0
        },
        "adProofsId" : "e70a9a8014589a2e4365f7ca5980768b3f478c5fa54b88a0167584eedc90787f",
        "transactionsId" : "82a6c3846ab99c54d982048f557b0694f4a0893819b74411d94114f6655de845",
        "parentId" : "f1384657f47f71df003a9b61b790dd61e50c14739bc8a4136df3f1613716ef2b"
      }`,
	`{
        "extensionId" : "3e405a2b3b63acb13e7692bec16bb51e88f0d8c1efc768e9f11dcf5af6df96dd",
        "difficulty" : "1814331624783872",
        "votes" : "000000",
        "timestamp" : 1709121979894,
        "size" : 220,
        "stateRoot" : "c8bac8d85be93e36f1d894c9ab2772a0a3f09b5dbca525a1cfefea0f6176839e19",
        "height" : 1209961,
        "nBits" : 117862944,
        "version" : 3,
        "id" : "53d9950a70b8c8bc5411c560526b500e0105b0c0929fc3f15fc4ecd59d962c66",
        "adProofsRoot" : "b3a8758a67fd65e6ffca7c603f06cce8d58929d3c35e2728e758444133565b1a",
        "transactionsRoot" : "5e8f9f741818fcf526555ebc22df4a367d5affc639623074a0340b7388e47c45",
        "extensionHash" : "d0e5ab822165d32806d1e73650daaaa4308ff0ada90b2cc2c4889091bf4a3b0c",
        "powSolutions" : {
          "pk" : "03677d088e4958aedcd5cd65845540e91272eba99e4d98e382f5ae2351e0dfbefd",
          "w" : "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
          "n" : "0fb96e00898ced74",
          "d" : 0
        },
        "adProofsId" : "6386c53c1364d08510836cfdbf6dc68bc69498dc0943faf26df8f173cae878cf",
        "transactionsId" : "51afabff78d7d46c461819828e2a99bfc9033f4e119e8ddddf95e60c535b0af0",
        "parentId" : "932a58dfd28b6fdf741943b0ddc9f7e1c461ec90b8ca90b7d2e1a5f5ec754d31"
      }`,
	`{
        "extensionId" : "fe309b8a2ad43f93ee3b69bb726bf90af0f3927e6182ff21b5e59c6fe2e96161",
        "difficulty" : "1814331624783872",
        "votes" : "000000",
        "timestamp" : 1709122155314,
        "size" : 220,
        "stateRoot" : "4fa5ba307df92d9aec8d6a77ee339553a8d9b2d19486479e0fdda26ad88f25e619",
        "height" : 1209962,
        "nBits" : 117862944,
        "version" : 3,
        "id" : "1fbc3eb714852862463fff30969f06367004394f1ea0a20165a6a3e72fd27eb1",
        "adProofsRoot" : "f70c55acecf65e9fb15aec994b7f1a336daab9f8da309220babb64b41551768a",
        "transactionsRoot" : "d93b0ec4f4fe7d4a3979cf004c68693734551c3affefbade9e517cd34f5a2639",
        "extensionHash" : "d0e5ab822165d32806d1e73650daaaa4308ff0ada90b2cc2c4889091bf4a3b0c",
        "powSolutions" : {
          "pk" : "0274e729bb6615cbda94d9d176a2f1525068f12b330e38bbbf387232797dfd891f",
          "w" : "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
          "n" : "4c9baf8d3ce7d0da",
          "d" : 0
        },
        "adProofsId" : "22817c19d786d427ea4352430c5a28cc7dfa1a134a7df85f6d8e4004f662736c",
        "transactionsId" : "57c19f6b38aae5b198fdb5098aa64a296c6419e7ba9e5e751c09a9f44e7b00be",
        "parentId" : "53d9950a70b8c8bc5411c560526b500e0105b0c0929fc3f15fc4ecd59d962c66"
      }`,
	`{
        "extensionId" : "83e464e5575a7c1fb90b98be7353e3ca6ca90555330422563e5480d6deac92cc",
        "difficulty" : "1814331624783872",
        "votes" : "000000",
        "timestamp" : 1709122197149,
        "size" : 220,
        "stateRoot" : "92c2a06b61454b6800c91da9acc33151fe98815e66d713fe127351fc31547ff719",
        "height" : 1209963,
        "nBits" : 117862944,
        "version" : 3,
        "id" : "4fcf937adf9b18420fd32fa09947d913dcd021b9a0f9adb93b2e149afe60bbc3",
        "adProofsRoot" : "e5886673ff6e7bc2c8b1e307881fe880062c708f8c8511823f4381d34436c147",
        "transactionsRoot" : "14bf4c8af7ded47abe602cd9342371e21b1feb2993b360c63f021a9d16ea5f56",
        "extensionHash" : "d249e227ff1da98399932b7f2bd9887e03b4acabb0a234517dedaa9faecd1d67",
        "powSolutions" : {
          "pk" : "03677d088e4958aedcd5cd65845540e91272eba99e4d98e382f5ae2351e0dfbefd",
          "w" : "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
          "n" : "98fa4f40851f46a2",
          "d" : 0
        },
        "adProofsId" : "d5923e9406c2546c96ef7ee9a3cd6d12836777a3c6ce02c4d5b89944d206a192",
        "transactionsId" : "fa5fb2401087bd1d23e5bd9346d15586bd50808d7c74e6ae9c0ba3ff2fae675a",
        "parentId" : "1fbc3eb714852862463fff30969f06367004394f1ea0a20165a6a3e72fd27eb1"
      }`,
	`{
        "extensionId" : "8e4496761ad525ef2b193e1e8a76f8edbb8497447314e608473564641321c65b",
        "difficulty" : "1814331624783872",
        "votes" : "000000",
        "timestamp" : 1709122453213,
        "size" : 220,
        "stateRoot" : "f4ff900c808d60466f8a629c5d83962a65e411a676a65f687bfcc80ac45f17d019",
        "height" : 1209964,
        "nBits" : 117862944,
        "version" : 3,
        "id" : "6bfec141fe216998d9c47437bf0fc94213aaad1c21dfd8d0030784504a7d6c9a",
        "adProofsRoot" : "c3afcc45a78ab503f1ecb34fa192e1391faaa91f7b119aa9e474b2c622679167",
        "transactionsRoot" : "e3ddd90c2ca848113f7745c4a7d2b7ed4a9a9a4a7e00fb8a8f7d172e368a4ba8",
        "extensionHash" : "d249e227ff1da98399932b7f2bd9887e03b4acabb0a234517dedaa9faecd1d67",
        "powSolutions" : {
          "pk" : "02eeec374f4e660e117fccbfec79e6fe5cdf44ac508fa228bfc654d2973f9bdc9a",
          "w" : "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
          "n" : "73e998d55c4fca12",
          "d" : 0
        },
        "adProofsId" : "8295f7fff6c29199a981598a3af3bee6682e361a68138000fc7bde9260a29167",
        "transactionsId" : "ce8afe8ae2dbfd81057dd7bba422a78e327152a5c74a930634b4d9b7725cc681",
        "parentId" : "4fcf937adf9b18420fd32fa09947d913dcd021b9a0f9adb93b2e149afe60bbc3"
      }`
];

export function fakeContext() {
	const blockHeaders = BlockHeaders.from_json(headers);
	const preHeader = PreHeader.from_block_header(BlockHeader.from_json(headers[0]));
	return new ErgoStateContext(preHeader, blockHeaders, Parameters.default_parameters());
}

export async function signTxMultiStep1(unsignedTx: EIP12UnsignedTransaction): Promise<any> {
	const proverBob = await getProver(SHADOW_MNEMONIC);
	let reducedTx = reducedFromUnsignedTx(unsignedTx);
	const privateCommitsPool = proverBob
		.generate_commitments_for_reduced_transaction(reducedTx)
		.to_json();

	let publicCommitsPool = _removeSecrets(privateCommitsPool, SHADOWPOOL_ADDRESS);

	return { privateCommitsPool, publicCommitsPool };
}

export async function signInputMultiStep2(
	unsignedTx: EIP12UnsignedTransaction,
	userMnemonic: string,
	userAddress: string,
	publicCommits: JSONTransactionHintsBag,
	index: number
): Promise<Input> {
	const publicBag = TransactionHintsBag.from_json(JSON.stringify(publicCommits));
	const proverAlice = await getProver(userMnemonic);
	const reducedTx = reducedFromUnsignedTx(unsignedTx);
	const initialCommitsAlice = proverAlice.generate_commitments_for_reduced_transaction(reducedTx);

	const combinedHints = TransactionHintsBag.empty();

	for (let i = 0; i < unsignedTx.inputs.length; i++) {
		combinedHints.add_hints_for_input(i, initialCommitsAlice.all_hints_for_input(i));
		combinedHints.add_hints_for_input(i, publicBag.all_hints_for_input(i));
	}

	const input = proverAlice.sign_tx_input_multi(
		index,
		fakeContext(),
		UnsignedTransaction.from_json(JSON.stringify(unsignedTx)),
		ErgoBoxes.from_boxes_json(unsignedTx.inputs),
		ErgoBoxes.empty(),
		combinedHints
	);
	return input;
}

export async function signInputMultiStep3(
	unsignedTx: EIP12UnsignedTransaction,
	privateCommitsPool: JSONTransactionHintsBag,
	hints: JSONTransactionHintsBag,
	index: number
) {
	const hintsForBobSign = privateCommitsPool;

	for (var row in hintsForBobSign.publicHints) {
		for (var i = 0; i < hints.publicHints[row].length; i++) {
			hintsForBobSign.publicHints[row].push(hints.publicHints[row][i]);
		}
		for (var i = 0; i < hints.secretHints[row].length; i++) {
			hintsForBobSign.secretHints[row].push(hints.secretHints[row][i]);
		}
	}
	const convertedHintsForBobSign = TransactionHintsBag.from_json(JSON.stringify(hintsForBobSign));

	const proverBob = await getProver(SHADOW_MNEMONIC);
	// let signedTx = proverBob.sign_reduced_transaction_multi(
	// 	reducedFromUnsignedTx(unsignedTx),
	// 	convertedHintsForBobSign
	// );
	const input = proverBob.sign_tx_input_multi(
		index,
		fakeContext(),
		UnsignedTransaction.from_json(JSON.stringify(unsignedTx)),
		ErgoBoxes.from_boxes_json(unsignedTx.inputs),
		ErgoBoxes.empty(),
		convertedHintsForBobSign
	);

	return input;
}

function _removeSecrets(privateCommitments: JSONTransactionHintsBag, address: string) {
	let copy = JSON.parse(JSON.stringify(privateCommitments));

	const hBob = ErgoAddress.fromBase58(address).ergoTree.slice(6);
	for (var row in copy.publicHints) {
		copy.publicHints[row] = copy.publicHints[row].filter(
			(item: { hint: string; pubkey: { h: string } }) =>
				!(item.hint == 'cmtWithSecret' && item.pubkey.h == hBob)
		);
	}

	return copy;
}

function reducedFromUnsignedTx(unsignedTx: EIP12UnsignedTransaction) {
	const inputBoxes = ErgoBoxes.from_boxes_json(unsignedTx.inputs);
	const wasmUnsignedTx = UnsignedTransaction.from_json(JSON.stringify(unsignedTx));
	let context = fakeContext();
	let reducedTx = ReducedTransaction.from_unsigned_tx(
		wasmUnsignedTx,
		inputBoxes,
		ErgoBoxes.empty(),
		context
	);
	return reducedTx;
}

export function validateTx(signedTx: SignedTransaction, unsignedTx: EIP12UnsignedTransaction) {
	let context = fakeContext();
	let tx = Transaction.from_json(JSON.stringify(signedTx));
	const inputBoxes = ErgoBoxes.from_boxes_json(unsignedTx.inputs);
	const dataBoxes = ErgoBoxes.empty();
	validate_tx(tx, context, inputBoxes, dataBoxes);
}
