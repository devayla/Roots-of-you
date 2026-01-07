'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { NeynarUser } from '@/types/neynar'
import type { BestFriendsResponse } from '@/types/neynar'

interface FriendDetailViewProps {
  user: NeynarUser
  onClose: () => void
  onViewProfile: (fid: number) => void
}

export function FriendDetailView({ user, onClose, onViewProfile }: FriendDetailViewProps) {
  const [friendsData, setFriendsData] = useState<BestFriendsResponse | null>(null)
  const [loadingFriends, setLoadingFriends] = useState(true)

  useEffect(() => {
    // Fetch this user's best friends to show their roots
    const fetchFriends = async () => {
      try {
        const response = await fetch(`/api/neynar/best-friends?fid=${user.fid}&limit=6`)
        if (response.ok) {
          const data = await response.json()
          setFriendsData(data)
        }
      } catch (error) {
        console.error('Error fetching friends:', error)
      } finally {
        setLoadingFriends(false)
      }
    }
    fetchFriends()
  }, [user.fid])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Content Card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-white via-[#fef5e7] to-[#fdf5e6] rounded-3xl shadow-2xl overflow-hidden border-2 border-[#4d7c36]/30"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all"
        >
          ✕
        </button>

        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header Section */}
          <div className="relative bg-gradient-to-r from-[#4d7c36] to-[#5a8a3f] p-8 text-white">
            <div className="flex items-center space-x-6">
              {user.pfp_url && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-white rounded-full blur-xl opacity-50" />
                  <img
                    src={user.pfp_url}
                    alt={user.display_name}
                    className="relative w-24 h-24 rounded-full border-4 border-white shadow-xl"
                  />
                </motion.div>
              )}
              <div className="flex-1">
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold mb-2"
                >
                  {user.display_name}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg opacity-90"
                >
                  @{user.username}
                </motion.p>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Bio */}
              {user.profile?.bio?.text && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/80 rounded-2xl p-6 shadow-lg border border-[#4d7c36]/20"
                >
                  <h3 className="text-lg font-bold text-[#4d7c36] mb-3 flex items-center">
                    <span className="mr-2">🌿</span> Bio
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{user.profile.bio.text}</p>
                </motion.div>
              )}

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/80 rounded-2xl p-6 shadow-lg border border-[#4d7c36]/20"
              >
                <h3 className="text-lg font-bold text-[#4d7c36] mb-4 flex items-center">
                  <span className="mr-2">📊</span> Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-[#4d7c36]/10 to-[#5a8a3f]/10 rounded-xl">
                    <div className="text-3xl font-bold text-[#4d7c36]">
                      {user.follower_count.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Followers</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-[#4d7c36]/10 to-[#5a8a3f]/10 rounded-xl">
                    <div className="text-3xl font-bold text-[#4d7c36]">
                      {user.following_count.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Following</div>
                  </div>
                </div>
              </motion.div>

              {/* Pro Status */}
              {user.pro?.status && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white/80 rounded-2xl p-6 shadow-lg border border-[#4d7c36]/20"
                >
                  <h3 className="text-lg font-bold text-[#4d7c36] mb-3 flex items-center">
                    <span className="mr-2">⭐</span> Pro Status
                  </h3>
                  <div className="flex items-center space-x-3">
                    <span className={`px-4 py-2 rounded-full font-semibold ${
                      user.pro.status === 'subscribed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.pro.status === 'subscribed' ? '✓ Subscribed' : user.pro.status}
                    </span>
                    {user.pro.expires_at && (
                      <span className="text-sm text-gray-600">
                        Expires: {new Date(user.pro.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Neynar Score */}
              {user.experimental?.neynar_user_score !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white/80 rounded-2xl p-6 shadow-lg border border-[#4d7c36]/20"
                >
                  <h3 className="text-lg font-bold text-[#4d7c36] mb-3 flex items-center">
                    <span className="mr-2">🎯</span> Neynar Score
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl font-bold text-[#4d7c36]">
                      {(user.experimental.neynar_user_score * 100).toFixed(0)}%
                    </div>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${user.experimental.neynar_user_score * 100}%` }}
                        transition={{ delay: 1, duration: 1 }}
                        className="h-full bg-gradient-to-r from-[#4d7c36] to-[#5a8a3f] rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Primary Address */}
              {user.verified_addresses?.primary?.eth_address && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white/80 rounded-2xl p-6 shadow-lg border border-[#4d7c36]/20"
                >
                  <h3 className="text-lg font-bold text-[#4d7c36] mb-3 flex items-center">
                    <span className="mr-2">🔗</span> Primary Address
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm break-all">
                    {user.verified_addresses.primary.eth_address}
                  </div>
                </motion.div>
              )}

              {/* Verified Accounts */}
              {user.verified_accounts && user.verified_accounts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white/80 rounded-2xl p-6 shadow-lg border border-[#4d7c36]/20"
                >
                  <h3 className="text-lg font-bold text-[#4d7c36] mb-4 flex items-center">
                    <span className="mr-2">✓</span> Verified Accounts
                  </h3>
                  <div className="space-y-2">
                    {user.verified_accounts.map((account, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="font-semibold text-[#4d7c36] capitalize">
                          {account.platform}:
                        </span>
                        <span className="text-gray-700">@{account.username}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Roots Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-white/80 rounded-2xl p-6 shadow-lg border border-[#4d7c36]/20"
              >
                <h3 className="text-lg font-bold text-[#4d7c36] mb-4 flex items-center">
                  <span className="mr-2">🌳</span> Their Roots
                </h3>
                {loadingFriends ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4d7c36] border-t-transparent mx-auto" />
                    <p className="mt-2 text-gray-600">Loading connections...</p>
                  </div>
                ) : friendsData && friendsData.users.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {friendsData.users.slice(0, 6).map((friend) => (
                      <div
                        key={friend.fid}
                        className="flex flex-col items-center p-3 bg-gradient-to-br from-[#4d7c36]/10 to-[#5a8a3f]/10 rounded-xl hover:from-[#4d7c36]/20 hover:to-[#5a8a3f]/20 transition-all cursor-pointer"
                        onClick={() => onViewProfile(friend.fid)}
                      >
                        <div className="text-2xl mb-1">🍃</div>
                        <div className="text-xs font-semibold text-[#4d7c36] text-center truncate w-full">
                          {friend.username}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round(friend.mutual_affinity_score)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No connections found</p>
                )}
              </motion.div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-8 pt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex space-x-4"
            >
              <button
                onClick={() => {
                  onViewProfile(user.fid)
                  onClose()
                }}
                className="flex-1 bg-gradient-to-r from-[#4d7c36] to-[#5a8a3f] text-white py-4 rounded-xl font-semibold hover:from-[#3d632b] hover:to-[#4d7c36] transition-all shadow-lg hover:shadow-xl text-lg"
              >
                View Full Profile
              </button>
              <button
                onClick={onClose}
                className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}





