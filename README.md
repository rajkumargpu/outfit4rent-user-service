# Outfit4Rent User Service

HTTP API for creating users and looking them up by email or ID. Built with Node.js ES modules, Fastify 5, and PostgreSQL using `pg`.

This documentation describes only the implementation in this service directory. See [the architecture document](docs/architecture.md) for the high-level architecture (HLA), low-level design (LLD), and entity-relationship diagram (ERD).

## Implemented capabilities

- Create a user with optional profile details and preferences.
- Normalize email addresses to lowercase and trim names before insertion.
- Check for an existing email and enforce uniqueness in PostgreSQL.
- Save the user and preferences in one database transaction.
- Look up a user by email or UUID; both endpoints return basic user fields only.
- Initialize the database schema and demo data during application startup.

There are no HTTP endpoints for listing, updating, or deleting users, and no authentication or authorization hooks. A delete function exists in the repository but is not exposed through the service or routes.

## Run locally

Requirements: Node.js 22 or newer, npm, and Docker with Compose (or an existing PostgreSQL instance). The supplied Compose file runs PostgreSQL 17 only; the Node.js application runs on the host.

1. Install dependencies from this directory:

   ```sh
   npm ci
   ```

2. Create or update `.env` with settings matching your database. For the supplied local Compose configuration:

   ```dotenv
   PORT=3000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/users_db
   ```

3. Start PostgreSQL and wait for it to accept connections:

   ```sh
   docker compose up -d
   docker compose exec postgres pg_isready -U postgres -d users_db
   ```

4. Start the API:

   ```sh
   npm start
   ```

The application listens on `0.0.0.0`, using `PORT` or `3000` when unset. Database initialization must succeed before the HTTP listener starts. The database role must be able to create the `uuid-ossp` extension and the two tables.

For automatic restarts during development, use `npm run dev`. It starts Compose and then runs nodemon; it does not wait for database readiness. If initialization fails because PostgreSQL is still starting, rerun once the database is ready.

| Command | Behavior |
| --- | --- |
| `npm start` | Loads `.env` when present and starts `app.js`. |
| `npm run dev` | Starts Compose, then runs the application with nodemon. |
| `npm test` | Runs `node --test`; no project test files are currently implemented. |

`config.js` is not used by the application. Its port/host/database defaults are not effective runtime settings; startup reads `process.env` directly.

## HTTP API

| Method | Path | Success | Other responses |
| --- | --- | --- | --- |
| `POST` | `/users` | `201`, basic user data | `400` validation, `409` existing email, `500` unexpected failure |
| `GET` | `/users/email/:email` | `200`, basic user data | `400` invalid email, `404` missing user, `500` unexpected failure |
| `GET` | `/users/:userId` | `200`, basic user data | `404` missing user, `500` unexpected failure, including malformed UUIDs |

Only `firstName`, `lastName`, and `email` are required for creation. The following example includes optional fields:

```sh
curl -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName": "Alex",
    "lastName": "Taylor",
    "email": "alex@example.com",
    "phone": "+491234567890",
    "dateOfBirth": "1995-06-15",
    "profile": {
      "bio": "Interested in occasion wear",
      "city": "Essen",
      "country": "Germany"
    },
    "preferences": {
      "sizes": ["L"],
      "styles": ["formal"],
      "language": "en",
      "notificationsEnabled": true
    }
  }'
```

Example creation response (ID and timestamp vary):

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "8e16c1da-218f-4d47-96cd-e3b653a78b98",
    "firstName": "Alex",
    "lastName": "Taylor",
    "email": "alex@example.com",
    "createdAt": "2026-09-17T12:00:00.000Z"
  }
}
```

Read the demo user created at startup, or use an ID returned by creation:

```sh
curl http://localhost:3000/users/email/demo%40outfit4rent.com
curl http://localhost:3000/users/8e16c1da-218f-4d47-96cd-e3b653a78b98
```

Successful lookups return `{ "data": { ... } }` containing the same five basic fields. Profile details and preferences are persisted but not returned by any current HTTP endpoint.

## Project layout

```text
app.js                         Fastify setup and startup
config/database.js             PostgreSQL pool, schema initialization, demo seed
config.js                      Unused configuration helper
route/create-user.js           POST /users
route/get-user-by-email.js      GET /users/email/:email
route/get-user-by-id.js         GET /users/:userId
service/user-service.js        Normalization, defaults, business errors, projection
repository/user-repository.js  Parameterized SQL and creation transaction
compose.yaml                   Local PostgreSQL container and persistent volume
docs/architecture.md           HLA, LLD, ERD, and implementation limitations
```

The `controller/`, `model/`, and `utils/` directories are empty. `notes.txt` contains earlier design notes; the architecture document records the behavior found in the executable source.
