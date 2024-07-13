import type { Express, Request, Response } from 'express';
import type { Server } from 'socket.io';
import { type BoxDB } from '../db/db';
import { processPotentialDespositTxId } from '../depositProcessor';
import type { BoxRow } from '$lib/types/boxRow';

export function depositTxId(app: Express, io: Server, db: BoxDB) {
	app.post('/deposits/txids', async (req: Request, res: Response) => {
		const txId: string = req.body;
		const rows: BoxRow[] = await processPotentialDespositTxId(db, txId);
		res.json(rows);
	});
}
