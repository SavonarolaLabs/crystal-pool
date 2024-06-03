import 'fastify';
import type { BoxDB } from './db';
import type { Server as SocketIOServer } from 'socket.io';

declare module 'fastify' {
  interface FastifyInstance {
    db: BoxDB;
    io: SocketIOServer;
  }
}
