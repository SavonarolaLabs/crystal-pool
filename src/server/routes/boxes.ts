import type { Express, Request, Response } from 'express';
import { db_getBoxesByAddressString, db_getBoxesString, type BoxDB } from '../db/db';
import { sendJSON } from '../serverResponseUtils';

export function getBoxes(app: Express, db: BoxDB) {
  app.get('/boxes', (req: Request, res: Response) => {
      sendJSON(res, db_getBoxesString(db));
  });
}

export function getBoxesByAddress(app: Express, db: BoxDB) {
	app.get('/boxes/:address', (req: Request, res: Response) => {
    const boxes = db_getBoxesByAddressString(db, req.params.address);
    sendJSON(res, boxes);
	});
}
