import { compile } from "@fleet-sdk/compiler";
import {
    SByte,
    SColl,
    SGroupElement,
    SInt,
    SLong,
    SSigmaProp,
    TransactionBuilder
} from "@fleet-sdk/core";
import { KeyedMockChainParty, MockChain } from "@fleet-sdk/mock-chain";
import { afterEach, describe, expect, it } from "vitest";
import { ergOutput, rsBTC, rsBtcId } from "./helper";

describe("Timed fund contract", () => {
    const ergoTree = compile(`{	
	def getSellerPk(box: Box)              = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
	def getPoolPk(box: Box)                = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
	def unlockHeight(box: Box)             = box.R5[Int].getOrElse(0)
	def getTokenId(box: Box)               = box.R6[Coll[Byte]].getOrElse(Coll[Byte]()) 
	def getRate(box: Box)                  = box.R7[Coll[Long]].getOrElse(Coll[SigmaProp](0L,0L))(0)
	def getDenom(box: Box)                 = box.R7[Coll[Long]].getOrElse(Coll[SigmaProp](0L,0L))(1)
    def getSellerMultisigAddress(box: Box) = box.R8[Coll[Byte]].getOrElse(Coll[Byte]())


 	def tokenId(box: Box) = box.tokens(0)._1
	def tokenAmount(box: Box) = box.tokens(0)._2
  
	def isSameContract(box: Box) = 
		box.propositionBytes == SELF.propositionBytes
  
	def isSameToken(box: Box)    = 
	  	getTokenId(SELF) == getTokenId(box) &&
	  	box.tokens.size > 0 &&
		getTokenId(SELF) == tokenId(box)

  	def isGreaterZeroRate(box:Box) =
    	getRate(box) > 0 &&
		getDenom(box) > 0
  
	def isSameSeller(box: Box)   = 
    	getSellerPk(SELF) == getSellerPk(box) &&
    	getPoolPk(SELF) == getPoolPk(box)

  	def isSameUnlockHeight(box: Box)  = 
    	unlockHeight(SELF) == unlockHeight(box)

  	def isSameMultisig(box: Box)    =
    	getSellerMultisigAddress(SELF) == getSellerMultisigAddress(box)

	def isLegitInput(b: Box) = {
	    isSameContract(b) && 
    	isSameToken(b) && 
    	isSameMultisig(b) && 
    	isSameSeller(b) && 
		isSameUnlockHeight(b) &&
    	isGreaterZeroRate(b)
	}

  	val maxDenom: Long = INPUTS
		.filter(isLegitInput)
		.fold(0L, {(r:Long, box:Box) => {
			if(r > getDenom(box)) r else getDenom(box)
		}}) 
  
    def getRateInMaxDenom(box:Box) = getRate(box)*maxDenom/getDenom(box) 

  	def sumValue(a:Long, b: Box) = a + b.value
  	def sumTokenAmountXRate(a:Long, b: Box) = a + tokenAmount(b) * getRateInMaxDenom(b)  

    val maxSellRate: Long = INPUTS
      .filter(isLegitInput)
      .fold(0L, {(r:Long, box:Box) => {
        if(r > getRateInMaxDenom(box)) r else getRateInMaxDenom(box)
      }})

	def hasMaxSellRate(box: Box) =
    	getRate(box) * maxDenom == getDenom(box) * maxSellRate 

  	def isLegitSellOrderOutput(box: Box) =
	  	isLegitInput(box)&&
	  	hasMaxSellRate(box)
  
	def isPaymentBox(box:Box) = {
		isSameSeller(box) &&
    	isSameUnlockHeight(box) &&
		getTokenId(SELF) == getTokenId(box) &&
		getSellerMultisigAddress(SELF) == box.propositionBytes
	}

    // calculation
  
	val nanoErgsPaid: Long = OUTPUTS
		.filter(isPaymentBox)
		.fold(0L, sumValue) - INPUTS 
		.filter(isLegitInput)
		.fold(0L, sumValue)

	val inSellTokensXRate = INPUTS 
		.filter(isLegitInput)
		.fold(0L, sumTokenAmountXRate)

	val outSellTokensXRate = OUTPUTS
		.filter(isLegitSellOrderOutput)
		.fold(0L, sumTokenAmountXRate)

	val expectedRate = inSellTokensXRate.toBigInt - outSellTokensXRate.toBigInt

    val isPaidAtFairRate = maxDenom.toBigInt * nanoErgsPaid.toBigInt >= expectedRate.toBigInt

	if(HEIGHT > unlockHeight(SELF)){
		getSellerPk(SELF)
	}else{
		getSellerPk(SELF) && getPoolPk(SELF) || sigmaProp(isPaidAtFairRate) && getPoolPk(SELF)
	}
}`);
    const mockChain = new MockChain({ height: 1_052_944 });
    const unlockHeight = mockChain.height + 500;
    const pool = mockChain.newParty("Pool");
    const seller = mockChain.newParty("Seller");
    const seller2 = mockChain.newParty("Seller2");
    const buyer = mockChain.newParty("Bob");
    mockChain.parties;

    const sell = mockChain.addParty(ergoTree.toHex(), "Token Sell Contract");

    const sellBtcUsdRegs = (pk: KeyedMockChainParty, rate: bigint = 1n, denom: bigint = 1n) => ({
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

    describe("Sell before unlockHeight", () => {
        it("sell 100 rsBTC for 100 nanoErg", () => {
            sell.addBalance({ nanoergs: 1_000_000n, tokens: [rsBTC(100)] }, sellBtcUsdRegs(seller));
            buyer.addBalance({ nanoergs: 1_000_000n + 100n });

            const transaction = new TransactionBuilder(mockChain.height)
                .configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === sell.ergoTree))
                .from([...sell.utxos, ...buyer.utxos])
                .to([ergOutput(seller, 1_000_000n + 100n, [], sellBtcUsdRegs(seller))])
                .sendChangeTo(buyer.address)
                .build();

            expect(mockChain.execute(transaction, { signers: [pool, buyer] })).to.be.true;
        });

        it("sell 1_000 rsBTC for 1 nanoErg", () => {
            sell.addBalance(
                { nanoergs: 1_000_000n, tokens: [rsBTC(1000)] },
                sellBtcUsdRegs(seller, 1n, 1000n)
            );
            buyer.addBalance({ nanoergs: 1_000_000n + 1n });

            const transaction = new TransactionBuilder(mockChain.height)
                .configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === sell.ergoTree))
                .from([...sell.utxos, ...buyer.utxos])
                .to([ergOutput(seller, 1_000_000n + 1n, [], sellBtcUsdRegs(seller))])
                .sendChangeTo(buyer.address)
                .build();

            expect(mockChain.execute(transaction, { signers: [pool, buyer] })).to.be.true;
        });

        it("can't underpay", () => {
            sell.addBalance(
                { nanoergs: 1_000_000n, tokens: [rsBTC(1000)] },
                sellBtcUsdRegs(seller, 1n, 1000n)
            );
            buyer.addBalance({ nanoergs: 1_000_000n + 1n });

            const transaction = new TransactionBuilder(mockChain.height)
                .configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === sell.ergoTree))
                .from([...sell.utxos, ...buyer.utxos])
                .to([ergOutput(seller, 1_000_000n + 0n, [], sellBtcUsdRegs(seller))])
                .sendChangeTo(buyer.address)
                .build();

            expect(mockChain.execute(transaction, { signers: [pool, buyer], throw: false })).to.be
                .false;
        });

        it("sell 2x 100 rsBTC for 200 nanoErg", () => {
            const box = { nanoergs: 1_000_000n, tokens: [rsBTC(100)] };
            sell.addBalance(box, sellBtcUsdRegs(seller));
            sell.addBalance(box, sellBtcUsdRegs(seller2));
            buyer.addBalance({ nanoergs: 1_000_000n + 200n });

            const transaction = new TransactionBuilder(mockChain.height)
                .configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === sell.ergoTree))
                .from([...sell.utxos, ...buyer.utxos])
                .to([ergOutput(seller, 1_000_000n + 100n, [], sellBtcUsdRegs(seller))])
                .to([ergOutput(seller2, 1_000_000n + 100n, [], sellBtcUsdRegs(seller2))])
                .sendChangeTo(buyer.address)
                .build();

            expect(mockChain.execute(transaction, { signers: [pool, buyer] })).to.be.true;
        });

        it("partial sell 2x 100 rsBTC", () => {
            const box = { nanoergs: 1_000_000n, tokens: [rsBTC(100)] };
            sell.addBalance(box, sellBtcUsdRegs(seller));
            sell.addBalance(box, sellBtcUsdRegs(seller2));
            buyer.addBalance({ nanoergs: 2_000_000n + 200n });

            const transaction = new TransactionBuilder(mockChain.height)
                .configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === sell.ergoTree))
                .from([...sell.utxos, ...buyer.utxos])
                .to([ergOutput(seller, 1_000_000n + 100n, [], sellBtcUsdRegs(seller))])
                .to([ergOutput(seller2, 1_000_000n + 50n, [rsBTC(50)], sellBtcUsdRegs(seller2))])
                .to([ergOutput(sell, 1_000_000n, [rsBTC(50)], sellBtcUsdRegs(seller2))])
                .sendChangeTo(buyer.address)
                .build();

            expect(mockChain.execute(transaction, { signers: [pool, buyer] })).to.be.true;
        });

        it("partial sell 2x 100 rsBTC", () => {
            const box = { nanoergs: 1_000_000n, tokens: [rsBTC(100)] };
            sell.addBalance(box, sellBtcUsdRegs(seller));
            sell.addBalance(box, sellBtcUsdRegs(seller2));
            buyer.addBalance({ nanoergs: 2_000_000n + 200n });

            const transaction = new TransactionBuilder(mockChain.height)
                .configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === sell.ergoTree))
                .from([...sell.utxos, ...buyer.utxos])
                .to([ergOutput(seller, 1_000_000n + 50n, [], sellBtcUsdRegs(seller))])
                .to([ergOutput(seller2, 1_000_000n + 100n, [rsBTC(50)], sellBtcUsdRegs(seller2))])
                .to([ergOutput(sell, 1_000_000n, [rsBTC(50)], sellBtcUsdRegs(seller))])
                .sendChangeTo(buyer.address)
                .build();

            expect(mockChain.execute(transaction, { signers: [pool, buyer] })).to.be.true;
        });

        it("partial sell 2x 100 rsBTC", () => {
            const box = { nanoergs: 1_000_000n, tokens: [rsBTC(100)] };
            sell.addBalance(box, sellBtcUsdRegs(seller));
            sell.addBalance(box, sellBtcUsdRegs(seller2));
            buyer.addBalance({ nanoergs: 3_000_000n + 200n });

            const transaction = new TransactionBuilder(mockChain.height)
                .configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === sell.ergoTree))
                .from([...sell.utxos, ...buyer.utxos])
                .to([ergOutput(seller, 1_000_000n + 50n, [], sellBtcUsdRegs(seller))])
                .to([ergOutput(seller2, 1_000_000n + 50n, [rsBTC(50)], sellBtcUsdRegs(seller2))])
                .to([ergOutput(sell, 1_000_000n, [rsBTC(50)], sellBtcUsdRegs(seller))])
                .to([ergOutput(sell, 1_000_000n, [rsBTC(50)], sellBtcUsdRegs(seller2))])
                .sendChangeTo(buyer.address)
                .build();

            expect(mockChain.execute(transaction, { signers: [pool, buyer] })).to.be.true;
        });

        it("fail partial sell of lower rate box in 2x 100 rsBTC", () => {
            const box = { nanoergs: 1_000_000n, tokens: [rsBTC(100)] };
            sell.addBalance(box, sellBtcUsdRegs(seller));
            sell.addBalance(box, sellBtcUsdRegs(seller2, 1n, 2n));
            buyer.addBalance({ nanoergs: 3_000_000n + 200n });

            const transaction = new TransactionBuilder(mockChain.height)
                .configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === sell.ergoTree))
                .from([...sell.utxos, ...buyer.utxos])
                .to([ergOutput(seller, 1_000_000n + 50n, [], sellBtcUsdRegs(seller))])
                .to([ergOutput(seller2, 1_000_000n + 25n, [rsBTC(50)], sellBtcUsdRegs(seller2))])
                .to([ergOutput(sell, 1_000_000n, [rsBTC(50)], sellBtcUsdRegs(seller))])
                .to([ergOutput(sell, 1_000_000n, [rsBTC(50)], sellBtcUsdRegs(seller2))])
                .sendChangeTo(buyer.address)
                .build();

            expect(mockChain.execute(transaction, { signers: [pool, buyer], throw: false })).to.be
                .false;
        });

        it("success partial sell of higher rate box in 2x 100 rsBTC", () => {
            const box = { nanoergs: 1_000_000n, tokens: [rsBTC(100)] };
            sell.addBalance(box, sellBtcUsdRegs(seller));
            sell.addBalance(box, sellBtcUsdRegs(seller2, 1n, 2n));
            buyer.addBalance({ nanoergs: 3_000_000n + 200n });

            const transaction = new TransactionBuilder(mockChain.height)
                .configureSelector((s) => s.ensureInclusion((b) => b.ergoTree === sell.ergoTree))
                .from([...sell.utxos, ...buyer.utxos])
                .to([ergOutput(seller, 1_000_000n + 50n, [], sellBtcUsdRegs(seller))])
                .to([ergOutput(seller2, 1_000_000n + 50n, [rsBTC(50)], sellBtcUsdRegs(seller2))])
                .to([ergOutput(sell, 1_000_000n, [rsBTC(50)], sellBtcUsdRegs(seller))])
                .sendChangeTo(buyer.address)
                .build();

            expect(mockChain.execute(transaction, { signers: [pool, buyer] })).to.be.true;
        });
    });
});
