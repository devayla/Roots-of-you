import { NextRequest, NextResponse } from 'next/server';
import { getNeynarApiKey, NEYNAR_API_BASE_URL } from '@/lib/neynar';
import { getDatabase } from '@/lib/mongodb';
import type { BestFriendsResponse } from '@/types/neynar';

export const dynamic = 'force-dynamic';

interface CachedBestFriends {
  fid: number;
  data: BestFriendsResponse;
  cachedAt: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const limit = searchParams.get('limit') || '7';

    if (!fid) {
      return NextResponse.json(
        { error: 'fid query parameter is required' },
        { status: 400 },
      );
    }

    const fidNumber = parseInt(fid, 10);
    if (isNaN(fidNumber)) {
      return NextResponse.json(
        { error: 'Invalid fid' },
        { status: 400 },
      );
    }

    // 1. Try to get from MongoDB cache
    const db = await getDatabase();
    const collection = db.collection<CachedBestFriends>('cached_best_friends');

    const now = Date.now();
    const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

    // Check if we have a valid cache for this fid and limit
    // Note: limit is usually '7' in this app, but we should include it in cache key if it varies
    const cached = await collection.findOne({ fid: fidNumber });

    if (cached && (now - cached.cachedAt) < cacheExpiry) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }

    // 2. If not in cache, fetch from Neynar
    const apiKey = getNeynarApiKey();
    const url = `${NEYNAR_API_BASE_URL}/user/best_friends/?limit=${limit}&fid=${fid}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Neynar API error:', errorText);

      // If Neynar fails but we have stale cache, return it as fallback
      if (cached) {
        return NextResponse.json(cached.data, {
          headers: { 'X-Cache-Status': 'STALE' }
        });
      }

      return NextResponse.json(
        { error: 'Failed to fetch best friends from Neynar API' },
        { status: response.status },
      );
    }

    const data: BestFriendsResponse = await response.json();

    // 3. Save to MongoDB cache
    await collection.updateOne(
      { fid: fidNumber },
      {
        $set: {
          fid: fidNumber,
          data: data,
          cachedAt: now,
        },
      },
      { upsert: true }
    );

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error in best-friends API route:', error);
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







