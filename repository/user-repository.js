import { pool } from '../config/database.js';

export async function findUserByEmail(email) {
  const query = `
    SELECT
      id,
      first_name AS "firstName",
      last_name AS "lastName",
      email,
      phone,
      date_of_birth AS "dateOfBirth",
      bio,
      avatar_url AS "avatarUrl",
      city,
      country,
      address,
      pin_code AS "pinCode",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM users
    WHERE email = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [email]);

  return rows[0] ?? null;
}

export async function createUser(userData) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      profile = {},
      preferences = {},
    } = userData;

    const userQuery = `
      INSERT INTO users (
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        bio,
        avatar_url,
        city,
        country,
        address,
        pin_code
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11
      )
      RETURNING
        id,
        first_name AS "firstName",
        last_name AS "lastName",
        email,
        phone,
        date_of_birth AS "dateOfBirth",
        bio,
        avatar_url AS "avatarUrl",
        city,
        country,
        address,
        pin_code AS "pinCode",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    const userValues = [
      firstName,
      lastName,
      email,
      phone ?? null,
      dateOfBirth ?? null,
      profile.bio ?? null,
      profile.avatarUrl ?? null,
      profile.city ?? null,
      profile.country ?? null,
      profile.address ?? null,
      profile.pinCode ?? null,
    ];

    const userResult = await client.query(userQuery, userValues);

    const user = userResult.rows[0];

    const preferenceQuery = `
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
      RETURNING
        id,
        user_id AS "userId",
        sizes,
        styles,
        occasions,
        favorite_colors AS "favoriteColors",
        preferred_brands AS "preferredBrands",
        rental_interests AS "rentalInterests",
        language,
        notifications_enabled AS "notificationsEnabled",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    const preferenceValues = [
      user.id,
      JSON.stringify(preferences.sizes ?? []),
      JSON.stringify(preferences.styles ?? []),
      JSON.stringify(preferences.occasions ?? []),
      JSON.stringify(preferences.favoriteColors ?? []),
      JSON.stringify(preferences.preferredBrands ?? []),
      JSON.stringify(preferences.rentalInterests ?? []),
      preferences.language ?? 'en',
      preferences.notificationsEnabled ?? true,
    ];

    const preferenceResult = await client.query(
      preferenceQuery,
      preferenceValues,
    );

    await client.query('COMMIT');

    return {
      ...user,
      preferences: preferenceResult.rows[0],
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function findUserById(userId) {
  const query = `
    SELECT
      u.id,
      u.first_name AS "firstName",
      u.last_name AS "lastName",
      u.email,
      u.phone,
      u.date_of_birth AS "dateOfBirth",
      u.bio,
      u.avatar_url AS "avatarUrl",
      u.city,
      u.country,
      u.address,
      u.pin_code AS "pinCode",
      u.created_at AS "createdAt",
      u.updated_at AS "updatedAt",

      jsonb_build_object(
        'id', p.id,
        'sizes', p.sizes,
        'styles', p.styles,
        'occasions', p.occasions,
        'favoriteColors', p.favorite_colors,
        'preferredBrands', p.preferred_brands,
        'rentalInterests', p.rental_interests,
        'language', p.language,
        'notificationsEnabled', p.notifications_enabled
      ) AS preferences

    FROM users u

    LEFT JOIN user_preferences p
      ON p.user_id = u.id

    WHERE u.id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows[0] ?? null;
}

export async function deleteUser(userId) {
  const query = `
    DELETE FROM users
    WHERE id = $1
    RETURNING id
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows[0] ?? null;
}
