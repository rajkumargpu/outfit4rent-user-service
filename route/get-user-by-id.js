// routes/get-user-by-email.js

import { getUserById } from '../service/user-service.js';

export default async function getUserByEmailRoute(fastify) {
  fastify.get(
    '/users/:userId',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get a user by id',
        params: {
          type: 'object',
          required: ['userId'],

          properties: {
            email: {
              type: 'string',
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
              },

              message: {
                type: 'string',
              },

              data: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                  },

                  firstName: {
                    type: 'string',
                  },

                  lastName: {
                    type: 'string',
                  },

                  email: {
                    type: 'string',
                  },

                  createdAt: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },

    async (request, reply) => {
      try {
        const user = await getUserById(request.params.userId);

        return reply.code(200).send({
          data: user,
        });
      } catch (error) {
        request.log.error(error);

        if (error.code === 'USER_NOT_FOUND') {
          return reply.code(404).send({
            success: false,
            message: 'User not found',
          });
        }

        return reply.code(500).send({
          success: false,
          message: 'Unable to find user',
        });
      }
    },
  );
}
