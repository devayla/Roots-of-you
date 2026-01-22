import { getDatabase } from './mongodb';
import type { NeynarUser } from '@/types/neynar';

/**
 * Neynar API configuration and helper functions
 */

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

export const NEYNAR_API_BASE_URL = 'https://api.neynar.com/v2/farcaster';

// Round-robin counter for cycling through API keys 2-5
let neynarKeyIndex = 0;

/**
 * Get the original Neynar API key
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
    if (NEYNAR_API_KEY) {
      return [NEYNAR_API_KEY];
    }
    throw new Error(
      'At least one NEYNAR_API_KEY must be set.',
    );
  }

  return keys;
}

/**
 * Get Neynar API key using round-robin
 */
export function getNeynarApiKeyRoundRobin(): string {
  const allKeys = getAllNeynarApiKeys();
  const selected = allKeys[neynarKeyIndex % allKeys.length];
  neynarKeyIndex = (neynarKeyIndex + 1) % allKeys.length;
  return selected;
}

interface CachedUser {
  fid: number;
  userData: NeynarUser;
  cachedAt: number;
}

/**
 * Helper function to get user data from cache or Neynar API
 */
export async function getUserData(fid: number): Promise<NeynarUser | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<CachedUser>('cached_users');

    // Check cache (24h)
    const cached = await collection.findOne({ fid });
    const now = Date.now();
    const cacheExpiry = 24 * 60 * 60 * 1000;

    if (cached && (now - cached.cachedAt) < cacheExpiry) {
      return cached.userData;
    }

    // Fetch from Neynar
    const apiKey = getNeynarApiKeyRoundRobin();
    const url = `${NEYNAR_API_BASE_URL}/user/bulk/?fids=${fid}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'x-api-key': apiKey },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const user: NeynarUser | undefined = data.users?.[0];

    if (!user) return null;

    // Cache
    await collection.updateOne(
      { fid },
      { $set: { fid, userData: user, cachedAt: now } },
      { upsert: true }
    );

    return user;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

/**
 * Verify if an address is associated with an FID
 */
export async function verifyAddressForFid(address: string, fid: number): Promise<boolean> {
  const user = await getUserData(fid);
  if (!user) return false;

  const addressLower = address.toLowerCase();

  if (user.custody_address?.toLowerCase() === addressLower) return true;
  if (user.verified_addresses?.primary?.eth_address?.toLowerCase() === addressLower) return true;
  if (user.verified_addresses?.eth_addresses?.some(a => a.toLowerCase() === addressLower)) return true;
  if (user.verifications?.some(a => a.toLowerCase() === addressLower)) return true;

  return false;
}






