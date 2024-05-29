import type { Request, Response } from 'express';
import type { BoxDB } from '$lib/db/db';

// Make sure to pass `io` from your main server file
export function boxesRoute(app, io, db: BoxDB) {
  app.get('/boxes', (req: Request, res: Response) => {
    try {
      const serializedData = JSON.stringify(db.boxRows); // Simplified serialization

      // Broadcast the update to all connected WebSocket clients
      io.emit('update', { buy: [], sell: [] });
      console.log("Broadcasting update to clients:", { buy: [], sell: [] }); // Log each broadcast

      console.log("Emitting update event"); // Debug log
      res.header('Content-Type', 'application/json').send(serializedData);
    } catch (error) {
      console.error('Error processing /boxes request:', error); // Log any errors
      res.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
