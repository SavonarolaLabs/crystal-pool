import type { Express, Request, Response } from 'express';
import type { Server } from 'socket.io';
import { signWithdraw, withdrawTxWithCommits } from '../crystalPool';
import { type BoxDB } from '../db/db';
import type { WithdrawRequestParams } from '$lib/types/request';


export function createWithdrawTx(app: Express, io: Server, db: BoxDB) {
	app.post('/withdraw', async (req: Request, res: Response) => {
		const withdrawParams: WithdrawRequestParams = req.body;
		const { unsignedTx, publicCommitsPool } = await withdrawTxWithCommits(withdrawParams, db);
		res.json({ unsignedTx, publicCommitsPool });
	});
}

export function signSwapOrder(app: Express, io: Server, db: BoxDB) {
	app.post('/withdraw/sign', async (req: Request, res: Response) => {
		const { unsignedTx, extractedHints } = req.body;
		const signedTx = await signWithdraw(unsignedTx, extractedHints, db);

		res.json(signedTx);
	});
}