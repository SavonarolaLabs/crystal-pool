import { deposit, createWithdrawTx } from '$lib/wallet/deposit'; // DEPOSIT AND WITHDRAW TX
import { signMultisig } from '$lib/wallet/multisig-server'; // MULTISIG USER + POOL
import { signTx } from '$lib/wallet/multisig-server'; // SINGLE SIGN

import { describe } from 'node:test';
import { it } from 'vitest';

describe('overview', () => {
	it('empty', () => {
		//PART 1.TX CREATION:
		//const unsignedTx = deposit()          // DEPOSIT  TX
		//const unsignedTx = createWithdrawTx() // WITHDRAW TX
		//PART 2.TX SIGNING
		//const signedTx = signTx()             // SINGLE   ALL INPUTS  USER
		//const signedTx = signMultisig();      // MULTISIG ALL INPUTS  USER+POOL
		//
	});
});
