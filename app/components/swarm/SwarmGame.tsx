'use client'

import { useMemo, useState } from 'react'
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

export default function SwarmGame() {
  const [versionId, setVersionId] = useState<SwarmVersionId>('neon')
  const [missionId, setMissionId] = useState('auth-leak')
  const [cameraMode, setCameraMode] = useState<CameraMode>('cinematic')
  const [followId, setFollowId] = useState<string | null>('lead')
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [showLog, setShowLog] = useState(true)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)

  const { snapshot, restart, agents } = useSwarmEngine(missionId, speed, playing)
  const theme = useMemo(() => getVersion(versionId), [versionId])

  const handleFollow = (id: string | null) => {
    setFollowId(id)
    if (id) setCameraMode('follow')
  }

  const handleSelectBuilding = (id: string) => {
    setSelectedBuildingId(id)
  }

  const handleSelectAgent = (id: string) => {
    handleFollow(id)
  }

  const handleMission = (id: string) => {
    setMissionId(id)
    setShowLog(true)
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#05010a]">
      <SwarmScene
        snapshot={snapshot}
        agents={agents}
        theme={theme}
        cameraMode={cameraMode}
        followId={followId}
        selectedBuildingId={selectedBuildingId}
        onSelectBuilding={handleSelectBuilding}
        onSelectAgent={handleSelectAgent}
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
        showLog={showLog}
        onVersion={setVersionId}
        onMission={handleMission}
        onCamera={setCameraMode}
        onFollow={handleFollow}
        onPlaying={setPlaying}
        onSpeed={setSpeed}
        onRestart={() => restart(missionId)}
        onToggleLog={() => setShowLog((v) => !v)}
      />
    </div>
  )
}
