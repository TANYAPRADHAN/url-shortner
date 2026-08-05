const { customAlphabet } = require('nanoid');
const { findByCode } = require('../db');

// URL-safe alphabet, 6 characters → ~56 billion combinations
const nanoid = customAlphabet(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  6
);

/**
 * Generate a unique short code that doesn't already exist in the DB.
 * Retries up to 5 times on collision (extremely rare with nanoid).
 */
async function generateUniqueCode() {
  for (let i = 0; i < 5; i++) {
    const code = nanoid();
    const existing = await findByCode(code);
    if (!existing) return code;
  }
  throw new Error('Failed to generate a unique short code after 5 attempts.');
}

module.exports = { generateUniqueCode };
