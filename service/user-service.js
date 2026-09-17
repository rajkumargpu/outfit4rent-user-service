import {
  createUser as createUserRepository,
  findUserByEmail,
  findUserById,
} from '../repository/user-repository.js';

/**
 * Create a new user with profile and preferences.
 *
 * Responsibilities:
 * - Normalize input
 * - Check duplicate email
 * - Apply defaults
 * - Call repository
 */
export async function createUser(payload) {
  const {
    firstName,
    lastName,
    email,
    phone = null,
    dateOfBirth = null,
    profile = {},
    preferences = {},
  } = payload;

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    const error = new Error('User already exists');
    error.code = 'USER_ALREADY_EXISTS';
    throw error;
  }

  const userData = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    phone,
    dateOfBirth,

    profile: {
      bio: profile.bio ?? null,
      avatarUrl: profile.avatarUrl ?? null,
      city: profile.city ?? null,
      country: profile.country ?? null,
      address: profile.address ?? null,
      pinCode: profile.pinCode ?? null,
    },

    preferences: {
      sizes: preferences.sizes ?? [],
      styles: preferences.styles ?? [],
      occasions: preferences.occasions ?? [],
      favoriteColors: preferences.favoriteColors ?? [],
      preferredBrands: preferences.preferredBrands ?? [],
      rentalInterests: preferences.rentalInterests ?? [],
      language: preferences.language ?? 'en',
      notificationsEnabled: preferences.notificationsEnabled ?? true,
    },
  };

  const createdUser = await createUserRepository(userData);

  return {
    id: createdUser.id,
    firstName: createdUser.firstName,
    lastName: createdUser.lastName,
    email: createdUser.email,
    createdAt: createdUser.createdAt,
  };
}

export async function getUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await findUserByEmail(normalizedEmail);

  if (!existingUser) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  return {
    id: existingUser.id,
    firstName: existingUser.firstName,
    lastName: existingUser.lastName,
    email: existingUser.email,
    createdAt: existingUser.createdAt,
  };
}

export async function getUserById(id) {
  const existingUser = await findUserById(id);

  if (!existingUser) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  return {
    id: existingUser.id,
    firstName: existingUser.firstName,
    lastName: existingUser.lastName,
    email: existingUser.email,
    createdAt: existingUser.createdAt,
  };
}
