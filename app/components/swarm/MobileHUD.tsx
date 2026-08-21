'use client'

import { useEffect, useState, type PointerEvent } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Eye,
  Film,
  Orbit,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react'
import type { AgentDef, CameraMode, MissionFlow, SwarmVersionId, VersionTheme, WorldSnapshot } from '@/app/lib/swarm/types'
import { MISSIONS } from '@/app/lib/swarm/flows'
import { VERSIONS } from '@/app/lib/swarm/versions'

type Sheet = 'none' | 'menu' | 'log'

interface MobileHUDProps {
  snapshot: WorldSnapshot
  agents: AgentDef[]
  theme: VersionTheme
  missionId: string
  extraMissions?: MissionFlow[]
  cameraMode: CameraMode
  followId: string | null
  playing: boolean
  speed: number
  hd: boolean
  repoName?: string | null
  liveRepo?: boolean
  onVersion: (id: SwarmVersionId) => void
  onMission: (id: string) => void
  onCamera: (mode: CameraMode) => void
  onFollow: (id: string | null) => void
  onPlaying: (playing: boolean) => void
  onSpeed: (speed: number) => void
  onHd: (hd: boolean) => void
  onRestart: () => void
  onResetView: () => void
}

function trapPointer(event: PointerEvent) {
  event.stopPropagation()
}

const CAMERA_MODES: { id: CameraMode; label: string; icon: typeof Orbit }[] = [
  { id: 'orbit', label: 'Look', icon: Orbit },
  { id: 'follow', label: 'Follow', icon: Eye },
  { id: 'cinematic', label: 'Fly', icon: Film },
]

