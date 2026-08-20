'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { useSwarmEngine } from '@/app/lib/swarm/useSwarmEngine'
import { getVersion } from '@/app/lib/swarm/versions'
import type { CameraMode, SwarmVersionId } from '@/app/lib/swarm/types'
import MobileHUD from './MobileHUD'

const SwarmScene = dynamic(() => import('./SwarmScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#05010a] text-white">
      <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" />
      <p className="text-sm text-white/70">Booting swarm city…</p>
    </div>
  ),
})

function usePortrait() {
  const [portrait, setPortrait] = useState(true)
  useEffect(() => {
    const update = () => setPortrait(window.innerHeight >= window.innerWidth)
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])
  return portrait
}

export default function SwarmGame() {
  const rootRef = useRef<HTMLDivElement>(null)
  const portrait = usePortrait()
  const [versionId, setVersionId] = useState<SwarmVersionId>('neon')
  const [missionId, setMissionId] = useState('auth-leak')
  const [cameraMode, setCameraMode] = useState<CameraMode>('orbit')
  const [followId, setFollowId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [resetNonce, setResetNonce] = useState(0)

  const { snapshot, restart, agents } = useSwarmEngine(missionId, speed, playing)
  const theme = useMemo(() => getVersion(versionId), [versionId])

  const handleFollow = (id: string | null) => {
    setFollowId(id)
    setCameraMode(id ? 'follow' : 'orbit')
  }

  const handleCamera = (mode: CameraMode) => {
    setCameraMode(mode)
    if (mode === 'orbit') setFollowId(null)
    if (mode === 'follow') setFollowId((current) => current ?? 'lead')
  }

  const handleVersion = (id: SwarmVersionId) => {
    setVersionId(id)
    setCameraMode('orbit')
    setFollowId(null)
    setResetNonce((n) => n + 1)
  }

  return (
    <div ref={rootRef} className="relative h-dvh w-full overflow-hidden bg-[#05010a] touch-none overscroll-none">
      <SwarmScene
        snapshot={snapshot}
        agents={agents}
        theme={theme}
        cameraMode={cameraMode}
        followId={followId}
        selectedBuildingId={selectedBuildingId}
        portrait={portrait}
        resetNonce={resetNonce}
        eventSource={rootRef}
        onSelectBuilding={setSelectedBuildingId}
        onSelectAgent={handleFollow}
      />
      <MobileHUD
        snapshot={snapshot}
        agents={agents}
        theme={theme}
        missionId={missionId}
        cameraMode={cameraMode}
        followId={followId}
        playing={playing}
        speed={speed}
        onVersion={handleVersion}
        onMission={setMissionId}
        onCamera={handleCamera}
        onFollow={handleFollow}
        onPlaying={setPlaying}
        onSpeed={setSpeed}
        onRestart={() => restart(missionId)}
        onResetView={() => {
          setCameraMode('orbit')
          setFollowId(null)
          setResetNonce((n) => n + 1)
        }}
      />
    </div>
  )
}
