import type { Request, Response } from 'express';
import { db_getBoxesString, type BoxDB } from '../db/db';
import { sendJSON } from '../serverResponseUtils';

export function getBoxes(app, db: BoxDB) {
  app.get('/boxes', (req: Request, res: Response) => {
      sendJSON(res, db_getBoxesString(db));
  });
}
