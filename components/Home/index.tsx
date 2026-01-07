'use client'

import { FarcasterActions } from '@/components/Home/FarcasterActions'
import { User } from '@/components/Home/User'
import { WalletActions } from '@/components/Home/WalletActions'
import { NotificationActions } from './NotificationActions'
import CustomOGImageAction from './CustomOGImageAction'
import { Haptics } from './Haptics'
import { RootsOfYou } from '@/components/RootsOfYou/RootsOfYou'
import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useFrame } from '@/components/farcaster-provider'

export function Demo() {
  const { isConnected } = useAccount()
  const { actions } = useFrame()
useEffect(()=>{
  if(isConnected){
    actions?.addFrame()
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
},[isConnected])

  return (
      <div className="">
        <RootsOfYou />
    </div>
  )
}
