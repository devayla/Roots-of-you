import { NextRequest, NextResponse } from 'next/server';
import { getNeynarApiKeyRoundRobin, NEYNAR_API_BASE_URL } from '@/lib/neynar';

export const dynamic = 'force-dynamic';

// FID for @aylaaa.eth - you may need to update this
const AYLAAA_FID = 947631; // Update this with the actual FID for @aylaaa.eth

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const viewerFid = searchParams.get('viewer_fid');

    if (!viewerFid) {
      return NextResponse.json(
        { error: 'viewer_fid query parameter is required' },
        { status: 400 },
      );
    }

    // Parse viewerFid to number first
    const viewerFidNum = parseInt(viewerFid, 10);
    if (isNaN(viewerFidNum)) {
      return NextResponse.json(
        { error: 'Invalid viewer_fid format' },
        { status: 400 },
      );
    }



    const apiKey = getNeynarApiKeyRoundRobin();
    
    const url = `${NEYNAR_API_BASE_URL}/user/bulk/?fids=${AYLAAA_FID}&viewer_fid=${viewerFidNum}`;
    
    // Log for debugging
    console.log('[check-follow] Request URL:', url);
    console.log('[check-follow] viewerFid from query:', viewerFid, 'parsed:', viewerFidNum);

    // Fetch from Neynar API with no caching
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
      cache: 'no-store', // Prevent Next.js fetch caching - ensures fresh data on every request
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Neynar API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to check follow status from Neynar API' },
        { status: response.status },
      );
    }

    const data = await response.json();
    const user = data.users?.[0];
    
    console.log('[check-follow] Response data:', {
      viewerFid: viewerFidNum,
      targetFid: AYLAAA_FID,
      userFound: !!user,
      following: user?.viewer_context?.following,
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }
    
    // Check viewer_context.following to see if viewer is following the user
    const isFollowing = user.viewer_context?.following;
    
    // Return response with cache control headers to prevent client-side caching
    return NextResponse.json(
      {
        success: true,
        isFollowing,
        targetFid: AYLAAA_FID,
        targetUsername: user.username || 'aylaaa.eth',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      },
    );
  } catch (error) {
    console.error('Error in check-follow API route:', error);
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
