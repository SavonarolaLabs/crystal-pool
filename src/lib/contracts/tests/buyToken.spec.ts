import { compile } from '@fleet-sdk/compiler';
import {
	SAFE_MIN_BOX_VALUE,
	SByte,
	SColl,
	SGroupElement,
	SInt,
	SLong,
	SSigmaProp,
	TransactionBuilder
} from '@fleet-sdk/core';
import { KeyedMockChainParty, MockChain } from '@fleet-sdk/mock-chain';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ergOutput, rsBTC, rsBtcId } from './helper';

describe('Timed fund contract', () => {
	const ergoTree = compile(`{
    def getBuyerPk(box: Box)               = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
    def getPoolPk(box: Box)                = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
    def unlockHeight(box: Box)             = box.R5[Int].getOrElse(0)
    def getTokenId(box: Box)               = box.R6[Coll[Byte]].getOrElse(Coll[Byte]()) 
	def getRate(box: Box)                  = box.R7[Coll[Long]].getOrElse(Coll[SigmaProp](0L,0L))(0)
	def getDenom(box: Box)                 = box.R7[Coll[Long]].getOrElse(Coll[SigmaProp](0L,0L))(1)
    def getBuyerMultisigAddress(box: Box)  = box.R8[Coll[Byte]].getOrElse(Coll[Byte]())

    def tokenAmount(box: Box) = {
        if(box.tokens.size > 0) 
        {
            box.tokens(0)._2
        } else{
         0L
        } 
    }
  
    def isSameContract(box: Box) = 
        box.propositionBytes == SELF.propositionBytes
  
    def isGreaterZeroRate(box:Box) =
        getRate(box) > 0 &&
        getDenom(box) > 0
  
    def isSameBuyer(box: Box)   = 
        getBuyerPk(SELF) == getBuyerPk(box) &&
        getPoolPk(SELF) == getPoolPk(box)

    def isSameUnlockHeight(box: Box)  = 
        unlockHeight(SELF) == unlockHeight(box)

    def isSameMultisig(box: Box)    =
        getBuyerMultisigAddress(SELF) == getBuyerMultisigAddress(box)

    def isLegitInput(b: Box) = {
        isSameContract(b) && 
        isSameMultisig(b) && 
        isSameBuyer(b) && 
        isSameUnlockHeight(b) &&
        getTokenId(SELF) == getTokenId(b) &&
        isGreaterZeroRate(b)
    }

    def isPaymentBox(box:Box) = {
      isSameBuyer(box) &&
      isSameUnlockHeight(box) &&
      getTokenId(SELF) == getTokenId(box) &&
      getBuyerMultisigAddress(SELF) == box.propositionBytes
    }

    val maxDenom: Long = INPUTS
        .filter(isLegitInput)
        .fold(0L, {(r:Long, box:Box) => {
            if(r > getDenom(box)) r else getDenom(box)
        }}) 
  
    def getRateInMaxDenom(box:Box) = getRate(box)*maxDenom/getDenom(box) 

    val filteredInputs = INPUTS.filter(isLegitInput)
    val minBuyRate: Long = filteredInputs
      .fold(getRateInMaxDenom(filteredInputs(0)), {(r:Long, box:Box) => {
        if(r < getRateInMaxDenom(box)) r else getRateInMaxDenom(box)
      }})

    def hasMinBuyRate(box: Box) =
        getRate(box) * maxDenom == getDenom(box) * minBuyRate

    def isChangeBox(box: Box) =
        isLegitInput(box) &&
        hasMinBuyRate(box)

    def sumTokenAmount(a:Long, b: Box) = a + tokenAmount(b)
    def sumErgXMinRate(a:Long, b: Box) = a + b.value * minBuyRate
    def sumErgXRate(a:Long, b: Box) = a + b.value * getRateInMaxDenom(b) 
  	def sumTokenAmountXRate(a:Long, b: Box) = a + tokenAmount(b) * getRateInMaxDenom(b) 

    val tokensPaid = OUTPUTS.filter(isPaymentBox).fold(0L, sumTokenAmount).toBigInt
    val expectedErgXRate = {
        val in = INPUTS.filter(isLegitInput).fold(0L, sumErgXRate)
        val out = OUTPUTS.filter(isChangeBox).fold(0L, sumErgXMinRate).toBigInt +
        OUTPUTS.filter(isPaymentBox).fold(0L, sumErgXMinRate).toBigInt
        in - out
    }

    val isPaidAtFairRate = tokensPaid * maxDenom >= expectedErgXRate
    //val isPaidAtFairRate = true

    if(HEIGHT > unlockHeight(SELF)){
        getBuyerPk(SELF)
    }else{
        getBuyerPk(SELF) && getPoolPk(SELF) || sigmaProp(isPaidAtFairRate) && getPoolPk(SELF)
    }
}`);
	const mockChain = new MockChain({ height: 1_052_944 });
	const unlockHeight = mockChain.height + 500;
	const pool = mockChain.newParty('Pool');
	const maker = mockChain.newParty('Seller');
	const maker2 = mockChain.newParty('Seller2');
	const taker = mockChain.newParty('Bob');
	mockChain.parties;

	const wtb = mockChain.addParty(ergoTree.toHex(), 'Token Buy Contract');

	const buyBtcUsdRegs = (pk: KeyedMockChainParty, rate: bigint = 1n, denom: bigint = 1n) => ({
		R4: SColl(SSigmaProp, [
			SGroupElement(pk.key.publicKey),
			SGroupElement(pool.key.publicKey)
		]).toHex(),
		R5: SInt(unlockHeight).toHex(),
		R6: SColl(SByte, rsBtcId).toHex(),
		R7: SColl(SLong, [rate, denom]).toHex(),
		R8: SColl(SByte, pk.ergoTree).toHex()
	});

	afterEach(() => {
		mockChain.reset();
	});

	describe('Buy before unlockHeight', () => {
		beforeEach(() => {
			taker.addBalance({ nanoergs: 100_000n, tokens: [rsBTC(1000)] });
		});
		it('wtb 100 rsBTC with 100 nanoErg', () => {
			wtb.addBalance({ nanoergs: 1_000n + 100n }, buyBtcUsdRegs(maker, 1n, 1n));

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === wtb.ergoTree))
				.from([...wtb.utxos, ...taker.utxos])
				.to([ergOutput(maker, 1_000n, [rsBTC(100)], buyBtcUsdRegs(maker))])
				.sendChangeTo(taker.address)
				.build();

			expect(mockChain.execute(transaction, { signers: [pool, taker] })).to.be.true;
		});

		it("can't underpay nanoErg", () => {
			wtb.addBalance({ nanoergs: 1_000n + 100n }, buyBtcUsdRegs(maker, 1n, 1n));

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === wtb.ergoTree))
				.from([...wtb.utxos, ...taker.utxos])
				.to([ergOutput(maker, 1_000n - 1n, [rsBTC(100)], buyBtcUsdRegs(maker))])
				.sendChangeTo(taker.address)
				.build();

			expect(mockChain.execute(transaction, { signers: [pool, taker], throw: false })).to.be
				.false;
		});

		it("can't underpay tokens", () => {
			wtb.addBalance({ nanoergs: 1_000n + 100n }, buyBtcUsdRegs(maker, 1n, 1n));

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === wtb.ergoTree))
				.from([...wtb.utxos, ...taker.utxos])
				.to([ergOutput(maker, 1_000n, [rsBTC(100 - 1)], buyBtcUsdRegs(maker))])
				.sendChangeTo(taker.address)
				.build();

			expect(mockChain.execute(transaction, { signers: [pool, taker], throw: false })).to.be
				.false;
		});

		it('wtb [100BTC, 100E], [100BTC, 200E]', () => {
			wtb.addBalance({ nanoergs: 100n }, buyBtcUsdRegs(maker, 1n, 1n));
			wtb.addBalance({ nanoergs: 200n }, buyBtcUsdRegs(maker, 2n, 1n));

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === wtb.ergoTree))
				.from([...wtb.utxos, ...taker.utxos])
				.to([ergOutput(maker, 1n, [rsBTC(500)], buyBtcUsdRegs(maker))])
				.sendChangeTo(taker.address)
				.build();

			expect(mockChain.execute(transaction, { signers: [pool, taker] })).to.be.true;
		});

		it('change can be sent to maker address', () => {
			wtb.addBalance({ nanoergs: 2_000n }, buyBtcUsdRegs(maker, 1n, 10n));

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === wtb.ergoTree))
				.from([...wtb.utxos, ...taker.utxos])
				.to([ergOutput(maker, 2_000n - 10n, [rsBTC(1)], buyBtcUsdRegs(maker))])
				.sendChangeTo(taker.address)
				.build();

			expect(mockChain.execute(transaction, { signers: [pool, taker] })).to.be.true;
		});
		it('change can be sent to contract change box', () => {
			wtb.addBalance({ nanoergs: 1_000n + 1_000n }, buyBtcUsdRegs(maker, 1n, 10n));

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === wtb.ergoTree))
				.from([...wtb.utxos, ...taker.utxos])
				.to([ergOutput(maker, 10n, [rsBTC(1)], buyBtcUsdRegs(maker))])
				.to([ergOutput(wtb, 2_000n - 20n, [], buyBtcUsdRegs(maker, 1n, 10n))])
				.sendChangeTo(taker.address)
				.build();

			expect(mockChain.execute(transaction, { signers: [pool, taker] })).to.be.true;
		});
		it("can't manipulate rate in contract change box", () => {
			wtb.addBalance({ nanoergs: 1_000n + 1_000n }, buyBtcUsdRegs(maker, 1n, 10n));

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === wtb.ergoTree))
				.from([...wtb.utxos, ...taker.utxos])
				.to([ergOutput(maker, 10n, [rsBTC(1)], buyBtcUsdRegs(maker))])
				.to([ergOutput(wtb, 2_000n - 20n, [], buyBtcUsdRegs(maker, 1n, 100n))])
				.sendChangeTo(taker.address)
				.build();

			expect(mockChain.execute(transaction, { signers: [pool, taker], throw: false })).to.be
				.false;
		});

		it(`wtb 
            20ERG/BTC for 1000ERG  (50BTC max), 
            1ERG/BTC for  100ERG (100BTC max)`, () => {
			// rate = token/ERG
			wtb.addBalance({ nanoergs: 1000n }, buyBtcUsdRegs(maker, 1n, 20n));
			wtb.addBalance({ nanoergs: 100n }, buyBtcUsdRegs(maker, 1n, 1n));

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === wtb.ergoTree))
				.from([...wtb.utxos, ...taker.utxos])
				.to([ergOutput(maker, 1n, [rsBTC(150)], buyBtcUsdRegs(maker))])
				.sendChangeTo(taker.address)
				.build();

			expect(mockChain.execute(transaction, { signers: [pool, taker] })).to.be.true;
		});

		it(`can't steal value with change erg
            20ERG/BTC for 1000ERG  (50BTC max), 
            1ERG/BTC for  100ERG (100BTC max)`, () => {
			const stealNanoErg = 1n;
			wtb.addBalance({ nanoergs: 1000n }, buyBtcUsdRegs(maker, 1n, 20n));
			wtb.addBalance({ nanoergs: 100n }, buyBtcUsdRegs(maker, 1n, 1n));

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === wtb.ergoTree))
				.from([...wtb.utxos, ...taker.utxos])
				.to([
					ergOutput(
						maker,
						1000n + 20n - stealNanoErg,
						[rsBTC(100 - 1)],
						buyBtcUsdRegs(maker)
					)
				])
				.sendChangeTo(taker.address)
				.build();

			expect(mockChain.execute(transaction, { signers: [pool, taker], throw: false })).to.be
				.false;
		});
	});
});
