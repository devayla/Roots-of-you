'use client'

import { useState, useCallback } from 'react'
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from 'wagmi'
import { base } from 'viem/chains'
import { svgToImageBlob } from '@/lib/svg-to-image'
import { createTreeNFTMetadata, type TreeMetadataParams } from '@/lib/nft-metadata'
import type { NeynarUser } from '@/types/neynar'
import { ROOTSOFYOU_ABI, ROOTSOFYOU_ADDRESS } from '@/contract/rootsofyou-abi'

export type MintStatus = 
  | 'idle'
  | 'capturing'
  | 'uploading-image'
  | 'creating-metadata'
  | 'uploading-metadata'
  | 'preparing-transaction'
  | 'minting'
  | 'saving'
  | 'success'
  | 'error'

export interface MintResult {
  imageCid?: string
  metadataCid?: string
  txHash?: string
  tokenId?: string
  error?: string
}

type RootUserLike = {
  fid: number
  username: string
  pfp_url?: string
  verified_addresses?: NeynarUser['verified_addresses']
  custody_address?: string
}

type MinterLike = {
  fid: number
  username: string
  pfp_url?: string
}

export interface UseMintTreeNFTReturn {
  mintStatus: MintStatus
  mintResult: MintResult | null
  mintTree: (svgElement: SVGSVGElement, params: {
    rootUser: RootUserLike
    friends: Array<{ user: NeynarUser; score: number }>
    maxScore: number
    minter?: MinterLike
  }) => Promise<void>
  reset: () => void
}

/**
 * Custom hook to handle the complete NFT minting flow for tree visualization
 */
