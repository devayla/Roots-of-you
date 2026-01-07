'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { MintStatus as MintStatusType, MintResult } from '@/hooks/useMintTreeNFT'

interface MintStatusProps {
  status: MintStatusType
  result: MintResult | null
  onClose: () => void
  onShare?: () => void
  onOpenSea?: () => void
}

const statusMessages: Record<MintStatusType, string> = {
  idle: '',
  capturing: 'Capturing tree...',
  'uploading-image': 'Uploading to IPFS...',
  'creating-metadata': 'Creating metadata...',
  'uploading-metadata': 'Uploading metadata to IPFS...',
  'preparing-transaction': 'Preparing transaction...',
  minting: 'Minting on blockchain...',
  saving: 'Saving mint record...',
  success: 'Success! Your tree NFT has been minted!',
  error: 'Error occurred during minting',
}

export function MintStatus({ status, result, onClose, onShare, onOpenSea }: MintStatusProps) {
  const isActive = status !== 'idle'
  const isLoading = ['capturing', 'uploading-image', 'creating-metadata', 'uploading-metadata', 'preparing-transaction', 'minting', 'saving'].includes(status)
  const isSuccess = status === 'success'
  const isError = status === 'error'

  if (!isActive) return null

  return (
    <AnimatePresence>
      {/* Mini toast for errors */}
      {isError && (
        <motion.div
          initial={{ opacity: 0, x: 40, y: -10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 40, y: -10 }}
          className="fixed top-4 right-4 z-50 max-w-sm w-[90vw] sm:w-auto"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-red-50/95 border border-red-200 px-4 py-3 shadow-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white text-sm font-bold">
              !
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">
                {result?.error || statusMessages[status]}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-2 text-xs font-semibold text-red-700 hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* Full overlay for loading + success */}
      {!isError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Status Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-gradient-to-br from-white via-white to-[#fff8f0] rounded-3xl shadow-2xl border-2 border-[#5D4037]/30 p-8 max-w-md w-full z-50"
          >
            {/* Close Button */}
            {!isLoading && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                ✕
              </button>
            )}

            {/* Loading Spinner */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 border-4 border-[#5D4037] border-t-transparent rounded-full mb-4"
                />
                <p className="text-[#5D4037] font-semibold text-lg text-center">
                  {statusMessages[status]}
                </p>
              </div>
            )}

            {/* Success State */}
            {isSuccess && (
              <div className="py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
                <h3 className="text-2xl font-bold text-[#3E2723] text-center mb-4">
                  Success! Your tree has been minted.
                </h3>

                {/* Actions: Share + OpenSea */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  {onShare && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={onShare}
                      className="px-4 py-2 rounded-full bg-[#4d7c36] text-white text-sm font-semibold shadow-md border border-white/20 flex items-center gap-2"
                    >
                      <span>Share now</span>
                    </motion.button>
                  )}
                  {onOpenSea && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={onOpenSea}
                      className="px-4 py-2 rounded-full bg-white text-[#5D4037] text-sm font-semibold shadow-md border border-[#5D4037]/20 flex items-center gap-2"
                    >
                      <span>View on OpenSea</span>
                    </motion.button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}



