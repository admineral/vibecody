import type { Metadata, Viewport } from 'next'
import SwarmGame from '@/app/components/swarm/SwarmGame'

export const metadata: Metadata = {
  title: 'Swarm City — DocAI',
  description:
    'A professional 3D code universe: agents scan modules, lift coding cards, and open live CodeSandbox previews.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Swarm City',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0b0f14',
}

export default function SwarmPage() {
  return <SwarmGame />
}
