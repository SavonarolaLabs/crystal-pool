import {
	BOB_ADDRESS
} from '$lib/constants/addresses';
import { BOB_MNEMONIC } from '$lib/constants/mnemonics';
import { describe, expect, it } from 'vitest';
import { createAndMultisigSwapTx } from '$lib/ui/service/tradingService';
import { b } from '$lib/wallet/multisig-server';


describe.only('Alice Swap Creation and Execution', () => {

	it('execute swap order A/B/C', async () => {

		const swapParams = {
			address: '9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU',
			price: '0.002',
			amount: '10000',
			sellingTokenId: '5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
			buyingTokenId: 'f60bff91f7ae3f3a5f0c2d35b46ef8991f213a61d7f7e453d344fa52a42d9f9a'
		};

		const swapUTx = await createAndMultisigSwapTx(swapParams, b, BOB_MNEMONIC, BOB_ADDRESS);
		expect(swapUTx).toBeTruthy();
	});
});

