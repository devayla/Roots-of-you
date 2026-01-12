import { NextRequest, NextResponse } from 'next/server'
import { encodePacked, hexToBytes, keccak256 } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

export const dynamic = 'force-dynamic'

interface GenerateSignatureBody {
  fid: number
  address: string
  metadataCid: string
}

export async function POST(request: NextRequest) {
  try {
    const { fid, address, metadataCid } = (await request.json()) as GenerateSignatureBody

    if (!fid || !address || !metadataCid) {
      return NextResponse.json(
        { success: false, error: 'Missing fid, address, or metadataCid' },
        { status: 400 },
      )
    }

    const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY
    const gateway = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'

    if (!signerPrivateKey) {
      return NextResponse.json(
        { success: false, error: 'SIGNER_PRIVATE_KEY is not configured on the server' },
        { status: 500 },
      )
    }

    const account = privateKeyToAccount(signerPrivateKey as `0x${string}`)

    // Build token URI from metadata CID (matches docs: contract stores metadata URL)
    const tokenUri = metadataCid

    // keccak256(abi.encodePacked(to, fid, "PUBLIC_MINT"))
    const messageHash = keccak256(
      encodePacked(
        ['address', 'uint256', 'string'],
        [address as `0x${string}`, BigInt(fid), 'PUBLIC_MINT'],
      ),
    )

    // Sign the hash as an Ethereum signed message
    const signature = await account.signMessage({
      message: { raw: hexToBytes(messageHash) },
    })

    return NextResponse.json({
      success: true,
      signature,
      tokenUri,
      mintType: 'public',
      contractFunction: 'publicMint',
    })
  } catch (error) {
    console.error('Error generating tree mint signature:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate signature' },
      { status: 500 },
    )
  }
}



