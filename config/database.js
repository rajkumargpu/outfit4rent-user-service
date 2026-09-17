// config/database.js

import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL error:', error);
});

export async function initDatabase() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,

        email VARCHAR(255) NOT NULL UNIQUE,

        phone VARCHAR(30),
        date_of_birth DATE,

        bio TEXT,
        avatar_url TEXT,

        city VARCHAR(100),
        country VARCHAR(100),
        address TEXT,
        pin_code VARCHAR(20),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

        user_id UUID NOT NULL UNIQUE,

        sizes JSONB DEFAULT '[]'::jsonb,
        styles JSONB DEFAULT '[]'::jsonb,
        occasions JSONB DEFAULT '[]'::jsonb,
        favorite_colors JSONB DEFAULT '[]'::jsonb,
        preferred_brands JSONB DEFAULT '[]'::jsonb,
        rental_interests JSONB DEFAULT '[]'::jsonb,

        language VARCHAR(10) DEFAULT 'en',
        notifications_enabled BOOLEAN DEFAULT TRUE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_user_preferences_user
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );
    `);

    const seedUserResult = await client.query(
      `
        INSERT INTO users (
          first_name,
          last_name,
          email,
          phone,
          bio,
          city,
          country,
          pin_code
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8
        )
        ON CONFLICT (email) DO NOTHING
        RETURNING id;
      `,
      [
        'Demo',
        'User',
        'demo@outfit4rent.com',
        '+491234567890',
        'Demo user for Outfit4Rent',
        'Essen',
        'Germany',
        '45127',
      ],
    );

    let userId;

    if (seedUserResult.rows.length > 0) {
      userId = seedUserResult.rows[0].id;
    } else {
      const existingUserResult = await client.query(
        `
          SELECT id
          FROM users
          WHERE email = $1
          LIMIT 1
        `,
        ['demo@outfit4rent.com'],
      );

      userId = existingUserResult.rows[0].id;
    }

    await client.query(
      `
        INSERT INTO user_preferences (
          user_id,
          sizes,
          styles,
          occasions,
          favorite_colors,
          preferred_brands,
          rental_interests,
          language,
          notifications_enabled
        )
        VALUES (
          $1,
          $2::jsonb,
          $3::jsonb,
          $4::jsonb,
          $5::jsonb,
          $6::jsonb,
          $7::jsonb,
          $8,
          $9
        )
        ON CONFLICT (user_id) DO NOTHING;
      `,
      [
        userId,
        JSON.stringify(['L', 'XL']),
        JSON.stringify(['casual', 'formal']),
        JSON.stringify(['wedding', 'business']),
        JSON.stringify(['black', 'blue']),
        JSON.stringify(['Zara', 'H&M']),
        JSON.stringify(['jackets', 'suits']),
        'en',
        true,
      ],
    );

    await client.query('COMMIT');

    console.log('Database initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');

    console.error('Database initialization failed:', error);

    throw error;
  } finally {
    client.release();
  }
}
