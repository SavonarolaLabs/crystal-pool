import { compileDepositProxyContract } from '$lib/compiler/compile';
import { BOB_ADDRESS } from '$lib/constants/addresses';
import { BOB_MNEMONIC } from '$lib/constants/mnemonics';
import { TOKEN } from '$lib/constants/tokens';
import { utxos } from '$lib/data/utxos';
import { fetchHeight } from '$lib/external/height';
import { boxAtAddress, boxesAtAddress } from '$lib/utils/test-helper';
import { RECOMMENDED_MIN_FEE_VALUE } from '@fleet-sdk/core';
import { beforeAll, describe, expect, it } from 'vitest';
import { deposit } from './deposit';
import { sendToDepositProxy } from './depositProxy';
import { signTx } from './multisig-server';

let unlockHeight = 1_300_000;
let PROXY = compileDepositProxyContract(BOB_ADDRESS, unlockHeight);
let currentHeight;

describe('deposit contract', () => {
	beforeAll(async () => {
		currentHeight = await fetchHeight();
	});

	it('forwards tokens', async() => {
        const tokens = [{ tokenId: TOKEN.rsBTC.tokenId, amount: 100_000_000n.toString() }];
		const tx = sendToDepositProxy(
			PROXY,
			currentHeight,
			utxos[BOB_ADDRESS],
			BOB_ADDRESS,
			BOB_ADDRESS,
			unlockHeight,
			tokens,
            (10_000_000).toString(),
		);
        const signed = await signTx(tx, BOB_MNEMONIC);
        expect(signed).toBeDefined();
        expect(boxesAtAddress(signed, PROXY).length).toBe(1);
        expect(boxAtAddress(signed, PROXY).assets).toStrictEqual(tokens);

        const proxyBox = boxAtAddress(signed, PROXY)
        const depositUTx = deposit(
			currentHeight,
			[proxyBox],
			BOB_ADDRESS,
			BOB_ADDRESS,
			unlockHeight,
			tokens,
			(10_000_000n-RECOMMENDED_MIN_FEE_VALUE).toString()
		);
        const signed2 = await signTx(depositUTx, BOB_MNEMONIC);
        expect(signed2).toBeDefined();
	});
});
