'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGift, faExclamation, faShareNodes, faRocket,faTimes } from '@fortawesome/free-solid-svg-icons'
import type { NeynarUser } from '@/types/neynar'
import { FriendNode } from './FriendNode'
import { ZoomedTreeView } from './ZoomedTreeView'
import { TreeTutorial } from './TreeTutorial'
import { FriendDetailModal } from './FriendDetailModal'
import { UserDetailModal } from './UserDetailModal'
import { useMintTreeNFT } from '@/hooks/useMintTreeNFT'
import { MintStatus } from './MintStatus'
import { ROOTSOFYOU_ADDRESS } from '@/contract/rootsofyou-abi'
import GiftBox from '@/components/GiftBox'
import { useMiniAppContext } from '@/hooks/use-miniapp-context'

interface TreeVisualizationProps {
  rootUser: {
    fid: number
    username: string
    pfp_url?: string
  }
  friends: Array<{
    user: NeynarUser
    score: number
    rank: number
  }>
  totalMutualAffinityScore?: number
  onNodeClick: (fid: number) => void
  isLoading?: boolean
  onOpenSea?: (url: string) => void
  onShare?: (opts: { imageCid?: string; mintedByMe: boolean; minterUsername?: string }) => void
}

export function TreeVisualization({
  rootUser,
  friends,
  totalMutualAffinityScore = 0,
  onNodeClick: externalNodeClick,
  isLoading = false,
  onOpenSea,
  onShare,
}: TreeVisualizationProps) {
  const [selectedUser, setSelectedUser] = useState<NeynarUser | null>(null)
  const [zoomedUser, setZoomedUser] = useState<{ user: NeynarUser; x: number; y: number } | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<{ user: NeynarUser; score: number } | null>(null)
  const [showFriendModal, setShowFriendModal] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [zoomedRootUser, setZoomedRootUser] = useState<boolean>(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [rootUserData, setRootUserData] = useState<NeynarUser | null>(null)
  const [loadingUserData, setLoadingUserData] = useState(false)
  const [showGiftBox, setShowGiftBox] = useState(false)
  const [showPartyFrameModal, setShowPartyFrameModal] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const { mintStatus, mintResult, mintTree, reset } = useMintTreeNFT()
  // const { actions } = useMiniAppContext()
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
  const { context, actions } = useMiniAppContext()

  // Auto-open tutorial on first visit using localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const seen = window.localStorage.getItem('roots_of_you_tutorial_seen')
      if (!seen) {
        setShowTutorial(true)
      }
    } catch {
      // ignore localStorage errors
    }
  }, [])

  // Fetch existing mint record for this root fid
  useEffect(() => {
    let cancelled = false
    async function fetchMintRecord() {
      try {
        const res = await fetch(`/api/mint/tree?fid=${rootUser.fid}`)
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
  }, [rootUser.fid])

  // Track local mint success so UI updates immediately and persists after closing status modal
  useEffect(() => {
    if (mintStatus === 'success') {
      setLocalMintSuccess(true)
    }
  }, [mintStatus])

  // Reset local success when viewing a different root user
  useEffect(() => {
    setLocalMintSuccess(false)
  }, [rootUser.fid])

  const hasMintRecord = !!mintRecord || localMintSuccess
  const mintedByMe =
    (mintRecord?.minterFid && mintRecord.minterFid === rootUser.fid) ||
    localMintSuccess
  const mintedByOther =
    mintRecord && mintRecord.minterFid && mintRecord.minterFid !== rootUser.fid

  const handleOpenSeaClick = () => {
    const fidTokenId = rootUser.fid
    const url = `https://opensea.io/assets/base/${ROOTSOFYOU_ADDRESS}/${fidTokenId}`
    onOpenSea?.(url)
  }

  const handleShareClick = async () => {
    const cidToShare = mintRecord?.imageCid || mintResult?.imageCid
    try {
      await onShare?.({
        imageCid: cidToShare,
        mintedByMe,
        minterUsername: mintedByOther ? mintRecord?.minterUsername : undefined,
      })
      // Share tracking is handled in RootsOfYou.tsx onShare callback
    } catch (error) {
      console.error('Failed to share tree:', error)
    }
  }

  const handleCloseTutorial = () => {
    setShowTutorial(false)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('roots_of_you_tutorial_seen', '1')
      } catch {
        // ignore storage errors
      }
    }
  }

  const handleRootUserClick = async () => {
    if (isLoading || isAnimating || zoomedRootUser) return
    
    setIsAnimating(true)
    setZoomedRootUser(true)

    // Fetch user data from cache API
    setLoadingUserData(true)
    try {
      const res = await fetch(`/api/user/cache?fid=${rootUser.fid}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          setRootUserData(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    } finally {
      setLoadingUserData(false)
    }
  }

  // Use a fixed coordinate system for the SVG
  const width = 1050
  const height = 900
  
  // Base of the tree
  const treeBaseX = width / 2
  const treeBaseY = height - 100

  // Tree dimensions
  const trunkHeight = 180
  const branchingPointY = treeBaseY - trunkHeight

  // Define slots for leaves - distributed for a canopy look
  const layoutSlots = [
    { x: 0, y: -350, rot: 0 },         // Top Center
    { x: -100, y: -280, rot: -20 },    // Top Left Inner
    { x: 100, y: -280, rot: 20 },      // Top Right Inner
    { x: -200, y: -220, rot: -45 },    // Top Left Outer
    { x: 200, y: -220, rot: 45 },      // Top Right Outer
    { x: -280, y: -120, rot: -60 },    // Mid Left
    { x: 280, y: -120, rot: 60 },      // Mid Right
    { x: -160, y: -100, rot: -30 },    // Mid Left Inner
    { x: 160, y: -100, rot: 30 },      // Mid Right Inner
    { x: -320, y: 0, rot: -80 },       // Low Left
    { x: 320, y: 0, rot: 80 },         // Low Right
    { x: 0, y: -180, rot: 0 },         // Center Heart
  ]

  const maxScore = Math.max(...friends.map((f) => f.score)) || 1
  
  // Map friends to slots
  const placedFriends = friends.slice(0, layoutSlots.length).map((friend, i) => {
    const slot = layoutSlots[i]
    return {
      ...friend,
      x: treeBaseX + slot.x,
      y: branchingPointY + slot.y,
      rotation: slot.rot,
      slot
    }
  })

  // Natural Tree Colors
  const barkColor = "#5D4037" // Saddle Brown
  const barkDark = "#3E2723"
  const barkLight = "#795548"

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#e0f7fa] via-[#f1f8e9] to-[#fff3e0] overflow-hidden min-h-[600px] font-sans">
      {/* Info Icon Button */}
      <button
        onClick={() => setShowTutorial(true)}
        className="absolute top-14 left-4 z-40 w-12 h-12 rounded-full bg-white/90 backdrop-blur-lg shadow-lg flex items-center justify-center text-[#5D4037] hover:bg-white hover:scale-110 transition-all border-2 border-[#5D4037]/20 group"
        aria-label="Show tree information"
      >
        <motion.svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </motion.svg>
      </button>

      {/* Mint Button */}
   

      {/* Tutorial Overlay */}
      <TreeTutorial
        isOpen={showTutorial}
        onClose={handleCloseTutorial}
      />

      {/* Dynamic Lighting / Sunshafts */}
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay bg-gradient-to-br from-white/80 via-transparent to-transparent z-10" />
      
      {/* Floating Particles / Pollen */}
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

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full block relative z-10"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Wood texture gradient */}
          <linearGradient id="barkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={barkDark} />
            <stop offset="30%" stopColor={barkColor} />
            <stop offset="60%" stopColor={barkLight} />
            <stop offset="100%" stopColor={barkDark} />
          </linearGradient>
          
          {/* Root user gradient */}
          <radialGradient id="rootUserGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor={barkLight} />
            <stop offset="100%" stopColor={barkDark} />
          </radialGradient>
          
          {/* Texture filter */}
          <filter id="barkTexture">
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
          
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <clipPath id="root-user-clip">
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

        {/* --- TREE STRUCTURE --- */}
        <g stroke="url(#barkGradient)" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Trunk */}
          <motion.path 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            d={`M${treeBaseX - 35},${treeBaseY + 20} 
               Q${treeBaseX - 25},${treeBaseY - 50} ${treeBaseX - 20},${branchingPointY} 
               L${treeBaseX + 20},${branchingPointY} 
               Q${treeBaseX + 25},${treeBaseY - 50} ${treeBaseX + 35},${treeBaseY + 20} Z`}
            fill="url(#barkGradient)"
            stroke="none"
            filter="url(#barkTexture)"
          />
          
          {/* Branches connecting to leaves */}
          {placedFriends.map((pf, i) => {
            const startX = treeBaseX
            const startY = branchingPointY
            const endX = pf.x
            const endY = pf.y
            
            // Calculate branch thickness based on score
            const normalizedScore = (pf.score - Math.min(...placedFriends.map(f => f.score))) / 
                                   (Math.max(...placedFriends.map(f => f.score)) - Math.min(...placedFriends.map(f => f.score)) || 1)
            const branchThickness = 6 + normalizedScore * 14

            // Organic branching logic
            // Divide into left, right, and center clusters
            let controlX1, controlY1, controlX2, controlY2;

            if (Math.abs(pf.slot.x) < 20) {
                // Center branch - curve slightly for organic look
                const curveDir = i % 2 === 0 ? 1 : -1
                controlX1 = startX + 20 * curveDir
                controlY1 = startY - (startY - endY) * 0.4
                controlX2 = endX + 10 * curveDir
                controlY2 = endY + 40
            } else if (pf.slot.x < 0) {
                // Left branches
                // Curve outwards
                controlX1 = startX - 50
                controlY1 = startY - 80
                controlX2 = endX + 20
                controlY2 = endY + 20
            } else {
                // Right branches
                controlX1 = startX + 50
                controlY1 = startY - 80
                controlX2 = endX - 20
                controlY2 = endY + 20
            }
            
            // Branch sway animation
            const swayDuration = 4 + Math.random() * 2
            
            return (
              <motion.path
                key={`branch-${i}`}
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
                filter="url(#barkTexture)"
              />
            )
          })}
        </g>

        {/* --- ROOT USER (TRUNK BASE HOLLOW/KNOT) --- */}
        <g transform={`translate(${treeBaseX}, ${treeBaseY - 20})` }>
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
            {/* Clickable area - only on the circle, not the label */}
            <circle 
              cx={0} 
              cy={0} 
              r={52} 
              fill={barkDark}
             
             
            />
            <circle cx={0} cy={0} r={48} fill={barkLight} />
            
            {rootUser.pfp_url ? (
              <image 
                href={rootUser.pfp_url} 
                x={-45} 
                y={-45} 
                width={90} 
                height={90} 
                clipPath="url(#root-user-clip)"
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
                {rootUser.username.slice(0,2).toUpperCase()}
              </text>
            )}
            
            {/* Organic rim overlay to look like wood */}
            <circle cx={0} cy={0} r={48} fill="none" stroke={barkDark} strokeWidth="2" opacity="0.5" pointerEvents="none" />
            
            {/* Total Mutual Affinity Score Badge - Top Right */}
            {totalMutualAffinityScore > 0 && (
              <g transform="translate(35, -35)" pointerEvents="none">
                <defs>
                  <linearGradient id="badgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffd700" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#ff8c00" stopOpacity="0.95" />
                  </linearGradient>
                  <filter id="badgeShadow">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.3" />
                  </filter>
                  <filter id="badgeGlow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Badge background circle */}
                <motion.circle
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  cx={0}
                  cy={0}
                  r={28}
                  fill="url(#badgeGradient)"
                  stroke="white"
                  strokeWidth="2.5"
                  filter="url(#badgeShadow)"
                />
                
                {/* Outer glow */}
                <circle
                  cx={0}
                  cy={0}
                  r={28}
                  fill="none"
                  stroke="rgba(255, 215, 0, 0.4)"
                  strokeWidth="1"
                  opacity="0.8"
                />
                
                {/* Star icon (FontAwesome-style SVG path) */}
              
                
                {/* Score text */}
                <motion.text
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  x={0}
                  y={3}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="22"
                  fontWeight="bold"
                  stroke="rgba(0,0,0,0.25)"
                  strokeWidth="0.8"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif', paintOrder: 'stroke fill' }}
                >
                  {Math.round(totalMutualAffinityScore)}
                </motion.text>
              </g>
            )}
            
            {/* Username label - dynamic width based on username length */}
            <g transform="translate(0, 65)" pointerEvents="none">
              {(() => {
                const minWidth = 120
                const charWidth = 12 // approximate width per character
                const padding = 24   // left + right padding
                const labelWidth = Math.max(minWidth, rootUser.username.length * charWidth + padding)
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
                      {rootUser.username}
                    </text>
                  </>
                )
              })()}
            </g>
          </motion.g>
        </g>

        {/* --- LEAVES (FRIENDS) --- */}
        {placedFriends.map((friend, i) => {
            const swayDuration = 4 + (i % 3)
            const swayAmount = friend.slot.x < 0 ? -8 : 8
            
            return (
              <motion.g
                key={`leaf-group-${friend.user.fid}`}
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
                    key={friend.user.fid}
                    user={friend.user}
                    score={friend.score}
                    maxScore={maxScore}
                    rank={friend.rank}
                    x={friend.x}
                    y={friend.y}
                    rotation={friend.rotation}
                    onNodeClick={(user) => {
                      if (!isLoading && !isAnimating) {
                        const friendData = placedFriends.find(f => f.user.fid === user.fid)
                        if (friendData) {
                          setIsAnimating(true)
                          // Start zoom animation
                          setZoomedUser({ user, x: friendData.x, y: friendData.y })
                        }
                      }
                    }}
                  />
              </motion.g>
            )
        })}
      </svg>

      {/* Zoom Animation Overlay */}
      <AnimatePresence>
        {zoomedUser && (
          <>
            {/* Backdrop during zoom */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md z-30"
            />
            
            {/* Zoom Animation - Leaf zooms to center */}
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
                  // After zoom animation completes, show friend detail modal
                  setTimeout(() => {
                    const friendData = placedFriends.find(f => f.user.fid === zoomedUser.user.fid)
                    if (friendData) {
                      setSelectedFriend({ user: zoomedUser.user, score: friendData.score })
                      setShowFriendModal(true)
                    }
                    setZoomedUser(null)
                    setIsAnimating(false)
                  }, 400)
                }}
                style={{ transformOrigin: 'center' }}
              >
                {/* Calculate leaf dimensions to center it properly */}
                {(() => {
                  const friendData = placedFriends.find(f => f.user.fid === zoomedUser.user.fid)
                  const score = friendData?.score || 0
                  const baseSize = 50 + (score / maxScore) * 40
                  const leafLength = baseSize * 2.2
                  const avatarSize = baseSize * 1.6
                  
                  const totalHeight = leafLength + avatarSize + 40
                  const viewBoxHeight = Math.max(300, totalHeight)
                  const viewBoxWidth = 300
                  
                  const centerY = viewBoxHeight - 60
                  
                  return (
                    <svg 
                      width={viewBoxWidth} 
                      height={viewBoxHeight} 
                      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
                      className="drop-shadow-2xl"
                      style={{ overflow: 'visible' }}
                    >
                      <FriendNode
                        user={zoomedUser.user}
                        score={score}
                        maxScore={maxScore}
                        rank={friendData?.rank || 1}
                        x={viewBoxWidth / 2}
                        y={centerY}
                        rotation={0}
                        onNodeClick={() => {}}
                      />
                    </svg>
                  )
                })()}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                  // After zoom animation completes, show user detail modal
                  setTimeout(() => {
                    setShowUserModal(true)
                    setZoomedRootUser(false)
                    setIsAnimating(false)
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
                    {rootUser.pfp_url ? (
                      <image 
                        href={rootUser.pfp_url} 
                        x={-45} 
                        y={-45} 
                        width={90} 
                        height={90} 
                        clipPath="url(#root-user-clip)"
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
                        {rootUser.username.slice(0,2).toUpperCase()}
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

      {/* Gift Box and Share buttons container - bottom left (stacked vertically) */}
      {!isLoading && (mintedByMe || hasMintRecord) && !showTutorial && !isAnimating && (
        <motion.div
          className="absolute bottom-5 left-2 z-40 flex flex-col gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
        

          {/* Share button - bottom (only after NFT is minted) */}
          {hasMintRecord && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShareClick}
              className="px-4 py-2 rounded-full bg-white/90 text-[#5D4037] text-xs font-semibold shadow-md border border-[#5D4037]/20 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faShareNodes} style={{ fontSize: '16px' }} />
              <span>Share Tree</span>
            </motion.button>
          )}
        </motion.div>
      )}

   

      {/* Zoomed Tree View - Shows new tree with selected user as root */}
      <AnimatePresence>
        {selectedUser && (
          <ZoomedTreeView
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onLeafClick={(user) => {
              setSelectedUser(user)
            }}
            onViewProfile={(fid) => {
              externalNodeClick(fid)
              setSelectedUser(null)
            }}
            mainAccountFriends={friends.map(f => ({
              user: f.user,
              score: f.score,
            }))}
            viewer={{
              fid: rootUser.fid,
              username: rootUser.username,
              pfp_url: rootUser.pfp_url,
            }}
          />
        )}
      </AnimatePresence>
      {/* Mint / Status Area (hidden during tutorial or zoom animation) */}
      {!isLoading && friends.length > 0 && !hasMintRecord && !showTutorial && !isAnimating && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={async () => {
            if (svgRef.current) {
              await mintTree(svgRef.current, {
                rootUser,
                friends,
                maxScore,
                minter: {
                  fid: rootUser.fid,
                  username: rootUser.username,
                  pfp_url: rootUser.pfp_url,
                },
              })
            }
          }}
          disabled={mintStatus !== 'idle' && mintStatus !== 'error'}
          className="absolute bottom-3 right-2 z-40 px-6 py-3 rounded-full bg-gradient-to-r from-[#4d7c36] to-[#5D4037] text-white font-semibold shadow-lg hover:shadow-xl transition-all border-2 border-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

      {/* Already Minted State for root tree (hidden during tutorial or zoom animation) */}
      {!isLoading && hasMintRecord && !showTutorial && !isAnimating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-5 right-2 z-40 flex flex-col items-end gap-2"
        >
      
            { mintedByOther && mintRecord?.minterUsername && mintRecord.minterFid && (
                  <div className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur shadow-lg border border-[#5D4037]/10 max-w-xs">
              <button
                type="button"
                onClick={() => externalNodeClick(mintRecord.minterFid!)}
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
                  Tree already minted by {mintRecord.minterUsername}.
                </span>
              </button>
              </div>
            )
          }
          

          {/* View on OpenSea button (always available once minted) */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenSeaClick}
            className="px-4 py-2 rounded-full bg-white text-[#5D4037] text-xs font-semibold shadow-md border border-[#5D4037]/20 flex items-center gap-2"
          >
            <span>View on OpenSea</span>
          </motion.button>
        </motion.div>
        
      )}
      
      {/* Mint Status Modal */}
      <MintStatus
        status={mintStatus}
        result={mintResult}
        onClose={() => {
          reset()
        }}
        onShare={handleShareClick}
        onOpenSea={handleOpenSeaClick}
      />

      {/* Friend Detail Modal */}
      {selectedFriend && (
        <FriendDetailModal
          user={selectedFriend.user}
          mutualScore={selectedFriend.score}
          isOpen={showFriendModal}
          rank={friends.find(f => f.user.fid === selectedFriend.user.fid)?.rank || 0}
          onClose={() => {
            setShowFriendModal(false)
            setSelectedFriend(null)
          }}
          onMakeTree={(fid) => {
            const user = friends.find(f => f.user.fid === fid)?.user
            if (user) {
              setSelectedUser(user)
              setShowFriendModal(false)
              setSelectedFriend(null)
            }
          }}
          onViewProfile={(fid) => {
            externalNodeClick(fid)
            setShowFriendModal(false)
            setSelectedFriend(null)
          }}
        />
      )}

      {/* User Detail Modal */}
      {rootUserData && (
        <UserDetailModal
          user={rootUserData}
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false)
            setRootUserData(null)
          }}
          onViewProfile={(fid) => {
            externalNodeClick(fid)
            setShowUserModal(false)
            setRootUserData(null)
          }}
        />
      )}

      {/* Gift Box Modal */}
      {showGiftBox && (
        <GiftBox
          onClose={() => setShowGiftBox(false)}
          onClaimComplete={() => {
            setShowGiftBox(false)
          }}
        />
      )}

      {/* Party Frame Modal */}
      <AnimatePresence>
        {showPartyFrameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'radial-gradient(circle at center, rgba(255, 215, 0, 0.95) 0%, rgba(255, 107, 53, 0.98) 100%)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
                overflowY: 'auto',
        overflowX: 'hidden'
            }}
            onClick={() => setShowPartyFrameModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, rotateY: -15 }}
              animate={{ scale: 1, rotateY: 0 }}
              exit={{ scale: 0.8, rotateY: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative"
              style={{
                maxWidth: '450px',
                width: '100%',
                perspective: '1000px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="glass-card neon-glow"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 248, 240, 0.98) 0%, rgba(255, 243, 224, 0.98) 50%, rgba(255, 248, 240, 0.98) 100%)',
                  border: '3px solid rgba(255, 215, 0, 0.6)',
                  borderRadius: '32px',
                  padding: '40px',
                  textAlign: 'center',
                  position: 'relative',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 25px 50px -12px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 193, 7, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.2)',
                }}
              >
                {/* Close button */}
                <motion.button
                  onClick={() => setShowPartyFrameModal(false)}
                  className="absolute top-4 right-4 text-[#5D4037]/60 hover:text-[#5D4037] transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.3)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </motion.button>

                <motion.h2 
                  className="text-3xl font-black mb-4"
                  style={{ 
                    color: '#ff6b35',
                    background: 'linear-gradient(135deg, #ff6b35, #ffd700)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  🔥 FREE NFT MINT FOR HOLDERS! 🔥
                </motion.h2>

                <motion.div 
                  className="mb-6 space-y-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-lg font-semibold" style={{ color: '#5D4037' }}>
                    EXCLUSIVE for Roots of You NFT Holders!
                  </p>
                  <p className="text-base" style={{ color: '#5D4037' }}>
                    Don't miss out on this LIMITED opportunity! Claim your exclusive party frame NOW before it's gone! 🚀
                  </p>
                  
                  <motion.div
                    className="bg-gradient-to-r from-yellow-400/30 to-orange-400/30 border-2 border-yellow-400/50 rounded-xl p-4"
                    animate={{ 
                      boxShadow: ['0 0 20px rgba(255, 193, 7, 0.4)', '0 0 40px rgba(255, 193, 7, 0.7)', '0 0 20px rgba(255, 193, 7, 0.4)']
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <p className="text-sm font-bold" style={{ color: '#5D4037' }}>
                      ⚡ First Come, First Served - Limited Time Only! ⚡
                    </p>
                  </motion.div>
                </motion.div>

                <motion.button
                  onClick={() => {
                    if (actions?.openMiniApp) {
                      actions.openMiniApp({
                        url: 'https://farcaster.xyz/miniapps/Msv27pssuYPE/party-frame'
                      });
                    }
                    setShowPartyFrameModal(false);
                  }}
                  className="w-full text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300 border-2 border-yellow-400/50 mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff6b35 100%)',
                    boxShadow: '0 10px 30px rgba(255, 107, 53, 0.5), 0 0 40px rgba(255, 193, 7, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-center">
                    <FontAwesomeIcon icon={faRocket} className="mr-3" />
                    MINT PARTY FRAME NOW!
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setShowPartyFrameModal(false)}
                  className="w-full text-[#5D4037] font-semibold py-3 px-6 rounded-2xl transition-all duration-300 border-2 border-[#5D4037]/20"
                  style={{
                    background: 'rgba(255, 255, 255, 0.5)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Maybe Later
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
