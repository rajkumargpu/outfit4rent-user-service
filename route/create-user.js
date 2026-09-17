import { createUser } from '../service/user-service.js';

export default async function createUserRoute(fastify) {
  fastify.post(
    '/users',
    {
      schema: {
        tags: ['Users'],
        summary: 'Create a new user',

        body: {
          type: 'object',
          required: ['firstName', 'lastName', 'email'],

          properties: {
            firstName: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
            },

            lastName: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
            },

            email: {
              type: 'string',
              format: 'email',
            },

            phone: {
              type: 'string',
              maxLength: 30,
            },

            dateOfBirth: {
              type: 'string',
              format: 'date',
            },

            profile: {
              type: 'object',
              properties: {
                bio: {
                  type: 'string',
                  maxLength: 500,
                },

                avatarUrl: {
                  type: 'string',
                  format: 'uri',
                },

                city: {
                  type: 'string',
                },

                country: {
                  type: 'string',
                },

                address: {
                  type: 'string',
                },

                pinCode: {
                  type: 'string',
                },
              },
            },

            preferences: {
              type: 'object',
              properties: {
                sizes: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },

                styles: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },

                occasions: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },

                favoriteColors: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },

                preferredBrands: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },

                rentalInterests: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },

                language: {
                  type: 'string',
                },

                notificationsEnabled: {
                  type: 'boolean',
                  default: true,
                },
              },
            },
          },

          additionalProperties: false,
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
        const user = await createUser(request.body);

        return reply.code(201).send({
          success: true,
          message: 'User created successfully',
          data: user,
        });
      } catch (error) {
        request.log.error(error);

        if (error.code === 'USER_ALREADY_EXISTS') {
          return reply.code(409).send({
            success: false,
            message: 'A user with this email already exists',
          });
        }

        return reply.code(500).send({
          success: false,
          message: 'Unable to create user',
        });
      }
    },
  );
}
