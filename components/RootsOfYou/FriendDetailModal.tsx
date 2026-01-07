'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faLeaf, 
  faBullseye, 
  faLink, 
  faTree, 
  faUser,
  faXmark,
  faCopy,
  faCheck
} from '@fortawesome/free-solid-svg-icons'
import type { NeynarUser } from '@/types/neynar'

interface FriendDetailModalProps {
  user: NeynarUser
  mutualScore: number
  isOpen: boolean
  onClose: () => void
  onMakeTree: (fid: number) => void
  onViewProfile: (fid: number) => void
  rank?: number // Rank to determine leaf color
}

export function FriendDetailModal({
  user,
  mutualScore,
  isOpen,
  onClose,
  onMakeTree,
  onViewProfile,
  rank = 0,
}: FriendDetailModalProps) {
  const neynarScore = user.experimental?.neynar_user_score
    ? (user.experimental.neynar_user_score * 100).toFixed(1)
    : null

  const isPro = user.pro?.status === 'subscribed'
  const primaryAddress = user.verified_addresses?.primary?.eth_address
  const [copied, setCopied] = useState(false)

  // Shorten address to show first 6 and last 4 characters
  const shortenAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}....${address.slice(-4)}`
  }

  // Copy address to clipboard
  const copyToClipboard = async () => {
    if (!primaryAddress) return
    try {
      await navigator.clipboard.writeText(primaryAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Leaf gradient colors matching FriendNode
  const leafGradients = [
    { from: '#a8e063', to: '#56ab2f' }, // Bright green
    { from: '#89f7fe', to: '#66a6ff' }, // Sky blue
    { from: '#fbc2eb', to: '#a6c1ee' }, // Pink to blue
    { from: '#fa709a', to: '#fee140' }, // Pink to yellow
    { from: '#30cfd0', to: '#330867' }, // Teal to purple
    { from: '#a8edea', to: '#fed6e3' }, // Mint to pink
  ]
  const gradient = leafGradients[rank % leafGradients.length]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/50 to-black/60"
            />

            {/* Modal Card with entrance animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 100, rotateX: -15 }}
              animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md mx-4 bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl shadow-2xl overflow-hidden border-2 my-4"
              style={{
                borderColor: `${gradient.from}40`,
                boxShadow: `0 20px 60px -12px ${gradient.from}30, 0 0 0 1px ${gradient.to}20`,
                maxHeight: '90vh'
              }}
            >
              {/* Animated background decoration with leaf colors */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                    times: [0, 0.5, 1]
                  }}
                  className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl"
                  style={{
                    background: `radial-gradient(circle, ${gradient.from}20, ${gradient.to}10)`
                  }}
                />
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, -90, 0],
                  }}
                  transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear",
                    times: [0, 0.5, 1]
                  }}
                  className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full blur-3xl"
                  style={{
                    background: `radial-gradient(circle, ${gradient.to}20, ${gradient.from}10)`
                  }}
                />
              </div>

              {/* Close Button */}
              <motion.button
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                onClick={onClose}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all hover:scale-110"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </motion.button>

              <div className="relative z-10">
                {/* Header Section with Profile Picture - Using leaf gradient */}
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative p-5 text-white overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`
                  }}
                >
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                      backgroundSize: '40px 40px'
                    }} />
                  </div>

                  <div className="relative flex flex-col items-center text-center">
                    {/* Profile Picture with animation */}
                    {user.pfp_url && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
                        className="relative mb-3"
                      >
                        <div className="absolute inset-0 bg-white rounded-full blur-xl opacity-50 animate-pulse" />
                        <img
                          src={user.pfp_url}
                          alt={user.display_name}
                          className="relative w-20 h-20 rounded-full border-[3px] border-white shadow-xl"
                        />
                        {/* Pro badge - Farcaster Pro Badge */}
                        {isPro && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6, type: "spring" }}
                            className="absolute -bottom-1 -right-1 shadow-lg"
                          >
                            <svg width="28" height="28" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path 
                                className="fill-farcaster-pro-badge stroke-white dark:stroke-[#101010]" 
                                id="badge" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                d="M 17 9 C 16.984699 8.44998 16.8169 7.914431 16.5147 7.45381 C 16.297401 7.122351 16.016399 6.83868 15.6895 6.61875 C 15.4741 6.47382 15.3639 6.206079 15.4143 5.9514 C 15.4908 5.56531 15.4893 5.16623 15.4095 4.777781 C 15.298 4.23797 15.0375 3.74074 14.6586 3.34142 C 14.2584 2.96254 13.762 2.70285 13.2222 2.59046 C 12.8341 2.51075 12.4353 2.5092 12.0495 2.5855 C 11.7944 2.63594 11.5263 2.52522 11.3816 2.30924 C 11.1622 1.982038 10.87893 1.700779 10.54704 1.48361 C 10.08642 1.182205 9.55087 1.013622 9 1 C 8.44998 1.014473 7.91613 1.181355 7.45636 1.48361 C 7.12562 1.701042 6.84379 1.981922 6.62575 2.30818 C 6.4811 2.52463 6.21278 2.6359 5.95742 2.58524 C 5.57065 2.50851 5.17062 2.50951 4.78118 2.59046 C 4.24053 2.70115 3.74244 2.96169 3.34227 3.34142 C 2.96339 3.74159 2.70456 4.23968 2.59472 4.77863 C 2.51504 5.16661 2.51478 5.56517 2.59204 5.9505 C 2.64317 6.20557 2.53289 6.47402 2.31683 6.618879 C 1.98923 6.83852 1.707141 7.12164 1.488719 7.45296 C 1.185611 7.91273 1.016177 8.44913 1 9 C 1.017028 9.55087 1.185611 10.08642 1.488719 10.54704 C 1.70699 10.87813 1.988839 11.1615 2.31614 11.381 C 2.53242 11.5261 2.64304 11.7948 2.59191 12.0501 C 2.51478 12.4353 2.51509 12.8336 2.59472 13.2214 C 2.70541 13.7612 2.96339 14.2584 3.34142 14.6586 C 3.74159 15.0358 4.23882 15.2946 4.77778 15.4061 C 5.16676 15.4872 5.56638 15.4885 5.95297 15.4125 C 6.2069 15.3626 6.4733 15.473 6.61752 15.6879 C 6.8374 16.015499 7.12119 16.2973 7.45381 16.515499 C 7.91358 16.8169 8.44998 16.984699 9 17 C 9.55087 16.986401 10.08642 16.8186 10.54704 16.5172 C 10.87568 16.3022 11.1566 16.023899 11.3751 15.7008 C 11.5233 15.4816 11.7988 15.3721 12.0576 15.4274 C 12.4412 15.5093 12.8397 15.5111 13.2273 15.4308 C 13.7688 15.3184 14.2661 15.0502 14.6577 14.6586 C 15.0494 14.2669 15.3184 13.7697 15.4308 13.2273 C 15.5112 12.8397 15.5093 12.4411 15.427 12.0575 C 15.3716 11.7987 15.4806 11.5231 15.6997 11.3745 C 16.022301 11.1558 16.2999 10.87482 16.515499 10.54619 C 16.8169 10.08642 16.984699 9.55002 17 9 Z M 12.1286 6.46597"
                                fill="#8A63D2"
                                stroke="white"
                              />
                              <path 
                                id="checkmark" 
                                fill="#ffffff" 
                                fillRule="evenodd" 
                                stroke="none" 
                                d="M 5.48206 8.829732 C 5.546341 8.757008 6.096026 8.328334 6.590207 8.831891 C 6.990357 9.239633 7.80531 10.013605 7.80531 10.013605 C 7.80531 10.013605 10.326332 7.31631 11.011629 6.559397 C 11.320887 6.21782 11.875775 6.239667 12.135474 6.515033 C 12.411443 6.807649 12.489538 7.230008 12.164574 7.601331 C 10.947777 8.991708 9.508716 10.452277 8.3795 11.706156 C 8.11062 12.004721 7.595459 12.008714 7.302509 11.735093 C 7.061394 11.509888 6.005327 10.437536 5.502547 9.931531 C 5.003333 9.429114 5.404643 8.887831 5.48206 8.829732 Z"
                              />
                            </svg>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Username */}
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-xl font-bold mb-1"
                    >
                      {user.display_name || user.username}
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="text-sm opacity-90"
                    >
                      @{user.username}
                    </motion.p>
                  </div>
                </motion.div>

                {/* Content Section - Scrollable */}
                <div className="p-4 space-y-3 max-h-[calc(90vh-280px)] overflow-y-auto">
                  {/* Mutual Affinity Score - Featured with leaf colors */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.7, type: "spring" }}
                    className="rounded-xl p-4 border-2 backdrop-blur-sm"
                    style={{
                      background: `linear-gradient(135deg, ${gradient.from}15, ${gradient.to}10)`,
                      borderColor: `${gradient.from}40`
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faLeaf} className="w-4 h-4" style={{ color: gradient.to }} />
                        <h3 className="text-sm font-bold" style={{ color: gradient.to }}>
                          Mutual Affinity Score
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-end space-x-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                        className="text-3xl font-bold"
                        style={{ color: gradient.to }}
                      >
                        {Math.round(mutualScore)}
                      </motion.div>
                      <div className="flex-1 h-2 bg-gray-200/50 rounded-full overflow-hidden mb-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(mutualScore / 100) * 100}%` }}
                          transition={{ delay: 1, duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${gradient.from}, ${gradient.to})`
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Stats Grid - Neynar Score and Wallet Address side by side */}
                  <div className={`grid gap-3 ${neynarScore && primaryAddress ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Neynar Score */}
                    {neynarScore && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                        className="rounded-lg p-3 border backdrop-blur-sm shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${gradient.from}10, ${gradient.to}5)`,
                          borderColor: `${gradient.from}30`
                        }}
                      >
                        <div className="flex items-center space-x-1.5 mb-1.5">
                          <FontAwesomeIcon icon={faBullseye} className="w-3.5 h-3.5" style={{ color: gradient.to }} />
                          <h4 className="text-xs font-semibold text-gray-700">Neynar Score</h4>
                        </div>
                        <div className="text-xl font-bold" style={{ color: gradient.to }}>
                          {neynarScore}
                        </div>
                      </motion.div>
                    )}

                    {/* Wallet Address */}
                    {primaryAddress && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.85 }}
                        className="rounded-lg p-3 border backdrop-blur-sm shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${gradient.from}10, ${gradient.to}5)`,
                          borderColor: `${gradient.from}30`
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center space-x-1.5">
                            <FontAwesomeIcon icon={faLink} className="w-3.5 h-3.5" style={{ color: gradient.to }} />
                            <h4 className="text-xs font-semibold text-gray-700">Wallet</h4>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span 
                            className="font-mono text-xs font-semibold flex-1"
                            style={{ color: gradient.to }}
                          >
                            {shortenAddress(primaryAddress)}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={copyToClipboard}
                            className="p-1.5 rounded hover:bg-white/20 transition-colors"
                            style={{ color: gradient.to }}
                            title="Copy address"
                          >
                            {copied ? (
                              <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-green-600" />
                            ) : (
                              <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="p-4 pt-2 space-y-2 border-t"
                  style={{ borderColor: `${gradient.from}20` }}
                >
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: `0 10px 30px -5px ${gradient.from}50` }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onMakeTree(user.fid)
                      onClose()
                    }}
                    className="w-full text-white py-3 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
                    style={{
                      background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`
                    }}
                  >
                    <FontAwesomeIcon icon={faTree} className="w-4 h-4" />
                    <span>Grow Tree</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onViewProfile(user.fid)
                      onClose()
                    }}
                    className="w-full bg-white py-3 rounded-lg font-semibold border-2 transition-all flex items-center justify-center space-x-2"
                    style={{
                      color: gradient.to,
                      borderColor: `${gradient.from}40`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${gradient.from}10`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white'
                    }}
                  >
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                    <span>View Profile</span>
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

