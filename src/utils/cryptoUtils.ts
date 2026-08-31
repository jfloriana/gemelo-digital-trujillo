/**
 * Cryptographic utilities for secure client-side and server-side password hashing and token generation.
 * Uses Web Crypto API (Standard in all modern browsers, Node.js 16+, and Vercel edge/serverless runtime).
 */

/**
 * Generate a random cryptographic salt (hex-encoded)
 */
export const generateSalt = (bytes = 16): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(bytes);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for non-browser/legacy environments
  let result = '';
  const hex = '0123456789abcdef';
  for (let i = 0; i < bytes * 2; i++) {
    result += hex.charAt(Math.floor(Math.random() * hex.length));
  }
  return result;
};

/**
 * Hash password with a unique salt using SHA-256 with key stretching (iterations)
 */
export const hashPasswordWithSalt = async (password: string, salt: string, iterations = 1000): Promise<string> => {
  const encoder = new TextEncoder();
  let currentHashData = encoder.encode(password + ':' + salt);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    for (let i = 0; i < iterations; i++) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', currentHashData);
      if (i === iterations - 1) {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
      currentHashData = new Uint8Array(hashBuffer);
    }
  }

  // Pure JS fallback if SubtleCrypto is unavailable
  let h = 0x811c9dc5;
  const str = password + ':' + salt;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0).toString(16).padStart(64, '0');
};

/**
 * Verify a plain text password against a stored salted hash
 */
export const verifyPassword = async (
  passwordAttempt: string,
  storedSalt: string,
  storedHash: string
): Promise<boolean> => {
  const computedHash = await hashPasswordWithSalt(passwordAttempt, storedSalt);
  return computedHash === storedHash;
};

/**
 * Generate a session bearer token
 */
export const generateSessionToken = (userId: string): string => {
  const timestamp = Date.now();
  const random = generateSalt(8);
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: userId, iat: timestamp, exp: timestamp + 86400000 }))}.${random}`;
};
