'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react'
import type { AgentDef, CameraMode, SwarmVersionId, VersionTheme, WorldSnapshot } from '@/app/lib/swarm/types'
import { MISSIONS } from '@/app/lib/swarm/flows'
import { VERSIONS } from '@/app/lib/swarm/versions'

type Sheet = 'none' | 'menu' | 'log'

interface MobileHUDProps {
  snapshot: WorldSnapshot
  agents: AgentDef[]
  theme: VersionTheme
  missionId: string
  cameraMode: CameraMode
  followId: string | null
  playing: boolean
  speed: number
  onVersion: (id: SwarmVersionId) => void
  onMission: (id: string) => void
  onCamera: (mode: CameraMode) => void
  onFollow: (id: string | null) => void
  onPlaying: (playing: boolean) => void
  onSpeed: (speed: number) => void
  onRestart: () => void
}

export default function MobileHUD({
  snapshot,
  agents,
  theme,
  missionId,
  cameraMode,
  followId,
  playing,
  speed,
  onVersion,
  onMission,
  onCamera,
  onFollow,
  onPlaying,
  onSpeed,
  onRestart,
}: MobileHUDProps) {
  const [sheet, setSheet] = useState<Sheet>('none')
  const activeAgent = snapshot.agents.find((a) => a.id === (followId ?? snapshot.activeStep?.agent))
  const mission = MISSIONS.find((m) => m.id === missionId)
  const missionIndex = Math.max(0, MISSIONS.findIndex((m) => m.id === missionId))
  const progress = mission ? Math.min(1, snapshot.time / mission.duration) : 0
  const followed = agents.find((a) => a.id === followId) ?? agents.find((a) => a.id === activeAgent?.id)
  const latestTool = snapshot.log.find((line) => line.startsWith('[dev]'))

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/70 to-transparent" />

      <div className="absolute inset-x-0 top-0 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="mb-2 flex gap-1">
          {MISSIONS.map((item, i) => (
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
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <p className="text-[11px] font-medium tracking-wide text-white/80">
            {mission?.title}
          </p>
          <button
            type="button"
            onClick={() => onPlaying(!playing)}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="absolute top-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))] right-2 flex flex-col items-center gap-2">
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
          className="pointer-events-auto mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md"
          aria-label="Dev log"
        >
          <Terminal className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setSheet('menu')}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md"
          aria-label="Game menu"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-16">
        <div className="pointer-events-auto max-w-[78%]">
          <p className="text-sm font-semibold text-white">
            @{followed?.name ?? 'Swarm'}
            <span className="ml-2 text-[11px] font-normal text-white/60">{followed?.version}</span>
          </p>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-white/90">
            {activeAgent?.status ?? mission?.blurb}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] hidden justify-center landscape:flex md:hidden">
        <p className="rounded-full bg-black/55 px-3 py-1.5 text-[11px] text-white backdrop-blur-md">
          Hochkant · rotate your phone
        </p>
      </div>

      {sheet !== 'none' && (
        <div className="pointer-events-auto absolute inset-0 z-20 flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Close sheet"
            onClick={() => setSheet('none')}
          />
          <div className="relative max-h-[55dvh] overflow-auto rounded-t-3xl bg-[#0b0b12] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-white">
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
                        className={`rounded-full px-3 py-1.5 text-xs ${
                          theme.id === version.id ? 'bg-fuchsia-500' : 'bg-white/10'
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
                    {MISSIONS.map((item) => (
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
                  {(['orbit', 'follow', 'cinematic'] as CameraMode[]).map((mode) => {
                    const label = theme.chipMode
                      ? mode === 'orbit'
                        ? 'sat'
                        : mode === 'follow'
                          ? 'e−'
                          : 'super'
                      : mode === 'cinematic'
                        ? 'fly'
                        : mode
                    return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onCamera(mode)}
                      className={`rounded-full px-3 py-1.5 text-xs capitalize ${
                        cameraMode === mode ? 'bg-fuchsia-500' : 'bg-white/10'
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
                    className="flex-1 accent-fuchsia-400"
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
