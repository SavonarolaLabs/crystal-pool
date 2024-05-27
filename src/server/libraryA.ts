import type { FastifyInstance, FastifyRequest } from "fastify";

interface SumRequestBody {
    num1: number;
    num2: number;
}

export const sumRoute = (fastify: FastifyInstance, opts: any, done: any) => {
    fastify.post('/sum', async (request: FastifyRequest<{ Body: SumRequestBody }>, reply) => {
      const { num1, num2 } = request.body;
      const sum = num1 + num2;
      return { sum };
    });
    done();
  };