import { compileContract, compileDepositProxyContract } from '$lib/compiler/compile';
import { BOB_ADDRESS, DEPOSIT_ADDRESS, SHADOWPOOL_ADDRESS } from '$lib/constants/addresses';
import { ALICE_MNEMONIC, BOB_MNEMONIC } from '$lib/constants/mnemonics';
import { TOKEN } from '$lib/constants/tokens';
import { utxos } from '$lib/data/utxos';
import { fetchHeight } from '$lib/external/height';
import { boxAtAddress, boxesAtAddress } from '$lib/utils/test-helper';
import {
	ErgoAddress,
	RECOMMENDED_MIN_FEE_VALUE,
	SColl,
	SGroupElement,
	SInt,
	SSigmaProp,
	TransactionBuilder
} from '@fleet-sdk/core';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { deposit } from './deposit';
import { sendToDepositProxy } from './depositProxy';
import { c, signTx } from './multisig-server';
import { KeyedMockChainParty, MockChain } from '@fleet-sdk/mock-chain';
import { SByte, SLong, SPair } from '@fleet-sdk/serializer';
import { ergOutput, output, rsBTC } from '$lib/contracts/tests/helper';

let unlockHeight = 1_300_000;
let currentHeight;

describe('deposit contract', () => {
	beforeAll(async () => {
		currentHeight = await fetchHeight();
	});
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
	const executor = mockChain.newParty('Bob');
	mockChain.parties;

	const userPk = depositor.key.address.toString();
	const minerFee = RECOMMENDED_MIN_FEE_VALUE;
	let PROXY = compileContract(PROXYCONTRACT, {
		_depositAddress: SColl(SByte, ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree).toHex(),
		_userPk: SColl(SByte, ErgoAddress.fromBase58(userPk).ergoTree).toHex(),
		_poolPk: SColl(SByte, ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).ergoTree).toHex(),
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

	describe('Proxy ', () => {
		it('can transfer from PROXY to Deposit', () => {
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

			console.dir(transaction, { depth: null });
			expect(mockChain.execute(transaction, { signers: [executor] })).to.be.true;
		});
	});

	it.skip('works', async () => {
		const tokens = [{ tokenId: TOKEN.rsBTC.tokenId, amount: 100_000_000n.toString() }];
		const tx = sendToDepositProxy(
			PROXY,
			currentHeight,
			utxos[BOB_ADDRESS],
			BOB_ADDRESS,
			BOB_ADDRESS,
			unlockHeight,
			tokens,
			(10_000_000).toString()
		);
		const signed = await signTx(tx, BOB_MNEMONIC);
		expect(signed).toBeDefined();
		expect(boxesAtAddress(signed, PROXY).length).toBe(1);
		expect(boxAtAddress(signed, PROXY).assets).toStrictEqual(tokens);

		const proxyBox = boxAtAddress(signed, PROXY);
		const depositUTx = deposit(
			currentHeight,
			[proxyBox],
			BOB_ADDRESS,
			BOB_ADDRESS,
			unlockHeight,
			tokens,
			(10_000_000n - RECOMMENDED_MIN_FEE_VALUE).toString()
		);
		const signed2 = await signTx(depositUTx, ALICE_MNEMONIC);
		expect(signed2).toBeDefined();
	});

	it.skip('fails on underpaiment', async () => {
		const tokens = [
			{
				tokenId: TOKEN.rsBTC.tokenId,
				amount: 100_000_000n.toString()
			}
		];
		const tx = sendToDepositProxy(
			PROXY,
			currentHeight,
			utxos[BOB_ADDRESS],
			BOB_ADDRESS,
			BOB_ADDRESS,
			unlockHeight,
			tokens,
			(10_000_000).toString()
		);
		const signed = await signTx(tx, BOB_MNEMONIC);
		expect(signed).toBeDefined();
		expect(boxesAtAddress(signed, PROXY).length).toBe(1);
		expect(boxAtAddress(signed, PROXY).assets).toStrictEqual(tokens);

		const proxyBox = boxAtAddress(signed, PROXY);
		const depositUTx = deposit(
			currentHeight,
			[proxyBox],
			BOB_ADDRESS,
			BOB_ADDRESS,
			unlockHeight,
			tokens,
			(10_000_000n - RECOMMENDED_MIN_FEE_VALUE - 1n).toString()
		);
		await expect(signTx(depositUTx, BOB_MNEMONIC)).rejects.toThrow();
	});

	it.skip('fails on wrong unlock height', async () => {
		const tokens = [
			{
				tokenId: TOKEN.rsBTC.tokenId,
				amount: 100_000_000n.toString()
			}
		];
		const tx = sendToDepositProxy(
			PROXY,
			currentHeight,
			utxos[BOB_ADDRESS],
			BOB_ADDRESS,
			BOB_ADDRESS,
			unlockHeight,
			tokens,
			(10_000_000).toString()
		);
		const signed = await signTx(tx, BOB_MNEMONIC);
		expect(signed).toBeDefined();
		expect(boxesAtAddress(signed, PROXY).length).toBe(1);
		expect(boxAtAddress(signed, PROXY).assets).toStrictEqual(tokens);

		const proxyBox = boxAtAddress(signed, PROXY);
		const depositUTx = deposit(
			currentHeight,
			[proxyBox],
			BOB_ADDRESS,
			BOB_ADDRESS,
			unlockHeight + 1,
			tokens,
			(10_000_000n - RECOMMENDED_MIN_FEE_VALUE).toString()
		);
		await expect(signTx(depositUTx, BOB_MNEMONIC)).rejects.toThrow();
	});
});
