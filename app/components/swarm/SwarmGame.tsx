'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { useSwarmEngine } from '@/app/lib/swarm/useSwarmEngine'
import { getVersion } from '@/app/lib/swarm/versions'
import { buildRepoReplay, DEFAULT_SWARM_REPO, type RepoReplayPayload } from '@/app/lib/swarm/repoReplay'
import type { CameraMode, SwarmVersionId } from '@/app/lib/swarm/types'
import MobileHUD from './MobileHUD'

const SwarmScene = dynamic(() => import('./SwarmScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-sky-200 text-slate-800">
      <Loader2 className="h-8 w-8 animate-spin text-sky-700" />
      <p className="text-sm text-slate-700">Booting swarm city…</p>
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
  const fallbackReplay = useMemo(() => buildRepoReplay(), [])
  const [replay, setReplay] = useState<RepoReplayPayload>(fallbackReplay)
  const [versionId, setVersionId] = useState<SwarmVersionId>('board')
  const [missionId, setMissionId] = useState('auth-leak')
  const [cameraMode, setCameraMode] = useState<CameraMode>('orbit')
  const [followId, setFollowId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [hd, setHd] = useState(true)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [resetNonce, setResetNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/swarm-repo?repo=${encodeURIComponent(DEFAULT_SWARM_REPO)}`)
      .then((response) => response.json())
      .then((data: RepoReplayPayload) => {
        if (!cancelled && data?.buildings?.length && data.mission) {
          setReplay(data)
        }
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  const catalog = useMemo(
    () =>
      versionId === 'repo'
        ? {
            buildings: replay.buildings,
            missions: [replay.mission],
            repoName: replay.name,
          }
        : undefined,
    [replay, versionId],
  )

  const { snapshot, restart, agents } = useSwarmEngine(missionId, speed, playing, catalog)
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
    setMissionId(id === 'repo' ? 'repo-replay' : 'auth-leak')
  }

  return (
    <div ref={rootRef} className="relative h-dvh w-full overflow-hidden bg-sky-200 touch-none overscroll-none">
      <SwarmScene
        snapshot={snapshot}
        agents={agents}
        theme={theme}
        cameraMode={cameraMode}
        followId={followId}
        selectedBuildingId={selectedBuildingId}
        portrait={portrait}
        resetNonce={resetNonce}
        hd={hd}
        eventSource={rootRef}
        onSelectBuilding={setSelectedBuildingId}
        onSelectAgent={handleFollow}
      />
      <MobileHUD
        snapshot={snapshot}
        agents={agents}
        theme={theme}
        missionId={missionId}
        extraMissions={catalog?.missions}
        cameraMode={cameraMode}
        followId={followId}
        playing={playing}
        speed={speed}
        hd={hd}
        repoName={snapshot.repoName ?? (versionId === 'repo' ? replay.name : null)}
        liveRepo={versionId === 'repo' ? replay.live : false}
        onVersion={handleVersion}
        onMission={setMissionId}
        onCamera={handleCamera}
        onFollow={handleFollow}
        onPlaying={setPlaying}
        onSpeed={setSpeed}
        onHd={setHd}
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
