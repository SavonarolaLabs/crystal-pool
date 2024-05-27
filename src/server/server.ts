import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { sumRoute } from './libraryA';

const fastify = Fastify({ logger: true });

// Register the CORS plugin
fastify.register(fastifyCors, { 
  origin: '*', // Allow all origins
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'], // Allow all methods
});

fastify.register(sumRoute);

const start = async () => {
  try {
    await fastify.listen({ port: 3000 }); // Updated to use object for listen method
    fastify.log.info(`Server running at http://localhost:3000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
