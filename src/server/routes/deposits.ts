import type { Express, Request, Response } from 'express';
import type { Server } from 'socket.io';
import { db_addDepositTxId, type BoxDB } from '../db/db';


export function createWithdrawTx(app: Express, io: Server, db: BoxDB) {
	app.post('/deposits/txids', async (req: Request, res: Response) => {
		const txId: string = req.body;
        db_addDepositTxId(db,txId);
        
		res.json({txId});
	});
}
