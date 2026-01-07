'use client'

import { Demo } from '@/components/Home'
import { useFrame } from '@/components/farcaster-provider'
import { SafeAreaContainer } from '@/components/safe-area-container'
import { motion } from 'framer-motion'

export default function Home() {
  const { context, isLoading, isSDKLoaded } = useFrame()
  const { actions } = useFrame()
  if (isLoading) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="relative w-full h-screen bg-gradient-to-b from-[#e0f7fa] via-[#f1f8e9] to-[#fff3e0] overflow-hidden flex items-center justify-center">
          {/* Floating Particles */}
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

          {/* Dynamic Lighting */}
          <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay bg-gradient-to-br from-white/80 via-transparent to-transparent z-10" />

          {/* Main Loader Content */}
          <div className="relative z-20 flex flex-col items-center justify-center space-y-8">
            {/* Animated Tree Icon */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              <svg
                width="120"
                height="140"
                viewBox="0 0 120 140"
                className="drop-shadow-lg"
              >
                <defs>
                  <linearGradient id="barkGradientLoader" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3E2723" />
                    <stop offset="30%" stopColor="#5D4037" />
                    <stop offset="60%" stopColor="#795548" />
                    <stop offset="100%" stopColor="#3E2723" />
                  </linearGradient>
                </defs>

                {/* Roots */}
                <g stroke="#5D4037" fill="none" strokeWidth="3" strokeLinecap="round" opacity="0.8">
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: 0 }}
                    d="M45,120 Q30,135 15,140"
                  />
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    d="M75,120 Q90,135 105,140"
                  />
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    d="M60,125 Q50,140 45,150"
                  />
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    d="M60,125 Q70,140 75,150"
                  />
                </g>

                {/* Trunk */}
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                  d="M50,120 Q55,80 55,50 L65,50 Q65,80 70,120 Z"
                  fill="url(#barkGradientLoader)"
                  stroke="none"
                />

                {/* Branches */}
                <g stroke="url(#barkGradientLoader)" fill="none" strokeWidth="4" strokeLinecap="round">
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    d="M60,50 Q40,30 25,20"
                  />
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.4 }}
                    d="M60,50 Q80,30 95,20"
                  />
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.6 }}
                    d="M60,50 Q50,35 45,25"
                  />
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.8 }}
                    d="M60,50 Q70,35 75,25"
                  />
                </g>

                {/* Animated Leaves */}
                {[
                  { x: 25, y: 20, color: '#a8e063', delay: 2.0 },
                  { x: 95, y: 20, color: '#66a6ff', delay: 2.2 },
                  { x: 45, y: 25, color: '#fbc2eb', delay: 2.4 },
                  { x: 75, y: 25, color: '#ffd27f', delay: 2.6 },
                ].map((leaf, i) => (
                  <motion.g
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [0, 1.2, 1],
                      opacity: [0, 1, 1],
                      x: [0, leaf.x < 60 ? -3 : 3, 0],
                    }}
                    transition={{
                      // Use tween for multi-keyframe scale animation (spring only supports two keyframes)
                      scale: { duration: 0.5, delay: leaf.delay, ease: "easeOut" },
                      opacity: { duration: 0.5, delay: leaf.delay },
                      x: { duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: leaf.delay + 0.5 },
                    }}
                    transform={`translate(${leaf.x}, ${leaf.y})`}
                  >
                    <path
                      d="M0,0 C-12,-8 -14,-24 0,-33 C14,-24 12,-8 0,0 Z"
                      fill={leaf.color}
                      fillOpacity={0.7}
                      stroke="#5D4037"
                      strokeWidth={1}
                    />
                    <path
                      d="M0,-2 C-2,-10 -1,-20 0,-30"
                      stroke="rgba(255,255,255,0.6)"
                      strokeWidth={1}
                      fill="none"
                      strokeLinecap="round"
                    />
                  </motion.g>
                ))}
              </svg>
            </motion.div>

            {/* App Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.8, duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-4xl font-bold text-[#5D4037] mb-2 drop-shadow-sm">
                Roots of You
              </h1>
              <p className="text-sm text-[#795548] opacity-80">
                Growing your tree...
              </p>
            </motion.div>

            {/* Loading Dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.0, duration: 0.6 }}
              className="flex space-x-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-[#5D4037]"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </SafeAreaContainer>
    )
  }

  if (!isSDKLoaded) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
          <h1 className="text-3xl font-bold text-center">
            No farcaster SDK found, please use this miniapp in the farcaster app
          </h1>
          <button onClick={()=>{
           window.open('https://farcaster.xyz/~/mini-apps/launch?domain=roots-of-you.vercel.app', '_blank')
          }}>Open in Farcaster</button>
        </div>
      </SafeAreaContainer>
    )
  }

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      <Demo />
    </SafeAreaContainer>
  )
}
