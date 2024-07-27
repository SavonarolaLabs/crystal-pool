import { compile } from '@fleet-sdk/compiler';
import {
	SByte,
	SColl,
	SGroupElement,
	SInt,
	SLong,
	SSigmaProp,
	TransactionBuilder
} from '@fleet-sdk/core';
import { KeyedMockChainParty, MockChain } from '@fleet-sdk/mock-chain';
import { SPair } from '@fleet-sdk/serializer';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { comet, expectTokens, output, rsBTC, rsBtcId, SigUSD, SigUsdId } from './helper';

describe('Timed fund contract', () => {
	const ergoTree = compile(
		`{	
	def getSellerPk(box: Box)              	= box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
	def getPoolPk(box: Box)                	= box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
	def unlockHeight(box: Box)             	= box.R5[Int].getOrElse(0)
	def getSellingTokenId(box: Box)        	= box.R6[(Coll[Byte],Coll[Byte])].getOrElse((Coll[Byte](),Coll[Byte]()))._1
	def getBuyingTokenId(box: Box)         	= box.R6[(Coll[Byte],Coll[Byte])].getOrElse((Coll[Byte](),Coll[Byte]()))._2
	def getRate(box: Box)                   = box.R7[Coll[Long]].getOrElse(Coll[SigmaProp](0L,0L))(0)
	def getDenom(box: Box)                  = box.R7[Coll[Long]].getOrElse(Coll[SigmaProp](0L,0L))(1)
	def getSellerMultisigAddress(box: Box)  = box.R8[Coll[Byte]].getOrElse(Coll[Byte]())

	def tokenId(box: Box) = box.tokens(0)._1
	def tokenAmount(box: Box) = box.tokens(0)._2

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

    val maxDenom: Long = INPUTS
		.filter(isLegitInput)
		.fold(0L, {(r:Long, box:Box) => {
			if(r > getDenom(box)) r else getDenom(box)
		}}) 
  
    def getRateInMaxDenom(box:Box) = getRate(box)*maxDenom/getDenom(box) 

  	def sumTokenAmount(a:Long, b: Box) = a + tokenAmount(b)
  	def sumTokenAmountXRate(a:Long, b: Box) = a + tokenAmount(b) * getRateInMaxDenom(b)  

    val maxSellRate: Long = INPUTS
      .filter(isLegitInput)
      .fold(0L, {(r:Long, box:Box) => {
        if(r > getRateInMaxDenom(box)) r else getRateInMaxDenom(box)
      }})

    def hasMaxSellRate(box: Box) =
        getRate(box) * maxDenom == maxSellRate * getDenom(box) 

  	def isLegitSellOrderOutput(box: Box) =
	  	isLegitInput(box)&&
	  	hasMaxSellRate(box)

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

  	val tokensSold = sumSellTokensIn(INPUTS).toBigInt  - sumSellTokensOut(OUTPUTS).toBigInt  

  	val tokensPaid = sumBuyTokensPaid(OUTPUTS).toBigInt 

    	val inSellTokensXRate = INPUTS 
		.filter(isLegitInput) 
		.fold(0L, sumTokenAmountXRate)   

     	val outSellTokensXRate = OUTPUTS  
		.filter(isLegitSellOrderOutput)
		.fold(0L, sumTokenAmountXRate)  

    val sellTokensXRate = inSellTokensXRate.toBigInt - outSellTokensXRate.toBigInt  
    val expectedRate = sellTokensXRate.toBigInt  

    val isPaidAtFairRate = maxDenom.toBigInt*tokensPaid.toBigInt >= expectedRate.toBigInt  
 
    if(HEIGHT > unlockHeight(SELF)){
		getSellerPk(SELF)
	}else{
		getSellerPk(SELF) && getPoolPk(SELF) || sigmaProp(isPaidAtFairRate) && getPoolPk(SELF)
	}
}`
	);
	const mockChain = new MockChain({ height: 1_052_944 });
	const unlockHeight = mockChain.height + 500;
	const pool = mockChain.newParty('Pool');
	const maker = mockChain.newParty('Seller');
	const maker2 = mockChain.newParty('Seller2');
	const taker = mockChain.newParty('Bob');
	mockChain.parties;

	const swap = mockChain.addParty(ergoTree.toHex(), 'Token Swap Contract');

	const swapBtcUsdRegs = (pk: KeyedMockChainParty, rate: bigint = 1n, denom: bigint = 1n) => ({
		R4: SColl(SSigmaProp, [
			SGroupElement(pk.key.publicKey),
			SGroupElement(pool.key.publicKey)
		]).toHex(),
		R5: SInt(unlockHeight).toHex(),
		R6: SPair(SColl(SByte, rsBtcId), SColl(SByte, SigUsdId)).toHex(),
		R7: SColl(SLong, [rate, denom]).toHex(),
		R8: SColl(SByte, pk.ergoTree).toHex()
	});

	afterEach(() => {
		mockChain.reset();
	});

	describe('Swap before unlockHeight', () => {
		it("can't be canceled by maker", () => {
			swap.addBalance({ nanoergs: 1_000_000n, tokens: [rsBTC(100)] }, swapBtcUsdRegs(maker));

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === swap.ergoTree))
				.from([...swap.utxos])
				.to([output(maker, [rsBTC(100)], swapBtcUsdRegs(maker))])
				.build();

			expect(mockChain.execute(transaction, { signers: [maker], throw: false })).to.be.false;
		});

		it('can be canceled by maker+pool to any address', () => {
			swap.addBalance({ nanoergs: 1_000_000n, tokens: [rsBTC(100)] }, swapBtcUsdRegs(maker));

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === swap.ergoTree))
				.from([...swap.utxos])
				.to([output(maker2, [rsBTC(100)])])
				.build();

			expect(mockChain.execute(transaction, { signers: [maker, pool] })).to.be.true;
		});

		it('basic: 100 rsBTC -> 100 SigUSD', () => {
			swap.addBalance({ nanoergs: 1_000_000n, tokens: [rsBTC(100)] }, swapBtcUsdRegs(maker));
			taker.addBalance({ nanoergs: 10_000_000n, tokens: [SigUSD(200)] });

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === swap.ergoTree))
				.from([...swap.utxos, ...taker.utxos])
				.to([
					output(maker, [SigUSD(100)], swapBtcUsdRegs(maker)),
					output(taker, rsBTC(100))
				])
				.sendChangeTo(taker.address)
				.build();

			expect(mockChain.execute(transaction, { signers: [taker, pool] })).to.be.true;
			expectTokens(maker, [SigUSD(100)]);
			expectTokens(taker, [rsBTC(100), SigUSD(100)]);
		});

		it('underpayment fails', () => {
			swap.addBalance({ nanoergs: 1_000_000n, tokens: [rsBTC(100)] }, swapBtcUsdRegs(maker));
			taker.addBalance({ nanoergs: 10_000_000n, tokens: [SigUSD(200)] });

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === swap.ergoTree))
				.from([...swap.utxos, ...taker.utxos])
				.to([
					output(maker, [SigUSD(99)], swapBtcUsdRegs(maker)),
					output(taker, [SigUSD(1), rsBTC(100)])
				])
				.sendChangeTo(taker.address)
				.build();

			expect(mockChain.execute(transaction, { signers: [taker, pool], throw: false })).to.be
				.false;
		});

		it('fake token fails', () => {
			swap.addBalance({ nanoergs: 1_000_000n, tokens: [rsBTC(100)] }, swapBtcUsdRegs(maker));
			taker.addBalance({ nanoergs: 10_000_000n, tokens: [SigUSD(200), comet(100)] });

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === swap.ergoTree))
				.from([...swap.utxos, ...taker.utxos])
				.to([output(maker, [comet(100)], swapBtcUsdRegs(maker)), output(taker, rsBTC(100))])
				.sendChangeTo(taker.address)
				.build();

			expect(mockChain.execute(transaction, { signers: [taker, pool], throw: false })).to.be
				.false;
		});

		it('multi input: 100 rsBTC, 50 rsBTC -> 150 SigUSD', () => {
			swap.addBalance({ nanoergs: 1_000_000n, tokens: [rsBTC(100)] }, swapBtcUsdRegs(maker));
			swap.addBalance({ nanoergs: 1_000_000n, tokens: [rsBTC(50)] }, swapBtcUsdRegs(maker2));
			taker.addBalance({ nanoergs: 10_000_000n, tokens: [SigUSD(200)] });

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === swap.ergoTree))
				.from([...swap.utxos, ...taker.utxos])
				.to([
					output(maker, [SigUSD(100)], swapBtcUsdRegs(maker)),
					output(maker2, [SigUSD(50)], swapBtcUsdRegs(maker2)),
					output(taker, rsBTC(150))
				])
				.sendChangeTo(taker.address)
				.build();

			expect(mockChain.execute(transaction, { signers: [taker, pool] })).to.be.true;
			expectTokens(maker, [SigUSD(100)]);
			expectTokens(maker2, [SigUSD(50)]);
			expectTokens(taker, [rsBTC(150), SigUSD(50)]);
		});

		it('partial: 100/100rsBTC + 150/300 rsBTC for 50 + 150 SigUSD', () => {
			expectTokens(swap, []);
			swap.addBalance({ nanoergs: 1n, tokens: [rsBTC(100)] }, swapBtcUsdRegs(maker, 1n, 2n));
			swap.addBalance({ nanoergs: 1n, tokens: [rsBTC(300)] }, swapBtcUsdRegs(maker2, 1n, 1n));
			taker.addBalance({ nanoergs: 10_000_000n, tokens: [SigUSD(200)] });
			expectTokens(maker, []);
			expectTokens(maker2, []);
			expectTokens(swap, [rsBTC(400)]);
			expectTokens(taker, [SigUSD(200)]);

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === swap.ergoTree))
				.from([...swap.utxos, ...taker.utxos])
				.to([
					output(maker, SigUSD(50), swapBtcUsdRegs(maker)),
					output(maker2, SigUSD(150), swapBtcUsdRegs(maker2)),
					output(swap, rsBTC(150), swapBtcUsdRegs(maker2)),
					output(taker, rsBTC(250))
				])
				.sendChangeTo(taker.address)
				.build();
			mockChain.newBlock();

			expect(mockChain.execute(transaction, { signers: [taker, pool] })).to.be.true;
			expectTokens(maker, [SigUSD(50)]);
			expectTokens(maker2, [SigUSD(150)]);
			expectTokens(swap, [rsBTC(150)]);
			expectTokens(taker, [rsBTC(250)]);
		});
	});

	describe('Swap after unlockHeight', () => {
		beforeEach(() => {
			mockChain.jumpTo(unlockHeight + 1);
			expect(mockChain.height).to.be.above(unlockHeight);
		});

		it('can be canceled by maker to any address', () => {
			swap.addBalance({ nanoergs: 1_000_000n, tokens: [rsBTC(100)] }, swapBtcUsdRegs(maker));

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === swap.ergoTree))
				.from([...swap.utxos])
				.to([output(maker2, [rsBTC(100)])])
				.build();

			expect(mockChain.execute(transaction, { signers: [maker] })).to.be.true;
			expectTokens(maker2, [rsBTC(100)]);
		});
	});

	describe('Random contract breaking attemps', () => {
		it('100000 rsBTC -> 2 SigUSD', () => {
			swap.addBalance(
				{ nanoergs: 1_000_000n, tokens: [rsBTC(100000)] },
				swapBtcUsdRegs(maker, 1n, 50000n)
			);
			taker.addBalance({ nanoergs: 10_000_000n, tokens: [SigUSD(200)] });

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === swap.ergoTree))
				.from([...swap.utxos, ...taker.utxos])
				.to([
					output(maker, [SigUSD(2)], swapBtcUsdRegs(maker)),
					output(taker, rsBTC(100000))
				])
				.sendChangeTo(taker.address)
				.build();

			expect(mockChain.execute(transaction, { signers: [taker, pool] })).to.be.true;
			expectTokens(maker, [SigUSD(2)]);
			expectTokens(taker, [rsBTC(100000), SigUSD(198)]);
		});

		it('1 rsBTC -> 1000 SigUSD', () => {
			swap.addBalance(
				{ nanoergs: 1_000_000n, tokens: [rsBTC(1)] },
				swapBtcUsdRegs(maker, 1000n)
			);
			taker.addBalance({ nanoergs: 10_000_000n, tokens: [SigUSD(1000)] });

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === swap.ergoTree))
				.from([...swap.utxos, ...taker.utxos])
				.to([output(maker, [SigUSD(1000)], swapBtcUsdRegs(maker)), output(taker, rsBTC(1))])
				.sendChangeTo(taker.address)
				.build();

			expect(mockChain.execute(transaction, { signers: [taker, pool] })).to.be.true;
			expectTokens(maker, [SigUSD(1000)]);
			expectTokens(taker, [rsBTC(1)]);
		});
	});
});
