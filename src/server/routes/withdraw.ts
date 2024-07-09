import type { Express, Request, Response } from 'express';
import type { Server } from 'socket.io';
import { withdrawTxWithCommits } from '../crystalPool';
import { type BoxDB } from '../db/db';
import type { WithdrawRequestParams } from '$lib/types/request';


export function createWithdrawTx(app: Express, io: Server, db: BoxDB) {
	app.post('/swap-order', async (req: Request, res: Response) => {
		const withdrawParams: WithdrawRequestParams = req.body;
		const { unsignedTx, publicCommitsPool } = await withdrawTxWithCommits(withdrawParams, db);
		res.json({ unsignedTx, publicCommitsPool });
	});
}
