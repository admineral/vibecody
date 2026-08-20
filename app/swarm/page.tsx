import type { Metadata, Viewport } from 'next'
import SwarmGame from '@/app/components/swarm/SwarmGame'

export const metadata: Metadata = {
  title: 'Swarm City — DocAI',
  description:
    'Mobile 3D game: five simulated agents fly a code city, patch modules, and expand the repo — Gource trails, no API.',
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
  themeColor: '#05010a',
}

export default function SwarmPage() {
  return <SwarmGame />
}
