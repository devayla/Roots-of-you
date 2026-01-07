import { NextRequest, NextResponse } from 'next/server';
import { getNeynarApiKey, NEYNAR_API_BASE_URL } from '@/lib/neynar';
import type { BestFriendsResponse } from '@/types/neynar';

export const dynamic = 'force-dynamic';

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
      return NextResponse.json(
        { error: 'Failed to fetch best friends from Neynar API' },
        { status: response.status },
      );
    }

    const data: BestFriendsResponse = await response.json();
    return NextResponse.json(data);
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






