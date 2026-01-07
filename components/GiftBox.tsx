'use client'

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faCoins, faTimes, faCheck, faStar, faCheckCircle, faExclamationTriangle, faFaceFrown, faUserPlus, faUserCheck, faShareNodes, faRocket } from '@fortawesome/free-solid-svg-icons';
import { useAccount } from 'wagmi';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { authenticatedFetch } from '@/lib/auth';
import { useContractWrite, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, TOKEN_REWARD_ABI } from '@/lib/contracts';
// Removed unused APP_URL import
import { motion, AnimatePresence } from 'framer-motion';

interface GiftBoxProps {
  onClose: () => void;
  onClaimComplete: () => void;
}

interface GiftBoxReward {
  tokenType: 'usdc' | 'pepe' | 'crsh' | 'boop' | 'none';
  amount: number;
  amountInWei?: string;
  signature?: string;
  claimsToday: number;
  remainingClaims: number;
}

export default function GiftBox({ onClose, onClaimComplete }: GiftBoxProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState<GiftBoxReward | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [boxAnimation, setBoxAnimation] = useState<'idle' | 'shaking' | 'opening' | 'opened'>('idle');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [isFollowingVerified, setIsFollowingVerified] = useState(false);
  const [isCheckingFollow, setIsCheckingFollow] = useState(false);
  const [hasCheckedFollow, setHasCheckedFollow] = useState(false);
  const [todayClaim, setTodayClaim] = useState<{ tokenType: string; amount: number; timestamp: number } | null>(null);
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState<string>('');
  const [hasSharedTree, setHasSharedTree] = useState(false);
  const [hasSeenPartyFrame, setHasSeenPartyFrame] = useState(false);
  
  const { address } = useAccount();
  const { context, actions } = useMiniAppContext();
  
  // Blockchain transaction for claiming tokens
  const { writeContract: writeClaimToken, data: claimTx, isSuccess: claimSuccess, isError: claimError, error: claimErrorObj } = useContractWrite();
  const { isLoading: isClaimLoading, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({ hash: claimTx });

  // Check if user is following @aylaaa.eth
  const checkFollowStatus = async () => {
    if (!context?.user?.fid) {
      setError('Please connect your Farcaster account');
      return false;
    }

    setIsCheckingFollow(true);
    setError(null);

    try {
      // Add timestamp to prevent browser caching
      const timestamp = Date.now();
      const response = await fetch(`/api/neynar/check-follow?viewer_fid=${context.user.fid}&_t=${timestamp}`, {
        method: 'GET',
        cache: 'no-store', // Prevent browser caching
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      const data = await response.json();

      if (data.success && data.isFollowing) {
        setIsFollowingVerified(true);
        setHasCheckedFollow(true);
        return true;
      } else {
        setIsFollowingVerified(false);
        setHasCheckedFollow(true);
        return false;
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
      setError('Failed to verify follow status');
      setIsCheckingFollow(false);
      return false;
    } finally {
      setIsCheckingFollow(false);
    }
  };

  // Check if user has already claimed today
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const claims = JSON.parse(localStorage.getItem('giftBoxClaims') || '[]');
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Find today's claim
      const todayClaim = claims.find((claim: any) => claim.date === today);
      
      if (todayClaim) {
        setTodayClaim(todayClaim);
        setShowReward(true);
        setBoxAnimation('opened');
      }
    } catch (error) {
      console.error('Error checking today\'s claim:', error);
    }
  }, []);

  // Calculate time until next claim
  useEffect(() => {
    if (!todayClaim) return;

    const updateCountdown = () => {
      const now = Date.now();
      const claimTime = todayClaim.timestamp;
      const nextClaimTime = claimTime + (24 * 60 * 60 * 1000); // 24 hours
      const timeLeft = nextClaimTime - now;

      if (timeLeft <= 0) {
        setTimeUntilNextClaim('');
        setTodayClaim(null);
        return;
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeUntilNextClaim(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeUntilNextClaim(`${minutes}m ${seconds}s`);
      } else {
        setTimeUntilNextClaim(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [todayClaim]);

  // Check if tree has been shared
  const checkTreeShareStatus = () => {
    if (typeof window === 'undefined' || !context?.user?.fid) return false;
    
    try {
      const treeSharedData = localStorage.getItem('treeShared');
      if (treeSharedData) {
        const shareData = JSON.parse(treeSharedData);
        // Check if share is for current user
        if (shareData.fid === context.user.fid) {
          setHasSharedTree(true);
          return true;
        }
      }
    } catch (error) {
      console.error('Error checking tree share status:', error);
    }
    return false;
  };

  // Check if party frame announcement has been seen
  const checkPartyFrameStatus = () => {
    if (typeof window === 'undefined') return false;
    
    try {
      const partyFrameSeen = localStorage.getItem('partyFrameSeen');
      if (partyFrameSeen) {
        setHasSeenPartyFrame(true);
        return true;
      }
    } catch (error) {
      console.error('Error checking party frame status:', error);
    }
    return false;
  };

  useEffect(() => {
    checkTreeShareStatus();
    checkPartyFrameStatus();
    
    // Listen for storage changes (when tree is shared in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'treeShared') {
        checkTreeShareStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case user shared and came back
    const interval = setInterval(() => {
      checkTreeShareStatus();
    }, 2000); // Check every 2 seconds
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [context?.user?.fid]);

  // Check follow status on component mount
  useEffect(() => {
    if (context?.user?.fid && !hasCheckedFollow && !isCheckingFollow) {
      checkFollowStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context?.user?.fid, hasCheckedFollow]);

  // Generate share image for gift box reward
  const generateShareImage = async (reward: GiftBoxReward): Promise<string | null> => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;

      // Background gradient (matching theme)
      const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
      gradient.addColorStop(0, '#e0f7fa');
      gradient.addColorStop(0.5, '#f1f8e9');
      gradient.addColorStop(1, '#fff3e0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 800);

      // Title
      ctx.fillStyle = '#4d7c36';
      ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎁 Gift Box Reward!', 600, 150);

      // Token info
      const tokenInfo = getTokenInfo(reward.tokenType);
      if (reward.tokenType !== 'none') {
        ctx.fillStyle = '#5D4037';
        ctx.font = '48px system-ui, -apple-system, sans-serif';
        ctx.fillText(`I won ${reward.amount.toLocaleString()} ${tokenInfo.name}!`, 600, 250);
      } else {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '48px system-ui, -apple-system, sans-serif';
        ctx.fillText('Better Luck Next Time!', 600, 250);
      }

      // Draw token icon or gift box
      const iconSize = 200;
      const iconX = 600 - iconSize / 2;
      const iconY = 350;

      if (reward.tokenType !== 'none' && tokenInfo.isSvg) {
        // For SVG, we'll draw a placeholder circle with token color
        ctx.fillStyle = '#2775ca';
        ctx.beginPath();
        ctx.arc(600, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 72px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('$', 600, iconY + iconSize / 2 + 25);
      } else if (reward.tokenType !== 'none') {
        // Load and draw image
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = tokenInfo.icon;
          });
          ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
        } catch (error) {
          console.error('Failed to load token image:', error);
          // Fallback circle
          ctx.fillStyle = '#4d7c36';
          ctx.beginPath();
          ctx.arc(600, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Draw gift box emoji/icon
        ctx.fillStyle = '#9ca3af';
        ctx.font = '200px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('🎁', 600, iconY + iconSize);
      }

      // Footer text
      ctx.fillStyle = '#5D4037';
      ctx.font = '36px system-ui, -apple-system, sans-serif';
      ctx.fillText('Roots of You - Grow Your Social Tree', 600, 700);

      // Convert canvas to blob
      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }

          try {
            // Upload to IPFS
            const formData = new FormData();
            formData.append('file', blob, `gift-box-share-${Date.now()}.png`);

            const uploadResponse = await fetch('/api/ipfs/upload-image', {
              method: 'POST',
              body: formData,
            });

            const uploadResult = await uploadResponse.json();
            
            if (uploadResult.success && uploadResult.ipfsUrl) {
              resolve(uploadResult.ipfsUrl);
            } else {
              console.error('Failed to upload share image:', uploadResult.error);
              resolve(null);
            }
          } catch (error) {
            console.error('Error uploading share image:', error);
            resolve(null);
          }
        }, 'image/png', 0.95);
      });
    } catch (error) {
      console.error('Error generating share image:', error);
      return null;
    }
  };

  // Share winning reward on Farcaster
  const shareWinning = async (reward: GiftBoxReward) => {
    if (!actions) {
      console.error('Farcaster actions not available');
      return;
    }

    try {
      const username = context?.user?.username || 'Anonymous Player';
      const fid = context?.user?.fid;
      const tokenInfo = getTokenInfo(reward.tokenType);
      
      // Fetch top 5 best friends
      let topFriendsTags = '';
      if (fid) {
        try {
          const friendsResponse = await fetch(`/api/neynar/best-friends?fid=${fid}&limit=5`);
          if (friendsResponse.ok) {
            const friendsData = await friendsResponse.json();
            if (friendsData?.users && friendsData.users.length > 0) {
              topFriendsTags = '\n\n' + friendsData.users
                .slice(0, 5)
                .map((friend: any) => friend.username ? `@${friend.username}` : '')
                .filter(Boolean)
                .join(' ');
            }
          }
        } catch (error) {
          console.error('Failed to fetch friends for tagging:', error);
        }
      }
      
      let shareMessage = '';
      
      if (reward.tokenType === 'none') {
        shareMessage = `🎁 Just claimed my FREE gift box from Roots of You! 🌳\n\n💎 Even though I didn't win tokens this time, I'm still HYPED because I just MINTED my FREE Roots of You NFT! 🚀\n\n🔥 This is INSANE - a FREE NFT that maps all my Farcaster friendships! Who else is ready to grow their tree? 🌿${topFriendsTags}`;
      } else {
        shareMessage = `🎁JUST CLAIMED ${reward.amount.toLocaleString()} ${tokenInfo.name} from my FREE gift box AND I MINTED MY FREE ROOTS OF YOU NFT! This is FIRE!\nWho's next to claim and mint? 👀${topFriendsTags}`;
      }

      const websiteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rootsofyou.xyz';
      
      // Generate and upload share image
      const imageUrl = await generateShareImage(reward);

      // Use same logic as tree share - include image URL in embeds
      const embeds: string[] = [websiteUrl];
      if (imageUrl) {
        embeds.push(imageUrl);
      }

      await actions.composeCast({
        text: shareMessage,
        embeds: embeds as [string] | [string, string]
      });
      
      console.log('Successfully shared winning on Farcaster!', { imageUrl });
    } catch (error) {
      console.error('Failed to share winning:', error);
    }
  };

  const openGiftBox = async () => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsOpening(true);
    setError(null);
    
    // Start shaking animation
    setBoxAnimation('shaking');
    
    // Generate particles for opening effect
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5
    }));
    setParticles(newParticles);

    // After shaking, start opening animation
    setTimeout(() => {
      setBoxAnimation('opening');
    }, 1000);

    try {
      const response = await authenticatedFetch('/api/claim-gift-box', {
        method: 'POST',
        body: JSON.stringify({
          userAddress: address,
          fid: context?.user?.fid
        })
      });

      const result = await response.json();

      if (result.success) {
        setReward(result);
        
        // Complete opening animation
        setTimeout(() => {
          setBoxAnimation('opened');
          setShowReward(true);
        }, 1500);
      } else {
        setError(result.error || 'Failed to claim gift box');
        setBoxAnimation('idle');
      }
    } catch (error) {
      console.error('Error claiming gift box:', error);
      setError('Failed to claim gift box');
      setBoxAnimation('idle');
    } finally {
      setIsOpening(false);
    }
  };

  const claimToken = async () => {
    if (!reward || reward.tokenType === 'none' || !reward.signature) {
      // For "Better Luck Next Time" rewards, share on Farcaster before completing
      if (reward && reward.tokenType === 'none') {
        // Store the claim in localStorage even for "none" rewards
        storeGiftBoxClaim(reward);
        
        // Update today's claim state
        setTodayClaim({
          tokenType: reward.tokenType,
          amount: reward.amount,
          timestamp: Date.now()
        });
        
        await shareWinning(reward);
      }
      onClaimComplete();
      return;
    }

    setIsClaiming(true);
    setError(null);

    try {
      const tokenAddress = getTokenAddress(reward.tokenType);
      const amountInWei = BigInt(reward.amountInWei || '0');
      console.log(tokenAddress, amountInWei, reward.signature)
      console.log('Claiming token with:', {
        tokenAddress,
        amountInWei,
        signature: reward.signature
      });
      
      writeClaimToken({
        address: CONTRACT_ADDRESSES.TOKEN_REWARD as `0x${string}`,
        abi: TOKEN_REWARD_ABI,
        functionName: 'claimTokenReward',
        args: [tokenAddress, amountInWei, reward.signature]
      });
    } catch (error: any) {
      console.error('Error claiming token:', error);
      
      // Check if this is a user rejection
      const errorMessage = error?.message || '';
      const isUserRejection = 
        errorMessage.includes('User rejected the request') || 
        errorMessage.includes('user rejected') ||
        errorMessage.includes('denied') || 
        errorMessage.includes('denied transaction') ||
        errorMessage.includes('user denied') || 
        errorMessage.includes('user cancelled');
      
      setError(isUserRejection ? 'Something went wrong. Please try again.' : 'Failed to claim token');
      setIsClaiming(false);
    }
  };

  // Store gift box claim in localStorage
  const storeGiftBoxClaim = (reward: GiftBoxReward) => {
    if (typeof window === 'undefined') return;
    
    try {
      const existingClaims = JSON.parse(localStorage.getItem('giftBoxClaims') || '[]');
      const newClaim = {
        tokenType: reward.tokenType,
        amount: reward.amount,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      };
      
      existingClaims.push(newClaim);
      localStorage.setItem('giftBoxClaims', JSON.stringify(existingClaims));
      
      // Update total rewards
      const existingTotals = JSON.parse(localStorage.getItem('giftBoxTotals') || '{"usdc": 0, "pepe": 0, "boop": 0, "crsh": 0, "totalClaims": 0}');
      existingTotals.totalClaims += 1;
      
      if (reward.tokenType !== 'none') {
        existingTotals[reward.tokenType] += reward.amount;
      }
      
      localStorage.setItem('giftBoxTotals', JSON.stringify(existingTotals));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('giftBoxClaimed', { detail: newClaim }));
      
      console.log('Gift box claim stored in localStorage:', newClaim);
    } catch (error) {
      console.error('Failed to store gift box claim:', error);
    }
  };

  // Handle successful token claim
  useEffect(() => {
    if (isClaimConfirmed && isClaiming && reward) {
      setIsClaiming(false);
      setShowSuccess(true);
      
      // Store the claim in localStorage
      storeGiftBoxClaim(reward);
      
      // Update today's claim state
      const today = new Date().toISOString().split('T')[0];
      setTodayClaim({
        tokenType: reward.tokenType,
        amount: reward.amount,
        timestamp: Date.now()
      });
      
      // Share the winning on Farcaster
      shareWinning(reward);
      
      // Auto close success popup after 5 seconds
      setTimeout(() => {
        onClaimComplete();
      }, 5000);
    }
  }, [isClaimConfirmed, isClaiming, onClaimComplete, reward]);

  // Handle token claim error
  useEffect(() => {
    if (claimError && isClaiming) {
      const errorMessage = claimErrorObj?.message || 'Token claim failed';
      
      // Check if the error is a user rejection
      const isUserRejection = 
        errorMessage.includes('User rejected the request') || 
        errorMessage.includes('user rejected') ||
        errorMessage.includes('denied') || 
        errorMessage.includes('denied transaction') ||
        errorMessage.includes('user denied') || 
        errorMessage.includes('user cancelled');
      
      // Show a generic message for user rejections, otherwise show the specific error
      setError(isUserRejection ? 'Something went wrong. Please try again.' : errorMessage);
      setIsClaiming(false);
    }
  }, [claimError, claimErrorObj, isClaiming]);

  const getTokenAddress = (tokenType: 'usdc' | 'pepe' | 'crsh' | 'boop' | 'none'): string => {
    switch (tokenType) {
      case 'usdc':
        return '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
      case 'pepe':
        return '0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00';
      case 'crsh':
        return '0xe461003E78A7bF4F14F0D30b3ac490701980aB07';
      case 'boop':
        return '0x13A7DeDb7169a17bE92B0E3C7C2315B46f4772B3';
      case 'none':
        throw new Error('Cannot get token address for "none" type');
      default:
        throw new Error('Invalid token type');
    }
  };

  const getTokenInfo = (tokenType: 'usdc' | 'pepe' | 'crsh' | 'boop' | 'none') => {
    switch (tokenType) {
      case 'usdc':
        return { 
          name: '$USDC', 
          color: 'text-blue-400', 
          icon: '/candy/usdc.png',
          isSvg: true,
          svg: (
            <svg xmlns="http://www.w3.org/2000/svg" data-name="86977684-12db-4850-8f30-233a7c267d11" viewBox="0 0 2000 2000" width="80" height="80" style={{ borderRadius: '9999px' }}>
              <path fill="#2775ca" d="M1000 2000c554.17 0 1000-445.83 1000-1000S1554.17 0 1000 0 0 445.83 0 1000s445.83 1000 1000 1000"></path>
              <path fill="#fff" d="M1275 1158.33c0-145.83-87.5-195.83-262.5-216.66-125-16.67-150-50-150-108.34s41.67-95.83 125-95.83c75 0 116.67 25 137.5 87.5 4.17 12.5 16.67 20.83 29.17 20.83h66.66c16.67 0 29.17-12.5 29.17-29.16v-4.17c-16.67-91.67-91.67-162.5-187.5-170.83v-100c0-16.67-12.5-29.17-33.33-33.34h-62.5c-16.67 0-29.17 12.5-33.34 33.34v95.83c-125 16.67-204.16 100-204.16 204.17 0 137.5 83.33 191.66 258.33 212.5 116.67 20.83 154.17 45.83 154.17 112.5s-58.34 112.5-137.5 112.5c-108.34 0-145.84-45.84-158.34-108.34-4.16-16.66-16.66-25-29.16-25h-70.84c-16.66 0-29.16 12.5-29.16 29.17v4.17c16.66 104.16 83.33 179.16 220.83 200v100c0 16.66 12.5 29.16 33.33 33.33h62.5c16.67 0 29.17-12.5 33.34-33.33v-100c125-20.84 208.33-108.34 208.33-220.84"></path>
              <path fill="#fff" d="M787.5 1595.83c-325-116.66-491.67-479.16-370.83-800 62.5-175 200-308.33 370.83-370.83 16.67-8.33 25-20.83 25-41.67V325c0-16.67-8.33-29.17-25-33.33-4.17 0-12.5 0-16.67 4.16-395.83 125-612.5 545.84-487.5 941.67 75 233.33 254.17 412.5 487.5 487.5 16.67 8.33 33.34 0 37.5-16.67 4.17-4.16 4.17-8.33 4.17-16.66v-58.34c0-12.5-12.5-29.16-25-37.5m441.67-1300c-16.67-8.33-33.34 0-37.5 16.67-4.17 4.17-4.17 8.33-4.17 16.67v58.33c0 16.67 12.5 33.33 25 41.67 325 116.66 491.67 479.16 370.83 800-62.5 175-200 308.33-370.83 370.83-16.67 8.33-25 20.83-25 41.67V1700c0 16.67 8.33 29.17 25 33.33 4.17 0 12.5 0 16.67-4.16 395.83-125 612.5-545.84 487.5-941.67-75-237.5-258.34-416.67-487.5-491.67"></path>
            </svg>
          )
        };
      case 'pepe':
        return { name: '$PEPE', color: 'text-green-400', icon: '/candy/2.png', isSvg: false };
      case 'crsh':
        return { name: '$CRSH', color: 'text-purple-400', icon: '/images/icon.jpg', isSvg: false };
      case 'boop':
        return { name: '$BOOP', color: 'text-pink-400', icon: '/candy/1.png', isSvg: false };
      case 'none':
        return { name: 'Better Luck Next Time!', color: 'text-gray-400', icon: '😔', isSvg: false };
      default:
        return { name: 'Unknown', color: 'text-gray-400', icon: '❓', isSvg: false };
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(77, 124, 54, 0.95) 0%, rgba(61, 64, 55, 0.98) 100%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [-20, -100],
              x: [0, Math.random() * 40 - 20]
            }}
            transition={{
              duration: 2,
              delay: particle.delay,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      {/* Main Gift Box Container */}
      <motion.div 
        initial={{ scale: 0.8, rotateY: -15 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative"
        style={{
          maxWidth: '450px',
          width: '100%',
          perspective: '1000px'
        }}
      >
        {/* 3D Gift Box Card */}
        <motion.div 
          className="glass-card neon-glow"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 248, 240, 0.95) 0%, rgba(253, 245, 230, 0.98) 50%, rgba(255, 243, 224, 0.95) 100%)',
            border: '3px solid rgba(77, 124, 54, 0.4)',
            borderRadius: '32px',
            padding: '40px',
            textAlign: 'center',
            position: 'relative',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px -12px rgba(77, 124, 54, 0.4), 0 0 40px rgba(255, 193, 7, 0.3), inset 0 0 30px rgba(255, 255, 255, 0.1)',
            transformStyle: 'preserve-3d'
          }}
          animate={{
            rotateX: boxAnimation === 'shaking' ? [0, -8, 8, -8, 8, 0] : boxAnimation === 'opening' ? [0, 15, 0] : 0,
            rotateY: boxAnimation === 'opening' ? [0, 15, -15, 0] : boxAnimation === 'shaking' ? [0, 5, -5, 5, -5, 0] : 0,
            rotateZ: boxAnimation === 'shaking' ? [0, 3, -3, 3, -3, 0] : 0,
            scale: boxAnimation === 'opening' ? [1, 1.1, 1] : 1,
            y: boxAnimation === 'shaking' ? [0, -5, 5, -5, 5, 0] : 0
          }}
          transition={{
            duration: boxAnimation === 'shaking' ? 1 : boxAnimation === 'opening' ? 0.8 : 0.5,
            ease: "easeInOut"
          }}
        >
          {/* Close button */}
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
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

          <AnimatePresence mode="wait">
            {showSuccess ? (
              // Success State
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateY: -180 }}
                transition={{ duration: 0.6, type: "spring" }}
              >
                <motion.div
                  className="text-8xl mb-6"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <FontAwesomeIcon icon={faCheckCircle} />
                </motion.div>
                
                <motion.h2 
                  className="text-3xl font-black mb-4"
                  style={{ color: '#4d7c36' }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Successfully Claimed!
                </motion.h2>
                
                <motion.p 
                  className="mb-6 text-lg"
                  style={{ color: '#5D4037' }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Your {reward!.amount.toLocaleString()} {getTokenInfo(reward!.tokenType).name} tokens have been claimed successfully!
                </motion.p>
                
                
                <motion.button
                  onClick={onClaimComplete}
                  className="w-full text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300 border-2 border-[#4d7c36]/30"
                  style={{
                    background: 'linear-gradient(135deg, #4d7c36 0%, #5a8a3f 50%, #4d7c36 100%)',
                    boxShadow: '0 10px 30px rgba(77, 124, 54, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                  Continue
                </motion.button>
              </motion.div>
            ) : (!isFollowingVerified || !hasCheckedFollow) ? (
              // Follow Task Screen
              <motion.div
                key="follow-task"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4 }}
              >
                {isCheckingFollow && !hasCheckedFollow ? (
                  // Loading state while checking
                  <>
                    <motion.div
                      className="text-8xl mb-6"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      style={{ color: '#4d7c36' }}
                    >
                      <FontAwesomeIcon icon={faUserCheck} />
                    </motion.div>
                    <motion.h2 
                      className="text-2xl font-black mb-4"
                      style={{ color: '#4d7c36' }}
                    >
                      Checking follow status...
                    </motion.h2>
                  </>
                ) : (
                  <>
                    <motion.div
                      className="text-8xl mb-6"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{ color: '#4d7c36' }}
                    >
                      <FontAwesomeIcon icon={faUserPlus} />
                    </motion.div>

                    <motion.h2 
                      className="text-3xl font-black mb-4"
                      style={{ color: '#4d7c36' }}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      Follow Task
                    </motion.h2>

                    <motion.p 
                      className="mb-6 text-lg"
                      style={{ color: '#5D4037' }}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Follow <span className="font-bold text-[#4d7c36]">@aylaaa.eth</span> on Farcaster to unlock your gift box!
                    </motion.p>
                  </>
                )}

                {error && (
                  <motion.div 
                    className="bg-red-500/20 border border-red-400/30 text-red-300 px-6 py-4 rounded-2xl mb-6"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}

                {!isCheckingFollow && (
                  <>
                    <motion.button
                      onClick={async () => {
                        if (actions?.viewProfile) {
                          // Open @aylaaa.eth profile - FID 268009
                          actions.viewProfile({ fid: 947631 });
                        }
                        // Wait a bit then check follow status
                        setTimeout(async () => {
                          await checkFollowStatus();
                        }, 2000);
                      }}
                      className="w-full text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300 border-2 border-[#4d7c36]/30 mb-4"
                      style={{
                        background: 'linear-gradient(135deg, #4d7c36 0%, #5a8a3f 50%, #4d7c36 100%)',
                        boxShadow: '0 10px 30px rgba(77, 124, 54, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                      }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <FontAwesomeIcon icon={faUserPlus} className="mr-3" />
                      Open @aylaaa.eth Profile
                    </motion.button>

                    <motion.button
                      onClick={checkFollowStatus}
                      disabled={isCheckingFollow}
                      className="w-full text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300 border-2 border-white/30"
                      style={{
                        background: 'linear-gradient(135deg, rgba(77, 124, 54, 0.8), rgba(90, 138, 63, 0.8))',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                        cursor: 'pointer'
                      }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center justify-center">
                        <FontAwesomeIcon icon={faCheckCircle} className="mr-3" />
                        Verify Follow
                      </div>
                    </motion.button>
                  </>
                )}
              </motion.div>
            ) : todayClaim ? (
              // Already Claimed Today State
              <motion.div
                key="already-claimed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4 }}
              >
                {/* Gift Box Icon at Top */}
                <motion.div 
                  className="mb-6"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                >
                  <motion.div
                    className="text-7xl"
                    style={{ color: '#4d7c36' }}
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <FontAwesomeIcon icon={faGift} />
                  </motion.div>
                </motion.div>

                {/* Claimed Amount Display */}
                {todayClaim.tokenType !== 'none' ? (
                  <motion.div 
                    className="mb-6"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    {getTokenInfo(todayClaim.tokenType as 'usdc' | 'pepe' | 'crsh' | 'boop' | 'none').isSvg ? (
                      <motion.div
                        className="w-20 h-20 mx-auto flex items-center justify-center"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                        style={{
                          filter: 'drop-shadow(0 0 20px rgba(77, 124, 54, 0.5))'
                        }}
                      >
                        {getTokenInfo(todayClaim.tokenType as 'usdc' | 'pepe' | 'crsh' | 'boop' | 'none').svg}
                      </motion.div>
                    ) : (
                      <motion.img 
                        src={getTokenInfo(todayClaim.tokenType as 'usdc' | 'pepe' | 'crsh' | 'boop' | 'none').icon} 
                        alt={getTokenInfo(todayClaim.tokenType as 'usdc' | 'pepe' | 'crsh' | 'boop' | 'none').name}
                        className="w-20 h-20 mx-auto object-contain rounded-full"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                        style={{
                          filter: 'drop-shadow(0 0 20px rgba(77, 124, 54, 0.5))'
                        }}
                      />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    className="text-6xl mb-6"
                    style={{ color: '#9ca3af' }}
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <FontAwesomeIcon icon={faFaceFrown} />
                  </motion.div>
                )}

                <motion.h2 
                  className="text-3xl font-black mb-4"
                  style={{ color: '#4d7c36' }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Already Claimed Today!
                </motion.h2>

                {todayClaim.tokenType !== 'none' && (
                  <motion.div
                    className="mb-6"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.div
                      className="text-4xl font-black mb-2"
                      style={{ color: '#4d7c36' }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {todayClaim.amount.toLocaleString()} {getTokenInfo(todayClaim.tokenType as 'usdc' | 'pepe' | 'crsh' | 'boop' | 'none').name}
                    </motion.div>
                    <div className="text-lg" style={{ color: '#5D4037' }}>
                      Claimed Today
                    </div>
                  </motion.div>
                )}

                {/* Time Until Next Claim */}
                {timeUntilNextClaim && (
                  <motion.div 
                    className="mb-6"
                    style={{ color: '#5D4037' }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="text-lg font-semibold">
                      Next claim in: <span style={{ color: '#4d7c36', fontWeight: 'bold' }}>{timeUntilNextClaim}</span>
                    </div>
                  </motion.div>
                )}

                {/* Share Button */}
                <motion.button
                  onClick={() => {
                    const mockReward: GiftBoxReward = {
                      tokenType: todayClaim.tokenType as 'usdc' | 'pepe' | 'crsh' | 'boop' | 'none',
                      amount: todayClaim.amount,
                      claimsToday: 1,
                      remainingClaims: 0
                    };
                    shareWinning(mockReward);
                  }}
                  className="w-full text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all duration-300 border-2 border-[#4d7c36]/30"
                  style={{
                    background: 'linear-gradient(135deg, rgba(77, 124, 54, 0.8) 0%, rgba(90, 138, 63, 0.8) 50%, rgba(77, 124, 54, 0.8) 100%)',
                    boxShadow: '0 8px 20px rgba(77, 124, 54, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center justify-center">
                    <FontAwesomeIcon icon={faShareNodes} className="mr-3" style={{ color: '#ffffff' }} />
                    Share on Farcaster
                  </div>
                </motion.button>
              </motion.div>
            ) : !hasSeenPartyFrame && isFollowingVerified && hasSharedTree ? (
              // Party Frame Announcement
              <motion.div
                key="party-frame"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4 }}
              >
          

                <motion.h2 
                  className="text-3xl font-black mb-4"
                  style={{ 
                    color: '#4d7c36',
                    background: 'linear-gradient(135deg, #4d7c36, #ff6b35)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  🔥 EXCLUSIVE ALERT! 🔥
                </motion.h2>

                <motion.div 
                  className="mb-6 space-y-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
          
                  <p className="text-lg font-semibold" style={{ color: '#5D4037' }}>
                  FREE NFT |  FCFS - Only for Roots of You Holders!
                  </p>
                  <p className="text-base" style={{ color: '#5D4037' }}>
                    Don't miss out on this LIMITED opportunity! Claim your exclusive party frame NOW before it's gone! 🚀
                  </p>
                  
                  <motion.div
                    className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border-2 border-yellow-400/40 rounded-xl p-4"
                    animate={{ 
                      boxShadow: ['0 0 20px rgba(255, 193, 7, 0.3)', '0 0 40px rgba(255, 193, 7, 0.6)', '0 0 20px rgba(255, 193, 7, 0.3)']
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <p className="text-sm font-bold" style={{ color: '#5D4037' }}>
                      ⚡ Limited Time Offer - First Come, First Served! ⚡
                    </p>
                  </motion.div>
                </motion.div>

                <motion.button
                  onClick={() => {
                    // Store in localStorage
                    try {
                      localStorage.setItem('partyFrameSeen', 'true');
                      setHasSeenPartyFrame(true);
                    } catch (error) {
                      console.error('Error storing party frame status:', error);
                    }
                    
                    // Open mini app
                    if (actions?.openMiniApp) {
                      actions.openMiniApp({
                        url: 'https://farcaster.xyz/miniapps/Msv27pssuYPE/party-frame'
                      });
                    }
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
                  onClick={() => {
                    // Just mark as seen and continue
                    try {
                      localStorage.setItem('partyFrameSeen', 'true');
                      setHasSeenPartyFrame(true);
                    } catch (error) {
                      console.error('Error storing party frame status:', error);
                    }
                  }}
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
            ) : !showReward ? (
              // Gift Box Closed State
              <motion.div
                key="closed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4 }}
              >
                {/* Check if tree has been shared first */}
                {!hasSharedTree && isFollowingVerified ? (
                  <>
                    <motion.div
                      className="text-8xl mb-6"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                      style={{ color: '#4d7c36' }}
                    >
                      <FontAwesomeIcon icon={faShareNodes} />
                    </motion.div>
                    <motion.h2
                      className="text-3xl font-black mb-4"
                      style={{ color: '#4d7c36' }}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Share Your Tree First!
                    </motion.h2>
                    <motion.p
                      className="mb-8 text-lg"
                      style={{ color: '#5D4037' }}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Share your minted tree on Farcaster to unlock your gift box! Go back to your tree and click the "Share Tree" button.
                    </motion.p>
                    <motion.button
                      onClick={onClose}
                      className="w-full text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300 border-2 border-[#4d7c36]/30"
                      style={{
                        background: 'linear-gradient(135deg, #4d7c36 0%, #5a8a3f 50%, #4d7c36 100%)',
                        boxShadow: '0 10px 30px rgba(77, 124, 54, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                      }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center justify-center">
                        <FontAwesomeIcon icon={faShareNodes} className="mr-3" />
                        Go to Tree
                      </div>
                    </motion.button>
                  </>
                ) : (
                  <>
                    {/* 3D Gift Box Icon */}
                    <motion.div 
                      className="relative mb-8"
                      animate={{
                        rotateY: boxAnimation === 'shaking' ? [0, 15, -15, 15, -15, 0] : 0,
                        scale: boxAnimation === 'opening' ? [1, 1.2, 1] : 1
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.div
                        className="text-9xl relative"
                        style={{
                          filter: 'drop-shadow(0 0 30px rgba(255, 193, 7, 0.6)) drop-shadow(0 0 15px rgba(77, 124, 54, 0.4))',
                          transformStyle: 'preserve-3d',
                          color: '#4d7c36'
                        }}
                        animate={{
                          rotateX: boxAnimation === 'opening' ? [0, 45, 0] : 0,
                          rotateZ: boxAnimation === 'shaking' ? [0, 5, -5, 5, -5, 0] : 0,
                          scale: boxAnimation === 'idle' ? [1, 1.05, 1] : 1
                        }}
                        transition={{
                          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        }}
                      >
                        <FontAwesomeIcon icon={faGift} />
                      </motion.div>
                      
                      {/* Sparkle effects around the box */}
                      {boxAnimation === 'opening' && (
                        <>
                          {[...Array(8)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute text-yellow-400"
                              style={{
                                left: '50%',
                                top: '50%',
                                transform: `rotate(${i * 45}deg) translateY(-100px)`
                              }}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ 
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0],
                                rotate: [0, 360]
                              }}
                              transition={{
                                duration: 1.5,
                                delay: i * 0.1,
                                ease: "easeOut"
                              }}
                            >
                              <FontAwesomeIcon icon={faStar} />
                            </motion.div>
                          ))}
                        </>
                      )}
                    </motion.div>
                    
                    <motion.h2 
                      className="text-3xl font-black mb-4"
                      style={{ color: '#4d7c36' }}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {isOpening ? 'Opening Gift Box...' : 'Congratulations!'}
                    </motion.h2>
                    
                    <motion.p 
                      className="mb-8 text-lg"
                      style={{ color: '#5D4037' }}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {isOpening 
                        ? 'Your reward is being generated...' 
                        : 'You\'ve earned a gift box! Click to open and claim your reward.'
                      }
                    </motion.p>

                    {error && (
                      <motion.div 
                        className="bg-red-500/20 border border-red-400/30 text-red-300 px-6 py-4 rounded-2xl mb-6"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      >
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                          <span>{error}</span>
                        </div>
                      </motion.div>
                    )}

                    {boxAnimation === 'idle' && (
                      <motion.button
                        onClick={openGiftBox}
                        disabled={isOpening || !hasSharedTree}
                        className="w-full text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300 border-2 border-[#4d7c36]/30"
                        style={{
                          background: hasSharedTree 
                            ? 'linear-gradient(135deg, #4d7c36 0%, #5a8a3f 50%, #4d7c36 100%)'
                            : 'linear-gradient(135deg, #9ca3af, #6b7280)',
                          boxShadow: hasSharedTree 
                            ? '0 10px 30px rgba(77, 124, 54, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                            : '0 10px 30px rgba(0, 0, 0, 0.2)',
                          cursor: (isOpening || !hasSharedTree) ? 'not-allowed' : 'pointer',
                          opacity: (isOpening || !hasSharedTree) ? 0.7 : 1
                        }}
                        whileHover={{ scale: (isOpening || !hasSharedTree) ? 1 : 1.05, y: (isOpening || !hasSharedTree) ? 0 : -2 }}
                        whileTap={{ scale: (isOpening || !hasSharedTree) ? 1 : 0.95 }}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {isOpening ? (
                          <div className="flex items-center justify-center">
                        <motion.div
                              className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full mr-3"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            Opening...
                              </div>
                            ) : (
                          <div className="flex items-center justify-center">
                            <FontAwesomeIcon icon={faGift} className="mr-3" />
                            Open Gift Box
                              </div>
                            )}
                          </motion.button>
                    )}
                  </>
                )}
                    </motion.div>
            ) : (
              // Gift Box Opened State
              <motion.div
                key="opened"
                initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateY: -180 }}
                transition={{ duration: 0.6, type: "spring" }}
              >
                {/* Gift Box Icon at Top */}
                <motion.div 
                  className="mb-6"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                >
                  <motion.div
                    className="text-7xl"
                    style={{ color: '#4d7c36' }}
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <FontAwesomeIcon icon={faGift} />
                  </motion.div>
                </motion.div>

                {/* Reward Display */}
                <motion.div 
                  className="mb-6"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  {reward!.tokenType !== 'none' ? (
                    getTokenInfo(reward!.tokenType).isSvg ? (
                      <motion.div
                        className="w-20 h-20 mx-auto flex items-center justify-center"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                        style={{
                          filter: 'drop-shadow(0 0 20px rgba(77, 124, 54, 0.5))'
                        }}
                      >
                        {getTokenInfo(reward!.tokenType).svg}
                      </motion.div>
                    ) : (
                      <motion.img 
                        src={getTokenInfo(reward!.tokenType).icon} 
                        alt={getTokenInfo(reward!.tokenType).name}
                        className="w-20 h-20 mx-auto object-contain rounded-full"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                        style={{
                          filter: 'drop-shadow(0 0 20px rgba(77, 124, 54, 0.5))'
                        }}
                      />
                    )
                  ) : (
                    <motion.div
                      className="text-6xl"
                      style={{ color: '#9ca3af' }}
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    >
                      <FontAwesomeIcon icon={faFaceFrown} />
                    </motion.div>
                  )}
              </motion.div>

                <motion.h2 
                  className="text-3xl font-black mb-4"
                  style={{
                    color: reward!.tokenType === 'usdc' ? '#60a5fa' :
                           reward!.tokenType === 'pepe' ? '#4ade80' :
                           reward!.tokenType === 'crsh' ? '#c4b5fd' :
                           '#9ca3af'
                  }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {getTokenInfo(reward!.tokenType).name}
                </motion.h2>

                {reward!.tokenType !== 'none' && (
              <motion.div
                    className="mb-8"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
              >
                <motion.div
                      className="text-4xl font-black mb-2"
                      style={{ color: '#4d7c36' }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {reward!.amount.toLocaleString()}
                    </motion.div>
                    <div className="text-lg" style={{ color: '#5D4037' }}>
                      {getTokenInfo(reward!.tokenType).name} Tokens
                    </div>
                  </motion.div>
                )}

            

                {error && (
                  <motion.div 
                    className="bg-red-500/20 border border-red-400/30 text-red-300 px-6 py-4 rounded-2xl mb-6"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">⚠️</span>
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}

                  <motion.button
                  onClick={claimToken}
                  disabled={isClaiming || isClaimLoading}
                  className="w-full text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300 border-2 border-[#4d7c36]/30"
                  whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  style={{
                    cursor: (isClaiming || isClaimLoading) ? 'not-allowed' : 'pointer',
                    opacity: (isClaiming || isClaimLoading) ? 0.7 : 1,
                    background: (isClaiming || isClaimLoading)
                      ? 'linear-gradient(135deg, #4b5563, #374151)'
                      : reward!.tokenType === 'none'
                      ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
                      : 'linear-gradient(135deg, #4d7c36 0%, #5a8a3f 50%, #4d7c36 100%)',
                    boxShadow: (isClaiming || isClaimLoading) || reward!.tokenType === 'none'
                      ? '0 10px 30px rgba(0, 0, 0, 0.2)'
                      : '0 10px 30px rgba(77, 124, 54, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {isClaiming || isClaimLoading ? (
                    <div className="flex items-center justify-center">
                      <motion.div
                        className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full mr-3"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Claiming...
                    </div>
                  ) : reward!.tokenType === 'none' ? (
                    <div className="flex items-center justify-center">
                      <FontAwesomeIcon icon={faCheck} className="mr-3" />
                      Continue
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <FontAwesomeIcon icon={faCoins} className="mr-3" />
                      Claim Tokens
                  </div>
                )}
                </motion.button>

                {/* Share Button at Bottom */}
                <motion.button
                  onClick={() => shareWinning(reward!)}
                  className="w-full text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all duration-300 border-2 border-[#4d7c36]/30 mt-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(77, 124, 54, 0.8) 0%, rgba(90, 138, 63, 0.8) 50%, rgba(77, 124, 54, 0.8) 100%)',
                    boxShadow: '0 8px 20px rgba(77, 124, 54, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="flex items-center justify-center">
                    <FontAwesomeIcon icon={faShareNodes} className="mr-3" style={{ color: '#ffffff' }} />
                    Share on Farcaster
                  </div>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
