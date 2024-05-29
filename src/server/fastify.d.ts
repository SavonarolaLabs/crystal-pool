import 'fastify';
import type { BoxDB } from '$lib/db/db';
import type { Server as SocketIOServer } from 'socket.io';

declare module 'fastify' {
  interface FastifyInstance {
    db: BoxDB;
    io: SocketIOServer;
  }
}
