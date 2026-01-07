/**
 * Neynar API configuration and helper functions
 */

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

// Round-robin counter for cycling through API keys 2-5
let neynarKeyIndex = 0;

/**
 * Get the original Neynar API key (for best-friends route)
 */
export function getNeynarApiKey(): string {
  if (!NEYNAR_API_KEY) {
    throw new Error(
      'NEYNAR_API_KEY is not set. Please add it to your .env.local file.',
    );
  }
  return NEYNAR_API_KEY;
}

/**
 * Get all available Neynar API keys (2-5) for round-robin
 */
function getAllNeynarApiKeys(): string[] {
  const keys: string[] = [];
  
  // Check for keys 2-5
  for (let i = 2; i <= 5; i++) {
    const key = process.env[`NEYNAR_API_KEY${i}`];
    if (key) {
      keys.push(key);
    }
  }
  
  if (keys.length === 0) {
    throw new Error(
      'At least one of NEYNAR_API_KEY2, NEYNAR_API_KEY3, NEYNAR_API_KEY4, or NEYNAR_API_KEY5 must be set.',
    );
  }
  
  return keys;
}

/**
 * Get Neynar API key using round-robin (for check-follow and users/bulk routes)
 * Cycles through keys 2, 3, 4, 5
 */
export function getNeynarApiKeyRoundRobin(): string {
  const allKeys = getAllNeynarApiKeys();
  
  // Use round-robin to cycle through available keys
  const selected = allKeys[neynarKeyIndex % allKeys.length];
  neynarKeyIndex = (neynarKeyIndex + 1) % allKeys.length;
  
  return selected;
}

export const NEYNAR_API_BASE_URL = 'https://api.neynar.com/v2/farcaster';






