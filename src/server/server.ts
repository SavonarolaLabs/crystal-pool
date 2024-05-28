import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { sumRoute } from './libraryA';
import { processNewSwap, processNewSwapSign } from './swapOrder';
import { boxesRoute } from './boxes';
import { initDb } from '$lib/db/db';

const fastify = Fastify({ logger: true });

// Register the CORS plugin
fastify.register(fastifyCors, {
	origin: '*', // Allow all origins
	methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'] // Allow all methods
});



let db;

const start = async () => {
	try {
    db = initDb();
    fastify.decorate('db', db)

    fastify.register(sumRoute);
    fastify.register(processNewSwap);
    fastify.register(processNewSwapSign);
    fastify.register(boxesRoute);

		await fastify.listen({ port: 3000 }); // Updated to use object for listen method
		fastify.log.info(`Server running at http://localhost:3000`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();
