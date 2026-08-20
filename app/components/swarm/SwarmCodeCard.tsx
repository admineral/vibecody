'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Text } from '@react-three/drei'
import { CanvasTexture, Group, LinearFilter, SRGBColorSpace } from 'three'
import type { BuildingState, VersionTheme } from '@/app/lib/swarm/types'
import { themedBuildingPosition } from '@/app/lib/swarm/cityLayout'

interface SwarmCodeCardProps {
  building: BuildingState
  theme: VersionTheme
  selected: boolean
  hd?: boolean
  onSelect: () => void
}

function paintCard(title: string, code: string, accent: string, hot: boolean, hd: boolean) {
  const width = hd ? 384 : 256
  const height = hd ? 512 : 320
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.fillStyle = hot ? '#fff7ed' : '#f8fafc'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, width, hd ? 46 : 36)
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${hd ? 22 : 16}px ui-monospace, SFMono-Regular, Menlo, monospace`
  ctx.fillText(title.slice(0, 28), 14, hd ? 30 : 24)

  const lines = code.split('\n').slice(0, hd ? 16 : 9)
  ctx.font = `${hd ? 15 : 12}px ui-monospace, SFMono-Regular, Menlo, monospace`
  lines.forEach((line, index) => {
    const y = (hd ? 72 : 56) + index * (hd ? 26 : 24)
    let color = '#0f172a'
    if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) color = '#64748b'
    else if (/export|function|return|const|await|async|class/.test(line)) color = '#6d28d9'
    else if (/['"`]/.test(line)) color = '#047857'
    else if (/[{}();]/.test(line)) color = '#0369a1'
    ctx.fillStyle = color
    ctx.fillText(line.slice(0, hd ? 42 : 32), 14, y)
  })

  ctx.strokeStyle = accent
  ctx.globalAlpha = hot ? 0.9 : 0.45
  ctx.lineWidth = 6
  ctx.strokeRect(3, 3, width - 6, height - 6)
  ctx.globalAlpha = 1
  return canvas
}

export default function SwarmCodeCard({ building, theme, selected, hd, onSelect }: SwarmCodeCardProps) {
  const group = useRef<Group>(null)
  const card = useRef<Group>(null)
  const scan = useRef<Group>(null)
  const [x, y, z] = themedBuildingPosition(building, theme)
  const hot = building.beingWorked || selected
  const accent = building.hasBug ? '#ef4444' : building.color

  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null
    const map = new CanvasTexture(paintCard(building.name, building.code, accent, hot, Boolean(hd)))
    map.colorSpace = SRGBColorSpace
    map.minFilter = LinearFilter
    map.magFilter = LinearFilter
    map.needsUpdate = true
    return map
  }, [accent, building.code, building.name, hd, hot])

  useEffect(() => () => texture?.dispose(), [texture])

  useFrame((state, delta) => {
    const root = group.current
    const body = card.current
    if (!root || !body) return
    const lift = building.growth * (hot ? 2.35 : 1.05)
    body.position.y += (lift - body.position.y) * (1 - Math.exp(-delta * 4))
    const scale = 0.55 + building.growth * 0.45
    body.scale.setScalar(body.scale.x + (scale - body.scale.x) * (1 - Math.exp(-delta * 5)))
    if (hot) {
      body.lookAt(state.camera.position)
      body.rotation.x = 0
      body.rotation.z = 0
      body.position.y += Math.sin(state.clock.elapsedTime * 3.2) * 0.012
    } else {
      body.rotation.y += (0.18 - body.rotation.y) * 0.08
    }
    if (scan.current && hot) {
      scan.current.position.y = Math.sin(state.clock.elapsedTime * 3.4) * 0.7
      scan.current.visible = true
    } else if (scan.current) {
      scan.current.visible = false
    }
  })

  const w = hd ? 1.55 : 1.28
  const h = hd ? 2.15 : 1.7

  return (
    <group ref={group} position={[x, y, z]}>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 16]} />
        <meshStandardMaterial
          color={hot ? accent : '#1e293b'}
          emissive={accent}
          emissiveIntensity={hot ? 0.8 : 0.2}
        />
      </mesh>
      <group
        ref={card}
        position={[0, 1.05, 0]}
        onClick={(event) => {
          event.stopPropagation()
          onSelect()
        }}
      >
        <RoundedBox args={[w, h, 0.08]} radius={0.08} smoothness={2}>
          <meshStandardMaterial
            map={texture ?? undefined}
            color={texture ? '#ffffff' : '#0f172a'}
            emissive={accent}
            emissiveMap={texture ?? undefined}
            emissiveIntensity={hot ? 0.28 : 0.06}
            metalness={0.2}
            roughness={0.32}
            transparent={building.growth < 1}
            opacity={0.4 + building.growth * 0.6}
          />
        </RoundedBox>
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[w + 0.08, h + 0.08]} />
          <meshBasicMaterial color={accent} transparent opacity={hot ? 0.45 : 0.12} />
        </mesh>
        <group ref={scan} position={[0, 0, 0.06]}>
          <mesh>
            <planeGeometry args={[w * 0.92, 0.05]} />
            <meshBasicMaterial color={accent} transparent opacity={0.85} />
          </mesh>
        </group>
        {hot && (
          <>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -h / 2 + 0.05, 0]}>
              <ringGeometry args={[0.2, 0.34, 24]} />
              <meshBasicMaterial color={accent} transparent opacity={0.7} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[1.15, 12, 12]} />
              <meshBasicMaterial color={accent} transparent opacity={0.07} />
            </mesh>
          </>
        )}
      </group>
      {hot && (
        <Text position={[0, 3.6, 0]} fontSize={0.16} color={accent} anchorX="center">
          {building.name}
        </Text>
      )}
    </group>
  )
}