export function useMintTreeNFT(): UseMintTreeNFTReturn {
  const [mintStatus, setMintStatus] = useState<MintStatus>('idle')
  const [mintResult, setMintResult] = useState<MintResult | null>(null)
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { switchChainAsync } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()

  const uploadImageToIPFS = async (imageBlob: Blob): Promise<string> => {
    const formData = new FormData()
    formData.append('file', imageBlob, 'tree-nft.png')

    const response = await fetch('/api/ipfs/upload-image', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to upload image to IPFS')
    }

    return result.cid
  }

  const uploadMetadataToIPFS = async (metadata: ReturnType<typeof createTreeNFTMetadata>): Promise<string> => {
    const response = await fetch('/api/ipfs/upload-metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ metadata }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to upload metadata to IPFS')
    }

    return result.metadataCid
  }

  const saveMintRecord = async (data: {
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
  }) => {
    const response = await fetch('/api/mint/tree', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to save mint record')
    }

    return result
  }

  const mintTree = useCallback(async (
    svgElement: SVGSVGElement,
    params: {
      rootUser: RootUserLike
      friends: Array<{ user: NeynarUser; score: number }>
      maxScore: number
      minter?: MinterLike
    }
  ) => {
    try {
      setMintStatus('capturing')
      setMintResult(null)

      // Check if wallet is connected
      if (!address) {
        throw new Error('Please connect your wallet to mint')
      }

      // Try to reuse existing IPFS data from database (cache)
      let imageCid: string | undefined
      let metadataCid: string | undefined

      try {
        const cacheRes = await fetch(`/api/mint/tree?fid=${params.rootUser.fid}`)
        if (cacheRes.ok) {
          const cacheData = await cacheRes.json()
          const record = cacheData?.data?.[0]
          if (record?.imageCid && record?.metadataCid) {
            imageCid = record.imageCid
            metadataCid = record.metadataCid
          }
        }
      } catch {
        // ignore cache errors, fall back to fresh upload
      }

      // If no cached IPFS data, capture and upload
      if (!imageCid || !metadataCid) {
        // Step 1: Capture SVG as image blob
        const imageBlob = await svgToImageBlob(svgElement)
        
        setMintStatus('uploading-image')
        
        // Step 2: Upload image to IPFS
        imageCid = await uploadImageToIPFS(imageBlob)
        
        setMintStatus('creating-metadata')
        
        // Step 3: Create metadata
        const metadataParams: TreeMetadataParams = {
          imageCid,
          rootUser: {
            fid: params.rootUser.fid,
            username: params.rootUser.username,
          },
          friends: params.friends.map(f => ({
            user: {
              fid: f.user.fid,
              username: f.user.username,
            },
            score: f.score,
          })),
          maxScore: params.maxScore,
        }
        const metadata = createTreeNFTMetadata(metadataParams)
        
        setMintStatus('uploading-metadata')
        
        // Step 4: Upload metadata to IPFS
        metadataCid = await uploadMetadataToIPFS(metadata)
      }

      if (!imageCid || !metadataCid) {
        throw new Error('Failed to prepare image/metadata for minting')
      }
      
      setMintStatus('preparing-transaction')

      // Decide who receives the NFT:
      // - Prefer Neynar primary.eth_address for the root user
      // - Fallback to first verified eth address
      // - Fallback to custody_address
      // - Finally, fallback to current connected wallet
      const recipientAddress =
        params.rootUser.verified_addresses?.primary?.eth_address ||
        (params.rootUser.verified_addresses?.eth_addresses &&
          params.rootUser.verified_addresses.eth_addresses[0]) ||
        params.rootUser.custody_address ||
        address

      if (!recipientAddress) {
        throw new Error('No valid recipient address found for this user')
      }
      
      // Step 5: Ask backend to generate signature & token URI (per NFT_MINTING_FLOW_DOCUMENTATION)
      const sigResponse = await fetch('/api/tree/generate-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fid: params.rootUser.fid,
          address: recipientAddress,
          metadataCid,
        }),
      })

      const sigData = await sigResponse.json()

      if (!sigResponse.ok || !sigData.success) {
        throw new Error(sigData.error || 'Failed to generate mint signature')
      }

      const tokenUri: string = sigData.tokenUri
      const signature: `0x${string}` = sigData.signature

      // Ensure we're on Base mainnet (chainId 8453)
      if (chainId !== base.id) {
        await switchChainAsync?.({ chainId: base.id })
      }

      if (!publicClient) {
        throw new Error('No public client available for blockchain interaction')
      }

      setMintStatus('minting')

      // Optionally read current mint price from contract (MINT_PRICE)
      const mintPrice = (await publicClient.readContract({
        address: ROOTSOFYOU_ADDRESS,
        abi: ROOTSOFYOU_ABI,
        functionName: 'MINT_PRICE',
      })) as bigint

      const txHash = await writeContractAsync({
        address: ROOTSOFYOU_ADDRESS,
        abi: ROOTSOFYOU_ABI,
        functionName: 'publicMint',
        args: [
          recipientAddress as `0x${string}`,
          BigInt(params.rootUser.fid),
          tokenUri,
          signature,
        ],
        value: mintPrice,
        chainId: base.id,
      })

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash: txHash })

      setMintStatus('saving')
      
      // Step 6: Save mint record to database with tx hash and token ID
      await saveMintRecord({
        userAddress: address,
        ownerAddress: recipientAddress,
        fid: params.rootUser.fid,
        imageCid,
        metadataCid,
        txHash,
        tokenId: String(params.rootUser.fid),
        minterFid: params.minter?.fid,
        minterUsername: params.minter?.username,
        minterPfpUrl: params.minter?.pfp_url,
      })
      
      setMintResult({
        imageCid,
        metadataCid,
        txHash,
        tokenId: String(params.rootUser.fid),
      })
      
      setMintStatus('success')
    } catch (error) {
      console.error('Minting error:', error)
      setMintStatus('error')

      let friendlyMessage = 'Unknown error occurred'

      if (error instanceof Error) {
        const message = error.message || ''
        const lower = message.toLowerCase()

        // Normalize common user-cancelled transaction messages from wallets/providers
        if (
          lower.includes('user rejected') ||
          lower.includes('user denied') ||
          lower.includes('user canceled') ||
          lower.includes('user cancelled') ||
          lower.includes('transaction rejected')
        ) {
          friendlyMessage = 'Transaction cancelled'
        } else {
          friendlyMessage = message
        }
      }

      setMintResult({
        error: friendlyMessage,
      })
    }
  }, [address, chainId, publicClient, switchChainAsync, writeContractAsync])

  const reset = useCallback(() => {
    setMintStatus('idle')
    setMintResult(null)
  }, [])

  return {
    mintStatus,
    mintResult,
    mintTree,
    reset,
  }
}



