import 'fastify';
import type { BoxDB } from '$lib/db/db';

declare module 'fastify' {
  interface FastifyInstance {
    db: BoxDB;
  }
}