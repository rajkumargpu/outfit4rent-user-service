export function loadConfig(env = process.env) {
  return {
    port: integer('PORT', 4001, 1, 65535),
    host: env.HOST || '127.0.0.1',
    DATABASE_URL:
      env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/users_db',
  };
}
