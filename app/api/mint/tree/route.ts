import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabase } from '@/lib/mongodb'
import { verifyAddressForFid } from '@/lib/neynar'

export const dynamic = 'force-dynamic'

const mintSchema = z.object({
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  ownerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid owner address").optional(),
  fid: z.number().int().positive(),
  imageCid: z.string().min(1),
  metadataCid: z.string().min(1),
  txHash: z.string().optional(),
  tokenId: z.string().optional(),
  minterFid: z.number().int().positive().optional(),
  minterUsername: z.string().optional(),
  minterPfpUrl: z.string().url().optional().or(z.literal('')),
})

interface MintRecord {
  userAddress: string
  ownerAddress?: string
  fid: number
  imageCid: string
  metadataCid: string
  txHash?: string
  tokenId?: string
  minterFid?: number
  minterUsername?: string
  minterPfpUrl?: string
  timestamp: number
  ipfsImageUrl: string
  ipfsMetadataUrl: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = mintSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const {
      userAddress,
      ownerAddress,
      fid,
      imageCid,
      metadataCid,
      txHash,
      tokenId,
      minterFid,
      minterUsername,
      minterPfpUrl,
    } = result.data

    // SECURITY CHECK: Verify that the address is associated with the FID
    // (Or the minterFid if provided, but let's check userAddress for now)
    const isAddressVerified = await verifyAddressForFid(userAddress, minterFid || fid)
    if (!isAddressVerified) {
      console.error('❌ Security check failed in mint/tree: Address not associated with FID', { userAddress, fid, minterFid });
      // We'll allow it for now but log it, or we can be strict
      // Let's be semi-strict: return 403
      return NextResponse.json(
        { success: false, error: 'Authorization failed: Address not associated with FID' },
        { status: 403 }
      )
    }

    const db = await getDatabase()
    const collection = db.collection<MintRecord>('tree_nfts')

    const mintRecord: MintRecord = {
      userAddress,
      ownerAddress,
      fid,
      imageCid,
      metadataCid,
      txHash,
      tokenId,
      minterFid,
      minterUsername,
      minterPfpUrl,
      timestamp: Date.now(),
      ipfsImageUrl: `https://gateway.pinata.cloud/ipfs/${imageCid}`,
      ipfsMetadataUrl: `https://gateway.pinata.cloud/ipfs/${metadataCid}`,
    }

    await collection.updateOne(
      { fid },
      { $set: mintRecord },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Mint record saved successfully',
      data: mintRecord,
    })
  } catch (error) {
    console.error('Error saving mint record:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const querySchema = z.object({
  fid: z.coerce.number().int().positive().optional(),
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams))

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { fid, userAddress } = parsed.data

    const db = await getDatabase()
    const collection = db.collection<MintRecord>('tree_nfts')

    let query: any = {}
    if (fid) query.fid = fid
    if (userAddress) query.userAddress = userAddress

    const records = await collection.find(query).sort({ timestamp: -1 }).toArray()

    return NextResponse.json({
      success: true,
      data: records,
    })
  } catch (error) {
    console.error('Error fetching mint records:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}



