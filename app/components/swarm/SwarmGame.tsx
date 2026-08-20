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
  const [cameraMode, setCameraMode] = useState<CameraMode>('follow')
  const [followId, setFollowId] = useState<string | null>('lead')
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)

  const { snapshot, restart, agents } = useSwarmEngine(missionId, speed, playing)
  const theme = useMemo(() => getVersion(versionId), [versionId])

  const handleFollow = (id: string | null) => {
    setFollowId(id)
    if (id) setCameraMode('follow')
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
        portrait
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
        onVersion={setVersionId}
        onMission={setMissionId}
        onCamera={setCameraMode}
        onFollow={handleFollow}
        onPlaying={setPlaying}
        onSpeed={setSpeed}
        onRestart={() => restart(missionId)}
      />
    </div>
  )
}
