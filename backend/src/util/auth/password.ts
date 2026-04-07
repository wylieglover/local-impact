import argon2 from "argon2";

/**
 * Hashes a plain-text password using Argon2id.
 * memoryCost: 64MB (2^16 KB)
 * timeCost: 3 iterations
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, 
    timeCost: 3,
    parallelism: 1, // Standard for single-threaded Node worker
  });
};

/**
 * Verifies a plain-text password against a stored Argon2 hash.
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    // Usually happens if the hash format is invalid
    return false;
  }
};