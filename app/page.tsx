import App from '@/components/pages/app'
import { APP_URL } from '@/lib/constants'
import type { Metadata } from 'next'

const frame = {
  version: 'next',
  imageUrl: `${APP_URL}/images/feed.jpg`,
  button: {
    title: 'Grow My Tree',
    action: {
      type: 'launch_frame',
      name: 'Roots of You',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.jpg`,
      splashBackgroundColor: '#ffffff',
    },
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Roots of You | Farcaster Social Tree',
    openGraph: {
      title: 'Roots of You | Farcaster Social Tree',
      description: 'Visualize your Farcaster connections as a unique, growing tree. Mint your social graph as a free NFT on Base.',
    },
    other: {
      'fc:frame': JSON.stringify(frame),
      'base:app_id': '695be2eec63ad876c9082207',


    },
  }
}

export default function Home() {
  return <App />
}
