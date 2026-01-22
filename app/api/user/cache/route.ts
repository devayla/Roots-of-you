import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserData } from '@/lib/neynar'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  fid: z.coerce.number().int().positive(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams))

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { fid } = parsed.data

    const user = await getUserData(fid)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or failed to fetch' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error in user cache API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


