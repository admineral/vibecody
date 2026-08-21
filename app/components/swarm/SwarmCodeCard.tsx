'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox, Text } from '@react-three/drei'
import { CanvasTexture, Group, LinearFilter, SRGBColorSpace } from 'three'
import type { BuildingState, VersionTheme } from '@/app/lib/swarm/types'
import { themedBuildingPosition } from '@/app/lib/swarm/cityLayout'
import AgentEnergy from './AgentEnergy'
import PageSandbox from './PageSandbox'

interface SwarmCodeCardProps {
  building: BuildingState
  theme: VersionTheme
  selected: boolean
  hd?: boolean
  onSelect: () => void
}

const IDLE_X = 0
const INSPECT_X = -0.98
const EXPAND_X = -1.32

function paintTile(
  building: BuildingState,
  hot: boolean,
  expanded: boolean,
  hd: boolean,
) {
  const width = expanded ? 1024 : hd ? 768 : 512
  const height = expanded ? 1280 : hd ? 960 : 640
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const light = (building.col + building.row) % 2 === 0
  ctx.fillStyle = hot ? '#fffbeb' : light ? '#fffef8' : '#eef4ff'
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = building.hasBug ? '#ef4444' : building.color
  ctx.fillRect(0, 0, width, hd ? 70 : 54)

  ctx.fillStyle = '#ffffff'
  ctx.font = `700 ${hd ? 28 : 22}px ui-sans-serif, system-ui, sans-serif`
  ctx.fillText(building.name.slice(0, 28), 18, hd ? 32 : 26)

  ctx.font = `600 ${hd ? 16 : 13}px ui-monospace, SFMono-Regular, Menlo, monospace`
  ctx.fillText((building.folder || building.district + '/').slice(0, 42), 18, hd ? 56 : 44)

  const codeTop = hd ? 92 : 72
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(14, codeTop, width - 28, height - codeTop - 44)
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 2
  ctx.strokeRect(14, codeTop, width - 28, height - codeTop - 44)

  const lines = building.code.split('\n').slice(0, expanded ? 34 : hd ? 22 : 14)
  ctx.font = `${expanded || hd ? 18 : 14}px ui-monospace, SFMono-Regular, Menlo, monospace`
  lines.forEach((line, index) => {
    const y = codeTop + 28 + index * (expanded || hd ? 26 : 22)
    let color = '#0f172a'
    if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) color = '#64748b'
    else if (/export|import|function|return|const|await|async|class|interface|type/.test(line)) color = '#6d28d9'
    else if (/['"`]/.test(line)) color = '#047857'
    else if (/[{}();]/.test(line)) color = '#0369a1'
    ctx.fillStyle = color
    ctx.fillText(line.slice(0, expanded ? 62 : hd ? 48 : 36), 26, y)
  })

  ctx.fillStyle = hot ? '#9a3412' : '#64748b'
  ctx.font = `700 ${hd ? 14 : 12}px ui-sans-serif, system-ui, sans-serif`
  const caption = expanded ? 'EXPANDED TILE · readable' : hot ? 'INSPECT · flipped up' : building.path
  ctx.fillText(caption.slice(0, 48), 18, height - 18)

  ctx.strokeStyle = building.hasBug ? '#ef4444' : building.color
  ctx.globalAlpha = hot ? 0.95 : 0.4
  ctx.lineWidth = 8
  ctx.strokeRect(4, 4, width - 8, height - 8)
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
  const accent = building.hasBug ? '#ef4444' : building.color
  const light = (building.col + building.row) % 2 === 0
  const w = (hd ? 1.62 : 1.42) * (fullyOpen ? 1.45 : 1)
  const d = (hd ? 1.48 : 1.28) * (fullyOpen ? 1.55 : 1)
  const thick = 0.07

  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null
    const map = new CanvasTexture(paintTile(building, hot, fullyOpen, Boolean(hd)))
    map.colorSpace = SRGBColorSpace
    map.minFilter = LinearFilter
    map.magFilter = LinearFilter
    map.anisotropy = 8
    map.flipY = true
    map.needsUpdate = true
    return map
  }, [accent, building.code, building.folder, building.name, building.path, building.col, building.row, hd, hot, fullyOpen])

  useEffect(() => () => texture?.dispose(), [texture])

  useEffect(() => {
    if (!selected) setExpanded(false)
  }, [selected])

  useFrame((state, delta) => {
    const body = hinge.current
    if (!body) return
    const targetX = fullyOpen ? EXPAND_X : inspect ? INSPECT_X : IDLE_X
    const k = 1 - Math.exp(-delta * 7)
    body.rotation.x += (targetX - body.rotation.x) * k
    const lift = fullyOpen ? 0.16 : inspect ? 0.08 : 0.02
    body.position.y += (lift - body.position.y) * k
    if (scan.current && inspect) {
      scan.current.visible = true
      scan.current.position.z = Math.sin(state.clock.elapsedTime * 2.8) * (d * 0.32)
    } else if (scan.current) {
      scan.current.visible = false
    }
  })

  return (
    <group position={[x, y, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} receiveShadow>
        <planeGeometry args={[w + 0.22, d + 0.22]} />
        <meshStandardMaterial color={light ? '#f8fafc' : '#64748b'} roughness={0.94} />
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
          <RoundedBox args={[w, thick, d]} radius={0.07} smoothness={3} castShadow receiveShadow>
            <meshStandardMaterial color="#e2e8f0" roughness={0.42} metalness={0.08} />
          </RoundedBox>
          <mesh position={[0, thick / 2 + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w - 0.05, d - 0.05]} />
            <meshBasicMaterial map={texture ?? undefined} color={texture ? '#ffffff' : '#f8fafc'} toneMapped={false} />
          </mesh>
          <mesh position={[0, -thick / 2 - 0.008, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w + 0.06, d + 0.06]} />
            <meshBasicMaterial color={accent} transparent opacity={hot ? 0.45 : 0.12} />
          </mesh>
          <group ref={scan} position={[0, thick / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh>
              <planeGeometry args={[w * 0.88, 0.05]} />
              <meshBasicMaterial color={accent} transparent opacity={0.85} />
            </mesh>
          </group>
        </group>
      </group>

      {building.sandbox && hot && (
        <group position={[0, fullyOpen ? 1.35 : 0.98, -d * 0.7]}>
          <PageSandbox building={building} width={w} depth={d} expanded={fullyOpen} />
        </group>
      )}

      <Text
        position={[0, 0.06, -d / 2 - 0.18]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.11}
        color="#0f172a"
        anchorX="center"
        anchorY="middle"
      >
        {building.name}
      </Text>

      {hot && (
        <Html position={[0, fullyOpen ? 2.2 : 1.45, 0]} center distanceFactor={10} zIndexRange={[20, 0]}>
          <div className="rounded-xl border border-slate-300 bg-white/95 px-2.5 py-1.5 text-left shadow-lg">
            <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">{building.folder}</div>
            <div className="text-xs font-black text-slate-900">{building.name}</div>
            <div className="max-w-[200px] truncate font-mono text-[9px] text-slate-500">{building.path}</div>
            {fullyOpen && <div className="text-[9px] font-semibold text-orange-600">Tile expanded · tap again to fold</div>}
          </div>
        </Html>
      )}

      {building.beingWorked && (
        <group position={[0, 1.1, 0.35]}>
          <AgentEnergy color={accent} kind="scan" active hd={hd} />
        </group>
      )}
    </group>
  )
}
