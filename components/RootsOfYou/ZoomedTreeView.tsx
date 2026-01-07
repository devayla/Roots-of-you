'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { NeynarUser, BestFriendsResponse } from '@/types/neynar'
import { FriendNode } from './FriendNode'
import { useMintTreeNFT } from '@/hooks/useMintTreeNFT'
import { MintStatus } from './MintStatus'
import { useFrame } from '@/components/farcaster-provider'
import { UserDetailModal } from './UserDetailModal'

interface ZoomedTreeViewProps {
  user: NeynarUser
  onClose: () => void
  onLeafClick: (user: NeynarUser) => void
  onViewProfile: (fid: number) => void
  mainAccountFriends?: Array<{ user: NeynarUser; score: number }> // Main account's friend list
  viewer?: {
    fid: number
    username: string
    pfp_url?: string
  }
}

export function ZoomedTreeView({
  user,
  onClose,
  onLeafClick,
  onViewProfile,
  mainAccountFriends = [],
  viewer,
}: ZoomedTreeViewProps) {
  const [friends, setFriends] = useState<Array<{ user: NeynarUser; score: number; rank: number }>>([])
  const [loading, setLoading] = useState(true)
  const svgRef = useRef<SVGSVGElement>(null)
  const { mintStatus, mintResult, mintTree, reset } = useMintTreeNFT()
  const { actions } = useFrame()
  const [mintRecord, setMintRecord] = useState<null | {
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
  }>(null)
  const [localMintSuccess, setLocalMintSuccess] = useState(false)
  const [zoomedRootUser, setZoomedRootUser] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [rootUserData, setRootUserData] = useState<NeynarUser | null>(null)
  const [loadingUserData, setLoadingUserData] = useState(false)
  
  // Check if current user is in main account's friend list
  const isInMainFriendList = mainAccountFriends.some(f => f.user.fid === user.fid)

  // Fetch existing mint record for this root fid (friend)
  useEffect(() => {
    let cancelled = false
    async function fetchMintRecord() {
      try {
        const res = await fetch(`/api/mint/tree?fid=${user.fid}`)
        if (!res.ok) return
        const data = await res.json()
        const record = data?.data?.[0] ?? null
        if (!cancelled) setMintRecord(record)
      } catch {
        // ignore
      }
    }
    fetchMintRecord()
    return () => {
      cancelled = true
    }
  }, [user.fid])

  // Track local mint success so UI updates immediately and persists after closing status modal
  useEffect(() => {
    if (mintStatus === 'success') {
      setLocalMintSuccess(true)
    }
  }, [mintStatus])

  // Reset when switching to a different friend tree
  useEffect(() => {
    setLocalMintSuccess(false)
  }, [user.fid])

  const hasMintRecord = !!mintRecord || localMintSuccess
  const mintedByViewer =
    (!!mintRecord?.minterFid && !!viewer && mintRecord.minterFid === viewer.fid) ||
    (localMintSuccess && !!viewer?.fid)

  const handleRootUserClick = async () => {
    if (loading || zoomedRootUser) return

    setZoomedRootUser(true)

    // Start loading user data (cached)
    setLoadingUserData(true)
    try {
      const res = await fetch(`/api/user/cache?fid=${user.fid}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          setRootUserData(data.data as NeynarUser)
        } else {
          // Fallback to passed-in user if cache fetch fails
          setRootUserData(user)
        }
      } else {
        setRootUserData(user)
      }
    } catch {
      setRootUserData(user)
    } finally {
      setLoadingUserData(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    async function fetchFriends() {
      try {
        setLoading(true)
        
        // Fetch best friends
        const friendsRes = await fetch(`/api/neynar/best-friends?fid=${user.fid}&limit=12`)
        if (!friendsRes.ok) throw new Error('Failed to fetch friends')
        const friendsData: BestFriendsResponse = await friendsRes.json()

        // Fetch user details for friends
        if (friendsData.users.length > 0) {
          const fids = friendsData.users.map(u => u.fid).join(',')
          const bulkRes = await fetch(`/api/neynar/users/bulk?fids=${fids}`)
          if (!bulkRes.ok) throw new Error('Failed to fetch bulk users')
          const bulkData = await bulkRes.json()
          
          if (isMounted) {
            const usersMap = new Map<number, NeynarUser>(bulkData.users.map((u: NeynarUser) => [u.fid, u]))
            
            const processedFriends = friendsData.users
              .map((f, index) => {
                const friendUser = usersMap.get(f.fid)
                if (!friendUser) return null
                return {
                  user: friendUser,
                  score: f.mutual_affinity_score,
                  rank: index + 1
                }
              })
              .filter((f): f is { user: NeynarUser; score: number; rank: number } => f !== null)
            
            setFriends(processedFriends)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchFriends()

    return () => {
      isMounted = false
    }
  }, [user.fid])

  // Fixed coordinates
  const width = 1100
  const height = 900
  const treeBaseX = width / 2
  const treeBaseY = height - 100
  const trunkHeight = 180
  const branchingPointY = treeBaseY - trunkHeight

  const layoutSlots = [
    { x: 0, y: -350, rot: 0 },
    { x: -100, y: -280, rot: -20 },
    { x: 100, y: -280, rot: 20 },
    { x: -200, y: -220, rot: -45 },
    { x: 200, y: -220, rot: 45 },
    { x: -280, y: -120, rot: -60 },
    { x: 280, y: -120, rot: 60 },
    { x: -160, y: -100, rot: -30 },
    { x: 160, y: -100, rot: 30 },
    { x: -320, y: 0, rot: -80 },
    { x: 320, y: 0, rot: 80 },
    { x: 0, y: -180, rot: 0 },
  ]

  const friendsWithProfiles = friends
      .sort((a, b) => b.score - a.score) || []

  const maxScore = Math.max(...friendsWithProfiles.map((f) => f.score)) || 1

  const placedFriends = friendsWithProfiles.slice(0, layoutSlots.length).map((friend, i) => {
    const slot = layoutSlots[i]
    return {
      ...friend,
      x: treeBaseX + slot.x,
      y: branchingPointY + slot.y,
      rotation: slot.rot,
      slot
    }
  })

  const barkColor = "#5D4037"
  const barkDark = "#3E2723"
  const barkLight = "#795548"

  const handleShareFriendTree = async () => {
    if (!actions?.composeCast || !viewer) return

    const cidToShare = mintRecord?.imageCid || mintResult?.imageCid
    const websiteUrl =
      typeof window !== 'undefined' ? window.location.origin : 'https://rootsofyou.xyz'
    const imageUrl = cidToShare
      ? `https://gateway.pinata.cloud/ipfs/${cidToShare}`
      : ''

    const friendUsername = user.username

    // Build base share text
    let text = `@${friendUsername} I just minted your Roots of You tree — a living map of your Farcaster friendships.\n\nGrow and mint your own tree.`

    // Tag top 5 friends from this friend's tree
    const topFriendsTags =
      friends
        .slice()
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((f) => (f.user?.username ? `@${f.user.username}` : ''))
        .filter(Boolean)
        .join(' ') || ''

    if (topFriendsTags) {
      text = `${text}\n\n${topFriendsTags}`
    }

    await actions.composeCast({
      text,
      embeds: [websiteUrl, imageUrl || ''],
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-white" // Solid background to cover previous tree
    >
      <div className="relative w-full h-full bg-gradient-to-b from-[#e0f7fa] via-[#f1f8e9] to-[#fff3e0] overflow-hidden">
        
        {/* Environment - same as main tree */}
        <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay bg-gradient-to-br from-white/80 via-transparent to-transparent z-10" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {[...Array(15)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute rounded-full bg-yellow-200 blur-sm opacity-60"
                initial={{
                x: Math.random() * 100 + "%",
                y: Math.random() * 100 + "%",
                scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                y: [null, Math.random() * 100 + "%"],
                x: [null, Math.random() * 100 + "%"],
                opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                ease: "linear",
                }}
                style={{
                width: Math.random() * 6 + 2 + "px",
                height: Math.random() * 6 + 2 + "px",
                }}
            />
            ))}
        </div>

        {/* Navigation & Controls */}
        <div className="absolute top-4 left-4 z-50 flex gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/80 backdrop-blur shadow-lg rounded-full text-gray-800 font-bold hover:bg-white transition-all flex items-center gap-2 border border-gray-200"
          >
            <span>← Back</span>
          </button>
        </div>

        {/* Root User Info Header */}
        <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-3 pointer-events-none">
           <div className="flex items-center gap-3 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-gray-200 pointer-events-auto cursor-pointer hover:scale-105 transition-transform" onClick={() => onViewProfile(user.fid)}>
             <div className="text-right">
                <div className="font-bold text-gray-900">{user.display_name}</div>
                <div className="text-xs text-gray-500">@{user.username}</div>
             </div>
             {user.pfp_url && <img src={user.pfp_url} alt={user.username} className="w-10 h-10 rounded-full border-2 border-[#5D4037]" />}
           </div>
        </div>

        {loading ? (
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5D4037]"></div>
           </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full block relative z-10"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="barkGradientZ" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={barkDark} />
                <stop offset="30%" stopColor={barkColor} />
                <stop offset="60%" stopColor={barkLight} />
                <stop offset="100%" stopColor={barkDark} />
              </linearGradient>
              <filter id="barkTextureZ">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.4" />
                </feComponentTransfer>
                <feComposite operator="in" in2="SourceGraphic" />
                <feMerge>
                    <feMergeNode in="SourceGraphic" />
                    <feMergeNode />
                </feMerge>
              </filter>
              <clipPath id="root-user-clip-z">
                 <circle r={42} />
              </clipPath>
            </defs>

            {/* --- ROOTS --- */}
            <g stroke={barkColor} fill="none" strokeWidth="4" strokeLinecap="round" opacity="0.8">
                <path d={`M${treeBaseX - 30},${treeBaseY + 10} Q${treeBaseX - 60},${treeBaseY + 40} ${treeBaseX - 100},${treeBaseY + 50}`} />
                <path d={`M${treeBaseX + 30},${treeBaseY + 10} Q${treeBaseX + 60},${treeBaseY + 40} ${treeBaseX + 100},${treeBaseY + 50}`} />
                <path d={`M${treeBaseX},${treeBaseY + 20} Q${treeBaseX - 20},${treeBaseY + 60} ${treeBaseX - 10},${treeBaseY + 80}`} />
                <path d={`M${treeBaseX + 10},${treeBaseY + 20} Q${treeBaseX + 30},${treeBaseY + 60} ${treeBaseX + 40},${treeBaseY + 80}`} />
            </g>

            {/* --- TREE --- */}
            <g stroke="url(#barkGradientZ)" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {/* Trunk */}
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                d={`M${treeBaseX - 35},${treeBaseY + 20} 
                   Q${treeBaseX - 25},${treeBaseY - 50} ${treeBaseX - 20},${branchingPointY} 
                   L${treeBaseX + 20},${branchingPointY} 
                   Q${treeBaseX + 25},${treeBaseY - 50} ${treeBaseX + 35},${treeBaseY + 20} Z`}
                fill="url(#barkGradientZ)"
                stroke="none"
                filter="url(#barkTextureZ)"
              />

              {/* Branches */}
              {placedFriends.map((pf, i) => {
                const startX = treeBaseX
                const startY = branchingPointY
                const endX = pf.x
                const endY = pf.y

                const normalizedScore = (pf.score - Math.min(...placedFriends.map(f => f.score))) / 
                                       (Math.max(...placedFriends.map(f => f.score)) - Math.min(...placedFriends.map(f => f.score)) || 1)
                const branchThickness = 6 + normalizedScore * 14
                
                // Organic branching logic (replicated)
                let controlX1, controlY1, controlX2, controlY2;
                if (Math.abs(pf.slot.x) < 20) {
                    const curveDir = i % 2 === 0 ? 1 : -1
                    controlX1 = startX + 20 * curveDir
                    controlY1 = startY - (startY - endY) * 0.4
                    controlX2 = endX + 10 * curveDir
                    controlY2 = endY + 40
                } else if (pf.slot.x < 0) {
                    controlX1 = startX - 50
                    controlY1 = startY - 80
                    controlX2 = endX + 20
                    controlY2 = endY + 20
                } else {
                    controlX1 = startX + 50
                    controlY1 = startY - 80
                    controlX2 = endX - 20
                    controlY2 = endY + 20
                }
                
                const swayDuration = 4 + Math.random() * 2

                return (
                  <motion.path
                    key={`branch-z-${i}`}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ 
                        pathLength: 1, 
                        opacity: 1,
                        d: [
                            `M${startX},${startY} C${controlX1},${controlY1} ${controlX2},${controlY2} ${endX},${endY}`,
                            `M${startX},${startY} C${controlX1 + (pf.slot.x<0?-5:5)},${controlY1} ${controlX2 + (pf.slot.x<0?-5:5)},${controlY2} ${endX + (pf.slot.x<0?-8:8)},${endY}`,
                            `M${startX},${startY} C${controlX1},${controlY1} ${controlX2},${controlY2} ${endX},${endY}`
                        ] 
                    }}
                    transition={{ 
                        pathLength: { duration: 0.8, delay: 0.5 + i * 0.1 },
                        d: { duration: swayDuration, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }
                    }}
                    strokeWidth={branchThickness}
                    filter="url(#barkTextureZ)"
                  />
                )
              })}
            </g>

            {/* --- ROOT USER (ZOOMED CONTEXT) --- */}
            <g transform={`translate(${treeBaseX}, ${treeBaseY - 20})`}>
              <motion.g
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                onClick={handleRootUserClick}
                onMouseEnter={(e) => {
                  e.currentTarget.style.cursor = 'pointer'
                  e.currentTarget.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.cursor = 'default'
                  e.currentTarget.style.opacity = '1'
                }}
              >
                {/* Clickable root circle */}
                <circle
                  cx={0}
                  cy={0}
                  r={52}
                  fill={barkDark}
                
                />
                <circle cx={0} cy={0} r={48} fill={barkLight} />
                {user.pfp_url ? (
                  <image
                    href={user.pfp_url}
                    x={-45}
                    y={-45}
                    width={90}
                    height={90}
                    clipPath="url(#root-user-clip-z)"
                    pointerEvents="none"
                  />
                ) : (
                  <text
                    x={0}
                    y={0}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#efebe9"
                    fontWeight="bold"
                    fontSize="24"
                    pointerEvents="none"
                  >
                    {user.username.slice(0, 2).toUpperCase()}
                  </text>
                )}
                <circle
                  cx={0}
                  cy={0}
                  r={48}
                  fill="none"
                  stroke={barkDark}
                  strokeWidth="2"
                  opacity="0.5"
                  pointerEvents="none"
                />

                {/* Username label - dynamic width based on text length */}
                <g transform="translate(0, 65)" pointerEvents="none">
                  {(() => {
                    const minWidth = 120
                    const charWidth = 12 // approximate width per character
                    const padding = 24 // left + right padding
                    const labelWidth = Math.max(minWidth, user.username.length * charWidth + padding)
                    const labelHeight = 28
                    return (
                      <>
                        <rect
                          x={-labelWidth / 2}
                          y={-labelHeight / 2}
                          width={labelWidth}
                          height={labelHeight}
                          rx={6}
                          fill="rgba(255,255,255,0.9)"
                          stroke={barkColor}
                          strokeWidth="1"
                        />
                        <text
                          x={0}
                          y={6}
                          textAnchor="middle"
                          fill={barkDark}
                          fontWeight="bold"
                          fontSize={22}
                        >
                          {user.username}
                        </text>
                      </>
                    )
                  })()}
                </g>
              </motion.g>
            </g>

            {/* --- LEAVES --- */}
            {placedFriends.map((friend, i) => {
                 const swayDuration = 4 + (i % 3)
                 const swayAmount = friend.slot.x < 0 ? -8 : 8

                return (
                  <motion.g
                    key={`leaf-z-${friend.user.fid}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                        scale: 1, 
                        opacity: 1,
                        x: [0, swayAmount, 0]
                    }}
                    transition={{ 
                        scale: { delay: 1 + i * 0.1, type: "spring" },
                        x: { duration: swayDuration, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }
                    }}
                  >
                    <FriendNode
                      user={friend.user}
                      score={friend.score}
                      maxScore={maxScore}
                      rank={friend.rank}
                      x={friend.x}
                      y={friend.y}
                      rotation={friend.rotation}
                      onNodeClick={(clickedUser) => onLeafClick(clickedUser)}
                    />
                  </motion.g>
                )
            })}
          </svg>
        )}

        {/* Root User Zoom Animation Overlay */}
        <AnimatePresence>
          {zoomedRootUser && (
            <>
              {/* Backdrop during zoom */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md z-30"
              />

              {/* Zoom Animation - Root user zooms to center */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
              >
                <motion.div
                  initial={{
                    scale: 0.2,
                    opacity: 0.3,
                  }}
                  animate={{
                    scale: 3,
                    opacity: 1,
                  }}
                  transition={{
                    duration: 1,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  onAnimationComplete={() => {
                    setTimeout(() => {
                      setShowUserModal(true)
                      setZoomedRootUser(false)
                    }, 400)
                  }}
                  style={{ transformOrigin: 'center' }}
                >
                  <svg
                    width={300}
                    height={300}
                    viewBox="0 0 300 300"
                    className="drop-shadow-2xl"
                    style={{ overflow: 'visible' }}
                  >
                    <g transform="translate(150, 150)">
                      <circle cx={0} cy={0} r={52} fill={barkDark} />
                      <circle cx={0} cy={0} r={48} fill={barkLight} />
                      {user.pfp_url ? (
                        <image
                          href={user.pfp_url}
                          x={-45}
                          y={-45}
                          width={90}
                          height={90}
                          clipPath="url(#root-user-clip-z)"
                        />
                      ) : (
                        <text
                          x={0}
                          y={0}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#efebe9"
                          fontWeight="bold"
                          fontSize="24"
                        >
                          {user.username.slice(0, 2).toUpperCase()}
                        </text>
                      )}
                      <circle cx={0} cy={0} r={48} fill="none" stroke={barkDark} strokeWidth="2" opacity="0.5" />
                    </g>
                  </svg>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mint Button - Only show if user is in main account's friend list and not already minted */}
        {!loading && friends.length > 0 && isInMainFriendList && !hasMintRecord && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              if (svgRef.current) {
                await mintTree(svgRef.current, {
                  rootUser: user,
                  friends: friends.map(f => ({
                    user: f.user,
                    score: f.score,
                  })),
                  maxScore,
                  minter: viewer
                })
              }
            }}
            disabled={mintStatus !== 'idle' && mintStatus !== 'error'}
            className="absolute bottom-3 right-4 z-40 px-6 py-3 rounded-full bg-gradient-to-r from-[#4d7c36] to-[#5D4037] text-white font-semibold shadow-lg hover:shadow-xl transition-all border-2 border-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 pointer-events-auto"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
              <line x1="7" y1="11" x2="17" y2="11" />
              <line x1="12" y1="7" x2="12" y2="15" />
            </svg>
            Mint Tree(Free)
          </motion.button>
        )}

        {/* Already Minted State for friend tree (Zoomed view) */}
        {!loading && hasMintRecord && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 right-4 z-40 flex flex-col items-end gap-2"
          >
            <div className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur shadow-lg border border-[#5D4037]/10 max-w-xs">
              {mintRecord?.minterUsername && mintRecord.minterFid ? (
                <button
                  type="button"
                  onClick={() => onViewProfile(mintRecord.minterFid!)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {mintRecord.minterPfpUrl && (
                    <img
                      src={mintRecord.minterPfpUrl}
                      alt={mintRecord.minterUsername}
                      className="w-6 h-6 rounded-full border border-[#5D4037]/20"
                    />
                  )}
                  <span className="text-xs font-semibold text-[#5D4037] underline-offset-2 hover:underline">
                    Tree already minted<br/>by @{mintRecord.minterUsername}
                  </span>
                </button>
              ) : (
                <p className="text-xs font-semibold text-[#5D4037]">
                  Tree already minted.
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Share button when viewer minted this friend's tree */}
        {!loading && hasMintRecord && mintedByViewer && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShareFriendTree}
            className="absolute bottom-4 left-4 z-40 px-4 py-2 rounded-full bg-white/90 text-[#5D4037] text-xs font-semibold shadow-md border border-[#5D4037]/20 flex items-center gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.59 13.51l6.83 3.98" />
              <path d="M15.41 6.51L8.59 10.49" />
            </svg>
            <span>Share this tree</span>
          </motion.button>
        )}

        {/* Mint Status Modal (share-only in zoom view) */}
        <MintStatus
          status={mintStatus}
          result={mintResult}
          onClose={() => {
            reset()
          }}
          onShare={handleShareFriendTree}
        />

        {/* Root User Detail Modal */}
        {rootUserData && (
          <UserDetailModal
            user={rootUserData}
            isOpen={showUserModal}
            onClose={() => {
              setShowUserModal(false)
            }}
            onViewProfile={(fid) => {
              onViewProfile(fid)
              setShowUserModal(false)
            }}
          />
        )}
      </div>
    </motion.div>
  )
}
