'use client'

import Link from 'next/link'
import {
  Gamepad2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
} from 'lucide-react'
import type { AgentDef, CameraMode, SwarmVersionId, VersionTheme, WorldSnapshot } from '@/app/lib/swarm/types'
import { MISSIONS } from '@/app/lib/swarm/flows'
import { VERSIONS } from '@/app/lib/swarm/versions'

interface MobileHUDProps {
  snapshot: WorldSnapshot
  agents: AgentDef[]
  theme: VersionTheme
  missionId: string
  cameraMode: CameraMode
  followId: string | null
  playing: boolean
  speed: number
  showLog: boolean
  onVersion: (id: SwarmVersionId) => void
  onMission: (id: string) => void
  onCamera: (mode: CameraMode) => void
  onFollow: (id: string | null) => void
  onPlaying: (playing: boolean) => void
  onSpeed: (speed: number) => void
  onRestart: () => void
  onToggleLog: () => void
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
  showLog,
  onVersion,
  onMission,
  onCamera,
  onFollow,
  onPlaying,
  onSpeed,
  onRestart,
  onToggleLog,
}: MobileHUDProps) {
  const activeAgent = snapshot.agents.find((a) => a.id === (followId ?? snapshot.activeStep?.agent))
  const mission = MISSIONS.find((m) => m.id === missionId)

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="rounded-full bg-black/45 px-3 py-1.5 text-xs text-white backdrop-blur-md"
          >
            Back
          </Link>
          <div className="flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-white backdrop-blur-md">
            <Gamepad2 className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold tracking-tight">Swarm City</span>
            <span className="rounded-full bg-emerald-500/30 px-1.5 py-0.5 text-[10px] uppercase">dev</span>
          </div>
          <button
            type="button"
            onClick={onToggleLog}
            className="rounded-full bg-black/45 p-2 text-white backdrop-blur-md"
            aria-label="Toggle simulated tool log"
          >
            <Terminal className="h-4 w-4" />
          </button>
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {VERSIONS.map((version) => (
            <button
              key={version.id}
              type="button"
              onClick={() => onVersion(version.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs backdrop-blur-md ${
                theme.id === version.id
                  ? 'bg-fuchsia-500 text-white'
                  : 'bg-black/40 text-white/80'
              }`}
            >
              {version.label}
            </button>
          ))}
        </div>
        <p className="px-1 text-[11px] text-white/70">{theme.tagline}</p>
      </div>

      {showLog && (
        <div className="pointer-events-auto mx-auto mb-2 max-h-40 w-full max-w-lg overflow-auto rounded-xl bg-black/70 p-3 font-mono text-[11px] leading-relaxed text-emerald-300 backdrop-blur-md">
          <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-200/80">
            <Sparkles className="h-3 w-3" />
            simulateReadableStream · no API
          </div>
          {snapshot.log.map((line, i) => (
            <div key={`${line}-${i}`} className={line.startsWith('    ') ? 'text-white/70' : ''}>
              {line}
            </div>
          ))}
        </div>
      )}

      <div className="pointer-events-auto space-y-2">
        <div className="rounded-2xl bg-black/50 p-3 text-white backdrop-blur-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/50">Mission</p>
              <p className="text-sm font-semibold">{mission?.title}</p>
              <p className="text-[11px] text-white/70">{activeAgent?.status ?? mission?.blurb}</p>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onPlaying(!playing)}
                className="rounded-full bg-white/10 p-2"
                aria-label={playing ? 'Pause simulation' : 'Play simulation'}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="rounded-full bg-white/10 p-2"
                aria-label="Restart mission"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-2 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MISSIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onMission(item.id)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${
                  missionId === item.id ? 'bg-white text-black' : 'bg-white/10'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {agents.map((agent) => {
            const live = snapshot.agents.find((a) => a.id === agent.id)
            const active = followId === agent.id
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => onFollow(active ? null : agent.id)}
                className={`min-w-[4.6rem] flex-1 rounded-2xl px-2 py-2 text-left backdrop-blur-md ${
                  active ? 'bg-white text-black' : 'bg-black/45 text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: agent.color }}
                  />
                  <span className="text-[11px] font-semibold">{agent.name}</span>
                </div>
                <p className={`mt-0.5 text-[10px] ${active ? 'text-black/60' : 'text-white/60'}`}>
                  {agent.version}
                </p>
                <p className={`truncate text-[10px] ${active ? 'text-black/70' : 'text-white/70'}`}>
                  {live?.kind ?? 'idle'}
                </p>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-black/45 px-3 py-2 text-white backdrop-blur-md">
          {(['orbit', 'follow', 'cinematic'] as CameraMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onCamera(mode)}
              className={`rounded-full px-2.5 py-1 text-[11px] capitalize ${
                cameraMode === mode ? 'bg-fuchsia-500' : 'bg-white/10'
              }`}
            >
              {mode === 'cinematic' ? 'fly' : mode}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-[11px] text-white/70">
            spd
            <input
              type="range"
              min={0.4}
              max={2.4}
              step={0.1}
              value={speed}
              onChange={(e) => onSpeed(Number(e.target.value))}
              className="w-20 accent-fuchsia-400"
            />
          </label>
        </div>
      </div>
    </div>
  )
}
