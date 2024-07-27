import { compileContract, compileDepositProxyContract } from '$lib/compiler/compile';
import { BOB_ADDRESS, DEPOSIT_ADDRESS, SHADOWPOOL_ADDRESS } from '$lib/constants/addresses';
import {
	ErgoAddress,
	RECOMMENDED_MIN_FEE_VALUE,
	SColl,
	SGroupElement,
	SInt,
	SSigmaProp,
	TransactionBuilder
} from '@fleet-sdk/core';
import { afterEach, describe, expect, it } from 'vitest';
import { KeyedMockChainParty, MockChain } from '@fleet-sdk/mock-chain';
import { SByte, SLong, SPair } from '@fleet-sdk/serializer';
import { comet, ergOutput, output, rsBTC, SigUSD } from '$lib/contracts/tests/helper';

describe('deposit contract', () => {
	const PROXYCONTRACT = `{
  val sentToDepositContract  = OUTPUTS(0).propositionBytes == _depositAddress
  val userPKset              = OUTPUTS(0).R4[Coll[SigmaProp]].get(0).propBytes == _userPk
  val poolPKset              = OUTPUTS(0).R4[Coll[SigmaProp]].get(1).propBytes == _poolPk
  val unlockHeightSet        = OUTPUTS(0).R5[Int].get == _unlockHeight  
  
  val ergForwarded        = OUTPUTS(0).value == INPUTS.fold(0L, {(acc: Long, input: Box) => acc + input.value}) - _minerFee
 
  val tokensForwarded = {
    val inputTokens = INPUTS.flatMap({ (input: Box) => input.tokens })
    val outputTokens = OUTPUTS(0).tokens

    inputTokens.forall({ (inputToken: (Coll[Byte], Long)) =>
      val tokenId = inputToken._1
      
      def filterByTokenId(t: (Coll[Byte], Long)): Boolean = {
        t._1 == tokenId
      }

      def sumTokenValue(acc: Long, t: (Coll[Byte], Long)): Long = {
        acc + t._2
      }

      val inputAmount = inputTokens
        .filter(filterByTokenId)
        .fold(0L, sumTokenValue)
      val outputAmount = outputTokens
        .filter(filterByTokenId)
        .fold(0L, sumTokenValue)
      inputAmount == outputAmount
    })
  }

  val validMinerFee = {
        val minerFeeErgoTreeBytesHash: Coll[Byte] = fromBase16("e540cceffd3b8dd0f401193576cc413467039695969427df94454193dddfb375")
        OUTPUTS.map({ (output: Box) =>
            if (blake2b256(output.propositionBytes) == minerFeeErgoTreeBytesHash) output.value else 0L
        }).fold(0L, { (a: Long, b: Long) => a + b }) == _minerFee
  }

  sigmaProp(allOf(Coll(
    sentToDepositContract,
    userPKset,
    poolPKset,
    unlockHeightSet,
    ergForwarded ,
    tokensForwarded,
    validMinerFee
  )))
}`;
	const mockChain = new MockChain({ height: 1_250_000 });
	const unlockHeight = 1_300_000;
	const pool = mockChain.newParty('Pool');
	const depositor = mockChain.newParty('Depositor');
	const anotherUser = mockChain.newParty('Another user');
	const executor = mockChain.newParty('Bob');
	mockChain.parties;

	const userPk = depositor.key.address.toString();
	const minerFee = RECOMMENDED_MIN_FEE_VALUE;
	let PROXY = compileContract(PROXYCONTRACT, {
		_depositAddress: SColl(SByte, ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree).toHex(),
		_userPk: SColl(SByte, ErgoAddress.fromBase58(userPk).ergoTree).toHex(),
		_poolPk: SColl(SByte, pool.ergoTree).toHex(),
		_unlockHeight: SInt(unlockHeight).toHex(),
		_minerFee: SLong(minerFee).toHex()
	});

	const contract = mockChain.addParty(
		ErgoAddress.fromBase58(PROXY).ergoTree,
		'Deposit Proxy Contract'
	);
	const deposit = mockChain.addParty(
		ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree,
		'Deposit Contract'
	);
	const depositRegisters = (pk: KeyedMockChainParty) => ({
		R4: SColl(SSigmaProp, [
			SGroupElement(pk.key.publicKey),
			SGroupElement(pool.key.publicKey)
		]).toHex(),
		R5: SInt(unlockHeight).toHex()
	});

	afterEach(() => {
		mockChain.reset();
	});

	describe('Can send ', () => {
		it('Depositor -> Proxy -> Deposit ', () => {
			depositor.addBalance(
				{ nanoergs: 100_000_000n, tokens: [rsBTC(100000)] },
				depositRegisters(depositor)
			);

			const transactionProxy = new TransactionBuilder(mockChain.height)
				.configureSelector((s) =>
					s.ensureInclusion((b) => b.ergoTree === depositor.ergoTree)
				)
				.from([...depositor.utxos])
				.to([
					ergOutput(
						contract,
						100_000_000n - RECOMMENDED_MIN_FEE_VALUE,
						[rsBTC(100000)],
						depositRegisters(depositor)
					)
				])
				.payFee(RECOMMENDED_MIN_FEE_VALUE)
				.build();

			expect(mockChain.execute(transactionProxy, { signers: [depositor] })).to.be.true;

			//console.log(contract.utxos.toArray()[0].value); // toArray -> Sum

			const transactionDeposit = new TransactionBuilder(mockChain.height)
				.configureSelector((s) =>
					s.ensureInclusion((b) => b.ergoTree === contract.ergoTree)
				)
				.from([...contract.utxos])
				.to([
					ergOutput(
						deposit,
						100_000_000n - 2n * RECOMMENDED_MIN_FEE_VALUE,
						[rsBTC(100000)],
						depositRegisters(depositor)
					)
				])
				.payFee(RECOMMENDED_MIN_FEE_VALUE)
				.build();

			expect(mockChain.execute(transactionDeposit, { signers: [executor] })).to.be.true;
		});
		it('Proxy -> Deposit', () => {
			contract.addBalance(
				{ nanoergs: 100_000_000n, tokens: [rsBTC(100000)] },
				depositRegisters(depositor)
			);

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) =>
					s.ensureInclusion((b) => b.ergoTree === contract.ergoTree)
				)
				.from([...contract.utxos])
				.to([
					ergOutput(
						deposit,
						100_000_000n - RECOMMENDED_MIN_FEE_VALUE,
						[rsBTC(100000)],
						depositRegisters(depositor)
					)
				])
				.payFee(RECOMMENDED_MIN_FEE_VALUE)
				.build();

			expect(mockChain.execute(transaction, { signers: [executor] })).to.be.true;
		});
		it('Proxy x3 Box -> Deposit', () => {
			contract.addBalance(
				{ nanoergs: 50_000_000n, tokens: [rsBTC(100000)] },
				depositRegisters(depositor)
			);
			contract.addBalance(
				{ nanoergs: 40_000_000n, tokens: [SigUSD(100000), comet(500)] },
				depositRegisters(depositor)
			);
			contract.addBalance(
				{ nanoergs: 10_000_000n, tokens: [SigUSD(100000)] },
				depositRegisters(depositor)
			);

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) =>
					s.ensureInclusion((b) => b.ergoTree === contract.ergoTree)
				)
				.from([...contract.utxos])
				.to([
					ergOutput(
						deposit,
						100_000_000n - RECOMMENDED_MIN_FEE_VALUE,
						[rsBTC(100000), SigUSD(200000), comet(500)],
						depositRegisters(depositor)
					)
				])
				.payFee(RECOMMENDED_MIN_FEE_VALUE)
				.build();

			expect(mockChain.execute(transaction, { signers: [executor] })).to.be.true;
		});

		it(`Proxy -> Small Box +
			Proxy -> Second Box -> Deposit`, () => {
			depositor.addBalance(
				{ nanoergs: 100_000_000n, tokens: [rsBTC(100000)] },
				depositRegisters(depositor)
			);
			depositor.addBalance(
				{ nanoergs: 100_000_000n, tokens: [comet(100000)] },
				depositRegisters(depositor)
			);
			// Tx1 Add Small box to Proxy
			const transactionProxy = new TransactionBuilder(mockChain.height)
				.configureSelector((s) =>
					s.ensureInclusion((b) => b.ergoTree === depositor.ergoTree)
				)
				.from([depositor.utxos.toArray()[0]])
				.to([ergOutput(contract, 1000n, [rsBTC(100000)], depositRegisters(depositor))])
				.sendChangeTo(depositor.address.toString())
				.payFee(RECOMMENDED_MIN_FEE_VALUE)
				.build();

			expect(mockChain.execute(transactionProxy, { signers: [depositor] })).to.be.true;

			const transactionProxy2 = new TransactionBuilder(mockChain.height)
				.configureSelector((s) =>
					s.ensureInclusion((b) => b.ergoTree === depositor.ergoTree)
				)
				.from([...depositor.utxos])
				.to([
					ergOutput(contract, 100_000_000n, [comet(100000)], depositRegisters(depositor))
				])
				.sendChangeTo(depositor.address.toString())
				.payFee(RECOMMENDED_MIN_FEE_VALUE)
				.build();

			expect(mockChain.execute(transactionProxy2, { signers: [depositor] })).to.be.true;

			//			console.log(contract.utxos.toArray())

			const transactionDeposit = new TransactionBuilder(mockChain.height)
				.configureSelector((s) =>
					s.ensureInclusion((b) => b.ergoTree === contract.ergoTree)
				)
				.from([...contract.utxos])
				.to([
					ergOutput(
						deposit,
						100_000_000n + 1000n - RECOMMENDED_MIN_FEE_VALUE,
						[rsBTC(100000), comet(100000)],
						depositRegisters(depositor)
					)
				])
				.payFee(RECOMMENDED_MIN_FEE_VALUE)
				.build();

			expect(mockChain.execute(transactionDeposit, { signers: [executor] })).to.be.true;
		});
	});

	describe('Fake data Single Box: ', () => {
		it('address', () => {
			//v1 - value
			contract.addBalance(
				{ nanoergs: 100_000_000n, tokens: [rsBTC(100000)] },
				depositRegisters(depositor)
			);

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) =>
					s.ensureInclusion((b) => b.ergoTree === contract.ergoTree)
				)
				.from([...contract.utxos])
				.to([
					ergOutput(
						anotherUser,
						100_000_000n - RECOMMENDED_MIN_FEE_VALUE,
						[rsBTC(100000)],
						depositRegisters(depositor)
					)
				])
				.payFee(RECOMMENDED_MIN_FEE_VALUE)
				.build();

			expect(mockChain.execute(transaction, { signers: [executor], throw: false })).to.be
				.false;
		});
		it('value', () => {
			//v1 - value
			contract.addBalance(
				{ nanoergs: 100_000_000n, tokens: [rsBTC(100000)] },
				depositRegisters(depositor)
			);

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) =>
					s.ensureInclusion((b) => b.ergoTree === contract.ergoTree)
				)
				.from([...contract.utxos])
				.to([
					ergOutput(
						deposit,
						100_000_000n - RECOMMENDED_MIN_FEE_VALUE - 1000000n,
						[rsBTC(100000)],
						depositRegisters(depositor)
					),
					ergOutput(anotherUser, 1000000n, [])
				])
				.payFee(RECOMMENDED_MIN_FEE_VALUE)
				.build();

			expect(mockChain.execute(transaction, { signers: [executor], throw: false })).to.be
				.false;
		});
		it('tokens	v1', () => {
			//v1 - value - tokens
			contract.addBalance(
				{ nanoergs: 100_000_000n, tokens: [rsBTC(100000)] },
				depositRegisters(depositor)
			);

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) =>
					s.ensureInclusion((b) => b.ergoTree === contract.ergoTree)
				)
				.from([...contract.utxos])
				.to([
					ergOutput(
						deposit,
						100_000_000n - RECOMMENDED_MIN_FEE_VALUE - 1000000n,
						[rsBTC(50000)],
						depositRegisters(depositor)
					),
					output(anotherUser, [rsBTC(50000)])
				])
				.payFee(RECOMMENDED_MIN_FEE_VALUE)
				.build();

			expect(mockChain.execute(transaction, { signers: [executor], throw: false })).to.be
				.false;
		});
		it('tokens	v2', () => {
			contract.addBalance(
				{ nanoergs: 100_000_000n, tokens: [rsBTC(100000)] },
				depositRegisters(depositor)
			);
			anotherUser.addBalance({ nanoergs: 100_000_000n, tokens: [] });

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) =>
					s.ensureInclusion((b) => b.ergoTree === contract.ergoTree)
				)
				.from([...contract.utxos, ...anotherUser.utxos])
				.to([
					ergOutput(deposit, 100_000_000n, [rsBTC(50000)], depositRegisters(depositor)),
					output(anotherUser, [rsBTC(50000)])
				])
				.sendChangeTo(anotherUser.key.address.toString())
				.payFee(RECOMMENDED_MIN_FEE_VALUE)
				.build();

			expect(mockChain.execute(transaction, { signers: [executor], throw: false })).to.be
				.false;
		});
		it('tokens	v3 change tokens', () => {
			contract.addBalance(
				{ nanoergs: 100_000_000n, tokens: [rsBTC(100000)] },
				depositRegisters(depositor)
			);
			anotherUser.addBalance({ nanoergs: 100_000_000n, tokens: [SigUSD(100000)] });

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) =>
					s.ensureInclusion((b) => b.ergoTree === contract.ergoTree)
				)
				.from([...contract.utxos, ...anotherUser.utxos])
				.to([
					ergOutput(
						deposit,
						100_000_000n - RECOMMENDED_MIN_FEE_VALUE,
						[SigUSD(100000)],
						depositRegisters(depositor)
					),
					output(anotherUser, rsBTC(100000))
				])
				.sendChangeTo(anotherUser.key.address.toString())
				.payFee(RECOMMENDED_MIN_FEE_VALUE)
				.build();

			expect(mockChain.execute(transaction, { signers: [executor], throw: false })).to.be
				.false;
		});
		it('registers	R4_1', () => {
			contract.addBalance(
				{ nanoergs: 100_000_000n, tokens: [rsBTC(100000)] },
				depositRegisters(depositor)
			);

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) =>
					s.ensureInclusion((b) => b.ergoTree === contract.ergoTree)
				)
				.from([...contract.utxos])
				.to([
					ergOutput(
						deposit,
						100_000_000n - RECOMMENDED_MIN_FEE_VALUE,
						[rsBTC(100000)],
						depositRegisters(anotherUser)
					)
				])
				.payFee(RECOMMENDED_MIN_FEE_VALUE)
				.build();

			expect(mockChain.execute(transaction, { signers: [executor], throw: false })).to.be
				.false;
		});
		it('registers	R4_2', () => {
			contract.addBalance(
				{ nanoergs: 100_000_000n, tokens: [rsBTC(100000)] },
				depositRegisters(depositor)
			);

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) =>
					s.ensureInclusion((b) => b.ergoTree === contract.ergoTree)
				)
				.from([...contract.utxos])
				.to([
					ergOutput(deposit, 100_000_000n - RECOMMENDED_MIN_FEE_VALUE, [rsBTC(100000)], {
						R4: SColl(SSigmaProp, [
							SGroupElement(depositor.key.publicKey),
							SGroupElement(anotherUser.key.publicKey)
						]).toHex(),
						R5: SInt(unlockHeight).toHex()
					})
				])
				.payFee(RECOMMENDED_MIN_FEE_VALUE)
				.build();

			expect(mockChain.execute(transaction, { signers: [executor], throw: false })).to.be
				.false;
		});
		it('registers	R5', () => {
			contract.addBalance(
				{ nanoergs: 100_000_000n, tokens: [rsBTC(100000)] },
				depositRegisters(depositor)
			);

			const transaction = new TransactionBuilder(mockChain.height)
				.configureSelector((s) =>
					s.ensureInclusion((b) => b.ergoTree === contract.ergoTree)
				)
				.from([...contract.utxos])
				.to([
					ergOutput(deposit, 100_000_000n - RECOMMENDED_MIN_FEE_VALUE, [rsBTC(100000)], {
						R4: SColl(SSigmaProp, [
							SGroupElement(depositor.key.publicKey),
							SGroupElement(pool.key.publicKey)
						]).toHex(),
						R5: SInt(unlockHeight - 1).toHex()
					})
				])
				.payFee(RECOMMENDED_MIN_FEE_VALUE)
				.build();

			expect(mockChain.execute(transaction, { signers: [executor], throw: false })).to.be
				.false;
		});
	});
});
