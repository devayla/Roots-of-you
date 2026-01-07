import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

interface MintRecord {
  // Wallet that initiated the mint transaction
  userAddress: string
  // Wallet that received the NFT (may be different from userAddress)
  ownerAddress?: string
  // FID whose tree this NFT represents (used as tokenId)
  fid: number
  imageCid: string
  metadataCid: string
  txHash?: string
  tokenId?: string
  // Farcaster user who minted (minter), if known
  minterFid?: number
  minterUsername?: string
  minterPfpUrl?: string
  timestamp: number
  ipfsImageUrl: string
  ipfsMetadataUrl: string
}

export async function POST(request: NextRequest) {
  try {
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
    } = await request.json()

    // Validate inputs
    if (!userAddress || !fid || !imageCid || !metadataCid) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get database connection
    const db = await getDatabase()
    const collection = db.collection<MintRecord>('tree_nfts')

    // Create mint record
    const mintRecord: MintRecord = {
      userAddress,
      ownerAddress: ownerAddress || undefined,
      fid,
      imageCid,
      metadataCid,
      txHash: txHash || undefined,
      tokenId: tokenId || undefined,
      minterFid: minterFid || undefined,
      minterUsername: minterUsername || undefined,
      minterPfpUrl: minterPfpUrl || undefined,
      timestamp: Date.now(),
      ipfsImageUrl: `https://gateway.pinata.cloud/ipfs/${imageCid}`,
      ipfsMetadataUrl: `https://gateway.pinata.cloud/ipfs/${metadataCid}`,
    }

    // Insert or update mint record
    // Use fid as unique identifier (one tree per user)
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
    
    // Handle MongoDB connection errors gracefully
    if (error instanceof Error && error.message.includes('Mongo')) {
      return NextResponse.json(
        { success: false, error: 'Database connection error' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to save mint record' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve mint records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fid = searchParams.get('fid')
    const userAddress = searchParams.get('userAddress')

    const db = await getDatabase()
    const collection = db.collection<MintRecord>('tree_nfts')

    let query: any = {}
    if (fid) {
      query.fid = parseInt(fid, 10)
    }
    if (userAddress) {
      query.userAddress = userAddress
    }

    const records = await collection.find(query).sort({ timestamp: -1 }).toArray()

    return NextResponse.json({
      success: true,
      data: records,
    })
  } catch (error) {
    console.error('Error fetching mint records:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mint records' },
      { status: 500 }
    )
  }
}



