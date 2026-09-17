// app.js

import Fastify from 'fastify';

import { initDatabase } from './config/database.js';
import createUserRoute from './route/create-user.js';
import getUserByEmailRoute from './route/get-user-by-email.js';
import getUserByIdRoute from './route/get-user-by-id.js';

const fastify = Fastify({
  logger: true,
});

fastify.register(createUserRoute);
fastify.register(getUserByEmailRoute);
fastify.register(getUserByIdRoute);

const start = async () => {
  try {
    await initDatabase();

    await fastify.listen({
      port: process.env.PORT || 3000,
      host: '0.0.0.0',
    });

    console.log('User service started');
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
