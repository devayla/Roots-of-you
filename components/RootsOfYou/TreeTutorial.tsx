'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTree,
  faLeaf,
  faHeart,
  faLink,
  faStar,
} from '@fortawesome/free-solid-svg-icons'

interface TutorialStep {
  title: string
  text: string
  pointerX: number // Percentage from left
  pointerY: number // Percentage from top
  pointerAngle?: number // Rotation angle for pointer
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Welcome to Roots of You',
    text: 'This is your living friendship tree. The trunk at the bottom is you, and every branch and glow around it is generated from your real Farcaster relationships.',
    pointerX: 50,
    pointerY: 88,
    pointerAngle: -90,
  },
  {
    title: 'Leaves as Friends',
    text: 'Each leaf is a friend. Bigger, closer leaves mean stronger mutual affinity; smaller, outer leaves are lighter connections. Tap a leaf to zoom into that friend and grow an entirely new tree around them.',
    pointerX: 75,
    pointerY: 35,
    pointerAngle: -30,
  },
  {
    title: 'Mint Your Tree',
    text: 'You can mint this whole tree as a free NFT, permanently capturing how your Farcaster graph looks today. One token, one unique arrangement of friends, locked on-chain as a snapshot of your social roots.',
    pointerX: 50,
    pointerY: 50,
    pointerAngle: 0,
  },
  {
    title: 'Mint Friend Trees',
    text: 'Jump into a friend’s tree and mint their roots for them too. When you mint someone else’s tree, they receive the NFT in their wallet — a gift that celebrates your connection and their place in the network.',
    pointerX: 25,
    pointerY: 30,
    pointerAngle: 60,
  },
  {
    title: 'Share & Show It Off',
    text: 'Use the share button to cast your tree on Farcaster with an auto-generated image. Invite others to grow and mint their own trees so the whole graph becomes a forest of social memories.',
    pointerX: 10,
    pointerY: 80,
    pointerAngle: 0,
  },
]

interface TreeTutorialProps {
  isOpen: boolean
  onClose: () => void
}

export function TreeTutorial({ isOpen, onClose }: TreeTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const currentStepData = tutorialSteps[currentStep]

  // Typewriter effect
  useEffect(() => {
    if (!isOpen) {
      setDisplayedText('')
      return
    }

    setIsTyping(true)
    setDisplayedText('')
    let currentIndex = 0

    const typeInterval = setInterval(() => {
      if (currentIndex < currentStepData.text.length) {
        setDisplayedText(currentStepData.text.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsTyping(false)
        clearInterval(typeInterval)
      }
    }, 30) // Adjust speed here (lower = faster)

    return () => clearInterval(typeInterval)
  }, [currentStep, isOpen, currentStepData.text])

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {/* Dim overlay - sits above tree controls and blurs them */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/25 backdrop-blur-md z-60 pointer-events-auto"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
      >
        {/* Speech Bubble / Cloud - Centered */}
        <motion.div
          key={`bubble-${currentStep}`}
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-[420px] max-w-[90vw] pointer-events-auto"
        >
          <div className="relative bg-gradient-to-br from-white via-white to-[#fff8f0] backdrop-blur-lg rounded-3xl shadow-2xl border-2 border-[#5D4037]/30 p-6">
            {/* Decorative cloud elements */}
            <div className="absolute -top-2 -right-2 w-16 h-16 bg-white/60 rounded-full blur-xl" />
            <div className="absolute -bottom-2 -left-2 w-20 h-20 bg-white/40 rounded-full blur-xl" />

            {/* Title with icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-2xl bg-[#5D4037]/10 flex items-center justify-center text-[#5D4037]">
                {currentStep === 0 && <FontAwesomeIcon icon={faTree} className="w-4 h-4" />}
                {currentStep === 1 && <FontAwesomeIcon icon={faLeaf} className="w-4 h-4" />}
                {currentStep === 2 && <FontAwesomeIcon icon={faStar} className="w-4 h-4" />}
                {currentStep === 3 && <FontAwesomeIcon icon={faHeart} className="w-4 h-4" />}
                {currentStep === 4 && <FontAwesomeIcon icon={faLink} className="w-4 h-4" />}
              </div>
              <h3 className="text-2xl font-bold text-[#3E2723] font-serif tracking-tight">
                {currentStepData.title}
              </h3>
            </div>

            {/* Typewriter Text */}
            <div className="min-h-[140px] mb-2">
              <p className="text-[#5D4037] text-base leading-relaxed font-medium">
                {displayedText}
                {isTyping && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-1 h-5 bg-[#5D4037] ml-1 align-middle"
                  />
                )}
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex gap-2 mb-4 justify-center">
              {tutorialSteps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 rounded-full ${
                    index === currentStep
                      ? 'bg-[#5D4037] w-8'
                      : 'bg-[#5D4037]/30 w-2'
                  }`}
                  initial={false}
                  animate={{
                    width: index === currentStep ? 32 : 8,
                    backgroundColor:
                      index === currentStep
                        ? '#5D4037'
                        : 'rgba(93, 64, 55, 0.3)',
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  currentStep === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#5D4037] text-white hover:bg-[#3E2723] hover:scale-105'
                }`}
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2 rounded-full font-semibold bg-[#5D4037] text-white hover:bg-[#3E2723] hover:scale-105 transition-all shadow-lg"
              >
                {currentStep === tutorialSteps.length - 1 ? 'Got it! ✓' : 'Next →'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 backdrop-blur-lg shadow-lg flex items-center justify-center text-[#5D4037] hover:bg-white hover:scale-110 transition-all pointer-events-auto border-2 border-[#5D4037]/30 font-bold text-lg"
          aria-label="Close tutorial"
        >
          ✕
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

