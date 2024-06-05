import { describe, expect, it } from 'vitest';
import { initDb, db_initDepositUtxo } from './db/db';
import { swapOrderTxWithCommits } from './crystalPool';
import { BOB_ADDRESS } from '$lib/constants/addresses';
import { TOKEN } from '$lib/constants/tokens';

describe('swap', () => {
	it('create and execute', async () => {
		const db = await initDb();
		db_initDepositUtxo(db);
		const swapParams = {
			address: BOB_ADDRESS,
			price: '0.002',
			amount: '10000',
			sellingTokenId: TOKEN.rsBTC.tokenId,
			buyingTokenId: TOKEN.sigUSD.tokenId
		};
		const { unsignedTx, publicCommitsPool } = await swapOrderTxWithCommits(swapParams, db);
		expect(unsignedTx).toBeDefined();
	});
});
