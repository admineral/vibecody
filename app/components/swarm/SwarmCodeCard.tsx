'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox, Text } from '@react-three/drei'
import { CanvasTexture, Group, LinearFilter, SRGBColorSpace } from 'three'
import type { BuildingState, VersionTheme } from '@/app/lib/swarm/types'
import { themedBuildingPosition } from '@/app/lib/swarm/cityLayout'
import AgentEnergy from './AgentEnergy'
import PageSandbox from './PageSandbox'
import SwarmSandpackCard from './SwarmSandpackCard'

interface SwarmCodeCardProps {
  building: BuildingState
  theme: VersionTheme
  selected: boolean
  hd?: boolean
  onSelect: () => void
}

const IDLE_X = 0
const INSPECT_X = -0.92
const EXPAND_X = -1.28

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function paintCodingCard(
  building: BuildingState,
  theme: VersionTheme,
  hot: boolean,
  expanded: boolean,
  hd: boolean,
) {
  const width = expanded ? 1100 : hd ? 880 : 640
  const height = expanded ? 760 : hd ? 620 : 460
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const dark = theme.dark
  const bg = dark ? '#0d1117' : '#f6f8fa'
  const panel = dark ? '#161b22' : '#ffffff'
  const line = dark ? '#30363d' : '#d0d7de'
  const muted = dark ? '#8b949e' : '#57606a'
  const fg = dark ? '#e6edf3' : '#1f2328'
  const accent = building.hasBug ? '#f85149' : building.color

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = panel
  ctx.fillRect(0, 0, width, 42)
  ctx.fillStyle = '#ff5f57'
  ctx.beginPath()
  ctx.arc(18, 21, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#febc2e'
  ctx.beginPath()
  ctx.arc(34, 21, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#28c840'
  ctx.beginPath()
  ctx.arc(50, 21, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = muted
  ctx.font = '600 13px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.fillText(`${building.folder}${building.name}`, 68, 26)

  ctx.fillStyle = accent
  ctx.fillRect(0, 42, 3, height - 42)

  const split = hot ? Math.floor(width * 0.58) : width
  const codeLeft = 18
  const codeTop = 64
  const lines = building.code.split('\n').slice(0, expanded ? 22 : hd ? 16 : 11)
  ctx.font = `${hd ? 15 : 13}px ui-monospace, SFMono-Regular, Menlo, monospace`
  lines.forEach((raw, index) => {
    const y = codeTop + index * (hd ? 22 : 19)
    ctx.fillStyle = dark ? '#3d444d' : '#afb8c1'
    ctx.fillText(String(index + 1).padStart(2, ' '), codeLeft, y)
    let color = fg
    if (/^\s*\/\//.test(raw) || /^\s*\*/.test(raw)) color = muted
    else if (/export|import|function|return|const|await|async|class|interface|type|from/.test(raw)) color = dark ? '#ff7b72' : '#cf222e'
    else if (/['"`]/.test(raw)) color = dark ? '#a5d6ff' : '#0a3069'
    else if (/[{}();=>]/.test(raw)) color = dark ? '#79c0ff' : '#0550ae'
    ctx.fillStyle = color
    ctx.fillText(raw.slice(0, hot ? 42 : hd ? 52 : 38), codeLeft + 28, y)
  })

  if (hot) {
    ctx.strokeStyle = line
    ctx.beginPath()
    ctx.moveTo(split, 42)
    ctx.lineTo(split, height)
    ctx.stroke()
    ctx.fillStyle = dark ? '#0b1220' : '#eef2f6'
    ctx.fillRect(split, 42, width - split, height - 42)
    ctx.fillStyle = dark ? '#111827' : '#e5e7eb'
    ctx.fillRect(split, 42, width - split, 28)
    ctx.fillStyle = muted
    ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('Preview · CodeSandbox', split + 14, 61)

    roundRect(ctx, split + 16, 86, width - split - 32, 36, 8)
    ctx.fillStyle = accent
    ctx.globalAlpha = 0.18
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.fillStyle = fg
    ctx.font = '700 16px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(building.name.replace(/\.(tsx|ts|jsx|js)$/, ''), split + 26, 110)

    roundRect(ctx, split + 16, 136, width - split - 32, 54, 10)
    ctx.fillStyle = dark ? '#1f2937' : '#ffffff'
    ctx.fill()
    ctx.fillStyle = muted
    ctx.font = '12px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(building.kind.toUpperCase(), split + 26, 156)
    ctx.fillStyle = fg
    ctx.fillText(building.path, split + 26, 176)

    ;['UI', 'state', 'logic'].forEach((label, i) => {
      const x = split + 16 + i * ((width - split - 40) / 3)
      roundRect(ctx, x, 208, (width - split - 48) / 3, 70, 10)
      ctx.fillStyle = ['#164e63', '#4c1d95', '#14532d'][i]
      ctx.globalAlpha = dark ? 0.55 : 0.18
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.fillStyle = fg
      ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText(label, x + 10, 248)
    })
  }

  ctx.strokeStyle = hot ? accent : line
  ctx.globalAlpha = hot ? 0.85 : 0.55
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, width - 2, height - 2)
  ctx.globalAlpha = 1
  return canvas
}

export default function SwarmCodeCard({ building, theme, selected, hd, onSelect }: SwarmCodeCardProps) {
  const hinge = useRef<Group>(null)
  const scan = useRef<Group>(null)
  const [expanded, setExpanded] = useState(false)
  const [x, y, z] = themedBuildingPosition(building, theme)
  const inspect = building.beingWorked || selected
  const hot = inspect || expanded
  const fullyOpen = expanded && selected
  const accent = building.hasBug ? '#f85149' : building.color
  const w = (hd ? 1.72 : 1.48) * (fullyOpen ? 1.55 : 1)
  const d = (hd ? 1.18 : 1.02) * (fullyOpen ? 1.45 : 1)
  const thick = 0.045

  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null
    const map = new CanvasTexture(paintCodingCard(building, theme, hot, fullyOpen, Boolean(hd)))
    map.colorSpace = SRGBColorSpace
    map.minFilter = LinearFilter
    map.magFilter = LinearFilter
    map.anisotropy = 8
    map.flipY = true
    map.needsUpdate = true
    return map
  }, [building.code, building.name, building.folder, building.path, building.kind, building.color, building.hasBug, theme.dark, theme.id, hd, hot, fullyOpen])

  useEffect(() => () => texture?.dispose(), [texture])
  useEffect(() => {
    if (!selected) setExpanded(false)
  }, [selected])

  useFrame((state, delta) => {
    const body = hinge.current
    if (!body) return
    const targetX = fullyOpen ? EXPAND_X : inspect ? INSPECT_X : IDLE_X
    const k = 1 - Math.exp(-delta * 6.2)
    body.rotation.x += (targetX - body.rotation.x) * k
    const lift = fullyOpen ? 0.22 : inspect ? 0.1 : 0.018
    body.position.y += (lift - body.position.y) * k
    if (scan.current) {
      scan.current.visible = building.beingWorked
      if (building.beingWorked) {
        const t = (Math.sin(state.clock.elapsedTime * 1.6) + 1) / 2
        scan.current.position.z = -d / 2 + 0.12 + t * (d - 0.24)
      }
    }
  })

  const labelColor = theme.dark ? '#94a3b8' : '#334155'

  return (
    <group position={[x, y, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} receiveShadow>
        <planeGeometry args={[w + 0.16, d + 0.16]} />
        <meshStandardMaterial
          color={theme.dark ? '#0a0e14' : '#e2e8f0'}
          roughness={0.86}
          metalness={theme.dark ? 0.22 : 0.04}
          emissive={accent}
          emissiveIntensity={hot ? 0.12 : 0.03}
        />
      </mesh>

      <group ref={hinge} position={[0, 0.02, d / 2]} rotation={[IDLE_X, 0, 0]}>
        <group
          position={[0, 0, -d / 2]}
          onClick={(event) => {
            event.stopPropagation()
            if (selected) setExpanded((open) => !open)
            onSelect()
          }}
        >
          <RoundedBox args={[w, thick, d]} radius={0.045} smoothness={4} castShadow>
            <meshStandardMaterial
              color={theme.paper}
              metalness={0.35}
              roughness={0.28}
              emissive={theme.dark ? '#0b1220' : '#ffffff'}
              emissiveIntensity={0.08}
            />
          </RoundedBox>
          <mesh position={[0, thick / 2 + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w - 0.04, d - 0.04]} />
            <meshBasicMaterial map={texture ?? undefined} color={texture ? '#ffffff' : theme.paper} toneMapped={false} />
          </mesh>
          <mesh position={[0, -thick / 2 - 0.006, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w + 0.02, d + 0.02]} />
            <meshBasicMaterial color={accent} transparent opacity={hot ? 0.28 : 0.08} />
          </mesh>
          <group ref={scan} position={[0, thick / 2 + 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh>
              <planeGeometry args={[w * 0.9, 0.028]} />
              <meshBasicMaterial color={accent} transparent opacity={0.9} />
            </mesh>
          </group>

          {fullyOpen && (
            <Html
              transform
              occlude={false}
              position={[0, thick / 2 + 0.03, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={w / 720}
              zIndexRange={[40, 0]}
            >
              <div style={{ width: 720, height: 500 }}>
                <SwarmSandpackCard building={building} dark={theme.dark} />
              </div>
            </Html>
          )}
        </group>
      </group>

      {building.sandbox && hot && !fullyOpen && (
        <group position={[0, inspect ? 1.05 : 0.85, -d * 0.62]}>
          <PageSandbox building={building} width={w} depth={d} expanded={false} dark={theme.dark} />
        </group>
      )}

      <Text
        position={[0, 0.05, -d / 2 - 0.16]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.09}
        color={labelColor}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {building.name}
      </Text>

      {hot && (
        <Html position={[0, fullyOpen ? 2.05 : 1.28, 0.1]} center distanceFactor={11} zIndexRange={[24, 0]}>
          <div
            className={`rounded-lg border px-2.5 py-1.5 text-left shadow-2xl backdrop-blur ${
              theme.dark ? 'border-white/10 bg-black/70 text-slate-100' : 'border-slate-200 bg-white/90 text-slate-800'
            }`}
          >
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-400">{building.folder}</div>
            <div className="text-[12px] font-semibold tracking-tight">{building.name}</div>
            <div className="max-w-[220px] truncate font-mono text-[9px] opacity-60">{building.path}</div>
            {building.beingWorked && (
              <div className="mt-1 font-mono text-[9px] text-cyan-300">scanFile({building.name})</div>
            )}
          </div>
        </Html>
      )}

      {building.beingWorked && (
        <group position={[0, 1.05, 0.42]}>
          <AgentEnergy color={accent} kind="scan" active hd={hd} />
        </group>
      )}
    </group>
  )
}
