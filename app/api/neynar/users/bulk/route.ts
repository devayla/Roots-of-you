import { NextRequest, NextResponse } from 'next/server';
import { getNeynarApiKeyRoundRobin, NEYNAR_API_BASE_URL } from '@/lib/neynar';
import { getDatabase } from '@/lib/mongodb';
import type { BulkUsersResponse, NeynarUser } from '@/types/neynar';

export const dynamic = 'force-dynamic';

interface CachedBulkUser {
  fid: number;
  userData: NeynarUser;
  cachedAt: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fids = searchParams.get('fids');

    if (!fids) {
      return NextResponse.json(
        { error: 'fids query parameter is required (comma-separated)' },
        { status: 400 },
      );
    }

    const fidList = fids.split(',').map(f => parseInt(f.trim(), 10)).filter(f => !isNaN(f));

    if (fidList.length === 0) {
      return NextResponse.json({ error: 'No valid fids provided' }, { status: 400 });
    }

    // 1. Try to get from MongoDB cache
    const db = await getDatabase();
    const collection = db.collection<CachedBulkUser>('cached_users');

    const now = Date.now();
    const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

    // Find all fids that are in cache and not expired
    const cachedUsers = await collection.find({
      fid: { $in: fidList },
      cachedAt: { $gt: now - cacheExpiry }
    }).toArray();

    const cachedFids = new Set(cachedUsers.map((u: CachedBulkUser) => u.fid));
    const missingFids = fidList.filter(f => !cachedFids.has(f));

    let finalUsers: NeynarUser[] = cachedUsers.map((u: CachedBulkUser) => u.userData);

    // 2. If some fids are missing from cache, fetch from Neynar
    if (missingFids.length > 0) {
      const apiKey = getNeynarApiKeyRoundRobin();
      const url = `${NEYNAR_API_BASE_URL}/user/bulk/?fids=${missingFids.join(',')}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
        },
      });

      if (response.ok) {
        const data: BulkUsersResponse = await response.json();
        const newUsers = data.users || [];

        // Add new users to final list
        finalUsers = [...finalUsers, ...newUsers];

        // Save new users to cache
        if (newUsers.length > 0) {
          const bulkOps = newUsers.map(user => ({
            updateOne: {
              filter: { fid: user.fid },
              update: {
                $set: {
                  fid: user.fid,
                  userData: user,
                  cachedAt: now,
                },
              },
              upsert: true,
            },
          }));
          await collection.bulkWrite(bulkOps);
        }
      } else if (finalUsers.length === 0) {
        const errorText = await response.text();
        console.error('Neynar API error:', errorText);
        return NextResponse.json(
          { error: 'Failed to fetch users from Neynar API' },
          { status: response.status },
        );
      }
    }

    return NextResponse.json({ users: finalUsers }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error in users/bulk API route:', error);
    if (error instanceof Error && error.message.includes('NEYNAR_API_KEY')) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}







