import type { Request, Response } from 'express';
import type { BoxDB } from '../db/db';
import { serializeBigInt } from '../serializeBigInt';

// Make sure to pass `io` from your main server file
export function boxes(app, db: BoxDB) {
  app.get('/boxes', (req: Request, res: Response) => {
    try {
      const serializedData = serializeBigInt(db.boxRows);
      res.header('Content-Type', 'application/json').send(serializedData);
    } catch (error) {
      console.error('Error processing /boxes request:', error);
      res.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
