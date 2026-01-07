'use client'

import { useFrame } from '@/components/farcaster-provider'
import { useQuery } from '@tanstack/react-query'
import { TreeVisualization } from './TreeVisualization'
import type { BestFriendsResponse, BulkUsersResponse } from '@/types/neynar'

interface RootsOfYouProps {
  userFid?: number
}

export function RootsOfYou({ userFid }: RootsOfYouProps) {
  const { context, actions } = useFrame()
  const fid = userFid || context?.user?.fid

  // Fetch best friends
  const {
    data: bestFriendsData,
    isLoading: isLoadingFriends,
    error: friendsError,
  } = useQuery<BestFriendsResponse>({
    queryKey: ['best-friends', fid],
    queryFn: async () => {
      if (!fid) throw new Error('FID is required')
      const response = await fetch(
        `/api/neynar/best-friends?fid=${fid}&limit=12`,
      )
      if (!response.ok) {
        throw new Error('Failed to fetch best friends')
      }
      return response.json()
    },
    enabled: !!fid,
  })

  // Extract FIDs from best friends
  const friendFids =
    bestFriendsData?.users.map((friend) => friend.fid.toString()).join(',') ||
    ''

  // Fetch bulk user data
  const {
    data: bulkUsersData,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<BulkUsersResponse>({
    queryKey: ['bulk-users', friendFids],
    queryFn: async () => {
      if (!friendFids) throw new Error('No friend FIDs available')
      const response = await fetch(`/api/neynar/users/bulk?fids=${friendFids}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }
      return response.json()
    },
    enabled: !!friendFids && bestFriendsData !== undefined,
  })

  // Combine best friends data with user profiles
  const friendsWithProfiles =
    bestFriendsData?.users
      .map((friend) => {
        const userProfile = bulkUsersData?.users.find(
          (u) => u.fid === friend.fid,
        )
        return {
          user: userProfile || {
            object: 'user',
            fid: friend.fid,
            username: friend.username,
            display_name: friend.username,
            pfp_url: '',
            custody_address: '',
            follower_count: 0,
            following_count: 0,
          } as BulkUsersResponse['users'][0],
          score: friend.mutual_affinity_score,
          rank: bestFriendsData.users.indexOf(friend) + 1,
        }
      })
      .sort((a, b) => b.score - a.score) || []

  // Calculate total mutual affinity score
  const totalMutualAffinityScore = friendsWithProfiles.reduce(
    (sum, friend) => sum + friend.score,
    0,
  )

  const handleNodeClick = (fid: number) => {
    if (actions?.viewProfile) {
      actions.viewProfile({ fid })
    }
  }

  if (!fid) {
    return (
      <div className="w-screen  h-screen rounded-2xl overflow-hidden border-2 border-[#4d7c36]/30 shadow-2xl bg-gradient-to-b from-[#fff8f0] to-[#fdf5e6]">
        <p className="text-lg">Please connect your Farcaster account to view your roots</p>
      </div>
    )
  }

  // Show growing tree animation while loading
  if (isLoadingFriends || isLoadingUsers) {
    return (
      <div className="w-screen  h-screen rounded-2xl overflow-hidden border-2 border-[#4d7c36]/30 shadow-2xl bg-gradient-to-b from-[#fff8f0] to-[#fdf5e6]">
        <TreeVisualization
          rootUser={{
            fid: fid,
            username: context?.user?.username || 'You',
            pfp_url: context?.user?.pfpUrl,
          }}
          friends={[]} // Empty friends array for skeleton tree
          totalMutualAffinityScore={0}
          onNodeClick={handleNodeClick}
          isLoading={true}
        />
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <p className="text-[#5D4037] 
        font-semibold text-lg bg-white/80 backdrop-blur px-6 py-3 rounded-full shadow-lg">
            Growing your tree...
          </p>
        </div>
      </div>
    )
  }

  if (friendsError || usersError) {
    return (
      <div className="w-screen  h-screen rounded-2xl overflow-hidden border-2 border-[#4d7c36]/30 shadow-2xl bg-gradient-to-b from-[#fff8f0] to-[#fdf5e6]">
        <div className="text-center">
          <p className="text-red-500 mb-2 font-semibold text-lg">Error growing tree</p>
          <p className="text-sm text-gray-600">
            {friendsError instanceof Error
              ? friendsError.message
              : usersError instanceof Error
                ? usersError.message
                : 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-screen  h-screen  overflow-hidden border-2 border-[#4d7c36]/30 shadow-2xl bg-gradient-to-b from-[#fff8f0] to-[#fdf5e6]">
      <TreeVisualization
        rootUser={{
          fid: fid,
          username: context?.user?.username || 'You',
          pfp_url: context?.user?.pfpUrl,
        }}
        friends={friendsWithProfiles}
        totalMutualAffinityScore={totalMutualAffinityScore}
        onNodeClick={handleNodeClick}
        isLoading={false}
        onOpenSea={(url) => {
          if (actions?.openUrl) {
            actions.openUrl(url)
          } else {
            window.open(url, '_blank')
          }
        }}
        onShare={async ({ imageCid, mintedByMe, minterUsername }) => {
          const websiteUrl =
            typeof window !== 'undefined' ? window.location.origin : 'https://rootsofyou.xyz'
          const imageUrl = imageCid
            ? `https://gateway.pinata.cloud/ipfs/${imageCid}`
            : ''

          let text: string
          const username = context?.user?.username || ''

          if (mintedByMe) {
            text = `I just minted my Roots of You tree — a living map of my Farcaster friendships.\n\nGrow and mint your own tree.`
          } else if (minterUsername) {
            text = `My Roots of You tree was minted by @${minterUsername} — mapping the friendships around @${username}. Grow and mint your own tree:`
          } else {
            text = `Here’s my Roots of You tree for @${username} — a living map of my Farcaster friendships. Grow and mint your own tree:`
          }

          // Tag top 5 friends at the end of the cast
          const topFriendsTags =
            friendsWithProfiles
              .slice(0, 5)
              .map((f) => (f.user?.username ? `@${f.user.username}` : ''))
              .filter(Boolean)
              .join(' ') || ''

          const finalText = topFriendsTags ? `${text}\n\n${topFriendsTags}` : text

          try {
            await actions?.composeCast?.({
              text: finalText,
              embeds: [websiteUrl, imageUrl || ''],
            })
            
            // Track successful share in localStorage
            if (typeof window !== 'undefined' && context?.user?.fid) {
              try {
                const shareData = {
                  fid: context.user.fid,
                  timestamp: Date.now(),
                  imageCid: imageCid || null,
                }
                localStorage.setItem('treeShared', JSON.stringify(shareData))
                console.log('Tree share tracked successfully')
              } catch (error) {
                console.error('Failed to track tree share:', error)
              }
            }
          } catch (error) {
            console.error('Failed to share tree:', error)
            throw error
          }
        }}
      />
    </div>
  )
}