export default function MobileHUD({
  snapshot,
  agents,
  theme,
  missionId,
  extraMissions,
  cameraMode,
  followId,
  playing,
  speed,
  hd,
  repoName,
  liveRepo,
  onVersion,
  onMission,
  onCamera,
  onFollow,
  onPlaying,
  onSpeed,
  onHd,
  onRestart,
  onResetView,
}: MobileHUDProps) {
  const [sheet, setSheet] = useState<Sheet>('none')
  const [hint, setHint] = useState(true)
  const missions = extraMissions?.length
    ? [...extraMissions, ...MISSIONS.filter((item) => !extraMissions.some((extra) => extra.id === item.id))]
    : MISSIONS
  const activeAgent = snapshot.agents.find((a) => a.id === (followId ?? snapshot.activeStep?.agent))
  const mission = missions.find((m) => m.id === missionId)
  const missionIndex = Math.max(0, missions.findIndex((m) => m.id === missionId))
  const progress = mission ? Math.min(1, snapshot.time / mission.duration) : 0
  const followed = agents.find((a) => a.id === followId) ?? agents.find((a) => a.id === activeAgent?.id)
  const latestTool = snapshot.log.find((line) => line.startsWith('[dev]'))

  useEffect(() => {
    const timer = window.setTimeout(() => setHint(false), 5200)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/55 to-transparent" />

      <div
        className="absolute inset-x-0 top-0 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]"
        onPointerDown={trapPointer}
      >
        <div className="mb-2 flex gap-1">
          {missions.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className="pointer-events-auto h-1 flex-1 overflow-hidden rounded-full bg-white/25"
              onClick={() => onMission(item.id)}
              aria-label={item.title}
            >
              <span
                className="block h-full rounded-full bg-white"
                style={{
                  width:
                    i < missionIndex ? '100%' : i === missionIndex ? `${progress * 100}%` : '0%',
                }}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <p className="text-[11px] font-medium tracking-[0.18em] text-white/70">
            {theme.label.toUpperCase()}
          </p>
          <button
            type="button"
            onClick={() => onPlaying(!playing)}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        className="absolute top-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))] left-2 flex flex-col gap-2"
        onPointerDown={trapPointer}
      >
        {CAMERA_MODES.map((item) => {
          const Icon = item.icon
          const active = cameraMode === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onCamera(item.id)}
              className={`pointer-events-auto flex h-11 w-11 flex-col items-center justify-center rounded-full text-white shadow-[0_0_16px_rgba(0,0,0,0.45)] backdrop-blur-md ${
                active ? 'bg-cyan-500' : 'border border-white/10 bg-white/10'
              }`}
              aria-label={item.label}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[8px] font-medium leading-none">{item.label}</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={onResetView}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md"
          aria-label="Reset view"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onHd(!hd)}
          className={`pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full text-[10px] font-bold backdrop-blur-md ${
            hd ? 'bg-cyan-500 text-white' : 'border border-white/10 bg-white/10 text-white'
          }`}
          aria-label="Toggle HD"
        >
          HD
        </button>
      </div>

      <div
        className="absolute top-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))] right-2 flex flex-col items-center gap-2"
        onPointerDown={trapPointer}
      >
        {agents.map((agent) => {
          const active = followId === agent.id
          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => onFollow(active ? null : agent.id)}
              className="pointer-events-auto flex flex-col items-center gap-0.5"
              aria-label={`Follow ${agent.name}`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-black shadow-[0_0_16px_rgba(0,0,0,0.45)] ${
                  active ? 'ring-2 ring-white ring-offset-2 ring-offset-black/40' : ''
                }`}
                style={{ background: agent.color }}
              >
                {agent.glyph}
              </span>
              <span className="max-w-12 truncate text-[9px] font-medium text-white/90">
                {agent.name}
              </span>
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => setSheet('log')}
          className="pointer-events-auto mt-1 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md"
          aria-label="Dev log"
        >
          <Terminal className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setSheet('menu')}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md"
          aria-label="Game menu"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-16">
        {hint && (
          <p className="pointer-events-none mb-2 max-w-[78%] rounded-full bg-black/55 px-3 py-1.5 text-[11px] text-white backdrop-blur-md">
            Drag to look · tap a module to inspect · tap again for the live sandbox
          </p>
        )}
        <div className="pointer-events-auto max-w-[78%]" onPointerDown={trapPointer}>
          <p className="text-sm font-semibold text-white">
            @{followed?.name ?? 'Swarm'}
            <span className="ml-2 text-[11px] font-normal text-white/60">{followed?.version}</span>
          </p>
          {repoName && (
            <p className="text-[10px] text-cyan-200/80">
              {liveRepo ? 'live' : 'synthetic'} · {repoName}
            </p>
          )}
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-white/90">
            {activeAgent?.status ?? mission?.blurb}
          </p>
          <p className="mt-1 max-w-[78%] text-[10px] tracking-wide text-white/45">{theme.tagline}</p>
        </div>
      </div>

      {sheet !== 'none' && (
        <div
          className="pointer-events-auto absolute inset-0 z-20 flex flex-col justify-end"
          onPointerDown={trapPointer}
        >
          <button
            type="button"
            className="absolute inset-0 border border-white/10 bg-white/10"
            aria-label="Close sheet"
            onClick={() => setSheet('none')}
          />
          <div className="relative max-h-[55dvh] overflow-auto rounded-t-3xl border-t border-white/10 bg-[#0b0f14] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-white">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" />
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">
                {sheet === 'log' ? 'Dev stream' : 'Play'}
              </p>
              <button
                type="button"
                onClick={() => setSheet('none')}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {sheet === 'log' ? (
              <div className="font-mono text-[11px] leading-relaxed text-emerald-300">
                <div className="mb-2 flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-200/80">
                  <Sparkles className="h-3 w-3" />
                  simulateReadableStream · no API
                </div>
                {snapshot.log.map((line, i) => (
                  <div key={`${line}-${i}`} className={line.startsWith('    ') ? 'text-white/60' : ''}>
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <section>
                  <p className="mb-2 text-[10px] uppercase tracking-wider text-white/45">Version</p>
                  <div className="flex flex-wrap gap-1.5">
                    {VERSIONS.map((version) => (
                      <button
                        key={version.id}
                        type="button"
                        onClick={() => onVersion(version.id)}
                        title={version.tagline}
                        className={`rounded-full px-3 py-1.5 text-xs ${
                          theme.id === version.id ? 'bg-cyan-500' : 'bg-white/10'
                        }`}
                      >
                        {version.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <p className="mb-2 text-[10px] uppercase tracking-wider text-white/45">Mission</p>
                  <div className="flex flex-col gap-1.5">
                    {missions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onMission(item.id)
                          setSheet('none')
                        }}
                        className={`rounded-2xl px-3 py-2 text-left ${
                          missionId === item.id ? 'bg-white text-black' : 'bg-white/10'
                        }`}
                      >
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className={`text-[11px] ${missionId === item.id ? 'text-black/60' : 'text-white/55'}`}>
                          {item.blurb}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="flex items-center gap-2">
                  {CAMERA_MODES.map((item) => {
                    const label = theme.chipMode
                      ? item.id === 'orbit'
                        ? 'sat'
                        : item.id === 'follow'
                          ? 'e−'
                          : 'super'
                      : item.label
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onCamera(item.id)}
                        className={`rounded-full px-3 py-1.5 text-xs capitalize ${
                          cameraMode === item.id ? 'bg-cyan-500' : 'bg-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={onRestart}
                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
                    aria-label="Restart"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </section>

                <label className="flex items-center gap-3 text-xs text-white/70">
                  Speed
                  <input
                    type="range"
                    min={0.4}
                    max={2.4}
                    step={0.1}
                    value={speed}
                    onChange={(e) => onSpeed(Number(e.target.value))}
                    className="flex-1 accent-cyan-400"
                  />
                  <span className="w-8 text-right font-mono">{speed.toFixed(1)}</span>
                </label>
              </div>
            )}

            {latestTool && sheet === 'menu' && (
              <p className="mt-3 truncate font-mono text-[10px] text-white/40">{latestTool}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
