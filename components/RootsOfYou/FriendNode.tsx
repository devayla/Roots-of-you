'use client'

import { motion } from 'framer-motion'
import type { NeynarUser } from '@/types/neynar'

interface FriendNodeProps {
  user: NeynarUser
  score: number
  maxScore: number
  rank: number
  x: number
  y: number
  rotation?: number
  onNodeClick: (user: NeynarUser) => void
}

export function FriendNode({
  user,
  score,
  maxScore,
  rank,
  x,
  y,
  rotation = 0,
  onNodeClick,
}: FriendNodeProps) {
  // Size based on score - larger range for more visual impact
  const baseSize = 50 + (score / maxScore) * 40
  const avatarSize = baseSize * 1.6
  
  // Beautiful gradient colors for leaves - more vibrant
  const leafGradients = [
    { from: '#a8e063', to: '#56ab2f' }, // Bright green
    { from: '#89f7fe', to: '#66a6ff' }, // Sky blue
    { from: '#fbc2eb', to: '#a6c1ee' }, // Pink to blue
    { from: '#fa709a', to: '#fee140' }, // Pink to yellow
    { from: '#30cfd0', to: '#330867' }, // Teal to purple
    { from: '#a8edea', to: '#fed6e3' }, // Mint to pink
  ]
  const gradient = leafGradients[rank % leafGradients.length]
  
  // Leaf dimensions
  const leafLength = baseSize * 2.2
  const leafWidth = baseSize * 2

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
    >
      <motion.g
        style={{ cursor: 'pointer', transformOrigin: 'center' }}
        onClick={() => onNodeClick(user)}
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
      <defs>
        <linearGradient id={`leafGrad-${user.fid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradient.from} stopOpacity="0.9" />
          <stop offset="50%" stopColor={gradient.to} stopOpacity="0.95" />
          <stop offset="100%" stopColor={gradient.from} stopOpacity="0.85" />
        </linearGradient>
        <filter id={`glow-${user.fid}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`shadow-${user.fid}`}>
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Leaf Shape - organic, beautiful teardrop */}
      <motion.path
        initial={{ scale: 0, opacity: 0, pathLength: 0 }}
        animate={{ scale: 1, opacity: 1, pathLength: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 150,
          damping: 15,
          delay: rank * 0.08 
        }}
        d={`M0,0 
           C${-leafWidth * 0.3},${-leafLength * 0.3} ${-leafWidth * 0.6},${-leafLength * 0.6} ${-leafWidth * 0.4},${-leafLength * 0.9}
           C${-leafWidth * 0.2},${-leafLength * 1.1} 0,${-leafLength} ${leafWidth * 0.2},${-leafLength * 1.1}
           C${leafWidth * 0.4},${-leafLength * 0.9} ${leafWidth * 0.6},${-leafLength * 0.6} ${leafWidth * 0.3},${-leafLength * 0.3}
           C${leafWidth * 0.15},${-leafLength * 0.15} 0,0 0,0Z`}
        fill={`url(#leafGrad-${user.fid})`}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
        filter={`url(#shadow-${user.fid})`}
        style={{ filter: `url(#glow-${user.fid})` }}
      />
      
      {/* Veins for realism */}
      <path
        d={`M0,0 Q0,${-leafLength * 0.5} 0,${-leafLength * 0.85}`}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d={`M0,${-leafLength * 0.3} Q${-leafWidth * 0.2},${-leafLength * 0.5} ${-leafWidth * 0.3},${-leafLength * 0.7}`}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d={`M0,${-leafLength * 0.3} Q${leafWidth * 0.2},${-leafLength * 0.5} ${leafWidth * 0.3},${-leafLength * 0.7}`}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
        fill="none"
      />

      {/* Profile Picture at the tip - Large and prominent */}
      <g transform={`translate(0, ${-leafLength * 0.95}) rotate(${-rotation})`}>
        {/* Outer glow ring */}
        <motion.circle
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: rank * 0.08 + 0.3, type: "spring", stiffness: 200 }}
          cx={0}
          cy={0}
          r={avatarSize / 2 + 8}
          fill="rgba(255,255,255,0.4)"
          filter={`url(#glow-${user.fid})`}
        />
        
        {/* White border circle */}
        <circle
          cx={0}
          cy={0}
          r={avatarSize / 2 + 4}
          fill="white"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="3"
        />
        
        {/* Shadow circle */}
        <circle
          cx={2}
          cy={4}
          r={avatarSize / 2}
          fill="rgba(0,0,0,0.15)"
        />
        
        <defs>
          <clipPath id={`avatar-clip-${user.fid}`}>
            <circle cx={0} cy={0} r={avatarSize / 2} />
          </clipPath>
        </defs>

        {user.pfp_url ? (
          <image
            href={user.pfp_url}
            x={-avatarSize / 2}
            y={-avatarSize / 2}
            width={avatarSize}
            height={avatarSize}
            clipPath={`url(#avatar-clip-${user.fid})`}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <circle
            cx={0}
            cy={0}
            r={avatarSize / 2}
            fill={gradient.from}
            opacity="0.8"
          />
        )}
        
        {/* Initial letter if no image */}
        {!user.pfp_url && (
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={avatarSize * 0.4}
            fontWeight="bold"
          >
            {user.username.charAt(0).toUpperCase()}
          </text>
        )}
      </g>
      
      {/* Mutual Score - Natural dewdrop on leaf tip */}
     
      </motion.g>
    </g>
  )
}
