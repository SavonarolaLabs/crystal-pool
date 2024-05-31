import type { Express, Request, Response } from 'express';
import type { BoxDB } from '$lib/db/db';
import { serializeBigInt } from '../serializeBigInt';

export function userBoxes(app: Express, db: BoxDB) {
	app.get('/user-boxes/:address', (req: Request, res: Response) => {
		const { address } = req.params;
        const userBoxes = db.boxRows.filter(box => box.parameters.userPk == address)
		res.header('Content-Type', 'application/json').send(serializeBigInt(userBoxes));
	});
}
