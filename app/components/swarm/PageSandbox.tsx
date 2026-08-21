'use client'

import { useEffect, useMemo } from 'react'
import { Html, Text } from '@react-three/drei'
import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three'
import type { BuildingState } from '@/app/lib/swarm/types'

function paintPreview(building: BuildingState, dark: boolean) {
  const width = 640
  const height = 420
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.fillStyle = dark ? '#0b0f14' : '#f8fafc'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = dark ? '#121821' : '#e5e7eb'
  ctx.fillRect(0, 0, width, 36)
  ctx.fillStyle = '#f87171'
  ctx.beginPath()
  ctx.arc(16, 18, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(32, 18, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#34d399'
  ctx.beginPath()
  ctx.arc(48, 18, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = dark ? '#93a4bb' : '#64748b'
  ctx.font = '600 12px ui-monospace, Menlo, monospace'
  ctx.fillText(`sandbox · ${building.path}`, 66, 22)

  ctx.fillStyle = dark ? '#67e8f9' : '#0e7490'
  ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText(building.kind.toUpperCase(), 24, 68)
  ctx.fillStyle = dark ? '#e8eef7' : '#0f172a'
  ctx.font = '700 28px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText(building.name.replace(/\.(tsx|ts|jsx|js)$/, '').slice(0, 22), 24, 104)
  ctx.fillStyle = dark ? '#93a4bb' : '#475569'
  ctx.font = '13px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText('Rendered module preview', 24, 128)

  const isChat = /chat|message|welcome|assistant/i.test(building.path + building.name)
  if (isChat) {
    ;[
      [24, 156, 280],
      [120, 210, 300],
      [24, 264, 240],
    ].forEach(([x, y, w], i) => {
      ctx.fillStyle = i % 2 ? (dark ? '#164e63' : '#dbeafe') : dark ? '#1e293b' : '#e2e8f0'
      ctx.beginPath()
      ctx.roundRect(x, y, w, 40, 10)
      ctx.fill()
    })
  } else {
    ;[0, 1, 2].forEach((i) => {
      const x = 24 + i * 200
      ctx.fillStyle = dark ? '#121821' : '#ffffff'
      ctx.strokeStyle = dark ? '#243044' : '#cbd5e1'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(x, 160, 184, 88, 12)
      ctx.fill()
      ctx.stroke()
    })
  }
  return canvas
}

export default function PageSandbox({
  building,
  width,
  depth,
  expanded,
  dark = true,
}: {
  building: BuildingState
  width: number
  depth: number
  expanded: boolean
  dark?: boolean
}) {
  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null
    const map = new CanvasTexture(paintPreview(building, dark))
    map.colorSpace = SRGBColorSpace
    map.minFilter = LinearFilter
    map.magFilter = LinearFilter
    map.flipY = true
    map.needsUpdate = true
    return map
  }, [building.name, building.path, building.kind, dark])

  useEffect(() => () => texture?.dispose(), [texture])

  const previewW = width * (expanded ? 1.08 : 0.94)
  const previewH = depth * (expanded ? 1.4 : 1.15)

  return (
    <group>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[previewW, previewH]} />
        <meshBasicMaterial map={texture ?? undefined} color={texture ? '#ffffff' : '#0b0f14'} toneMapped={false} />
      </mesh>
      <mesh position={[0.1, 0.06, -0.14]}>
        <planeGeometry args={[previewW * 0.98, previewH * 0.96]} />
        <meshBasicMaterial color="#164e63" transparent opacity={0.38} />
      </mesh>
      <Text position={[previewW * 0.38, previewH * 0.36, -0.13]} fontSize={0.08} color="#67e8f9">
        UI
      </Text>
      <mesh position={[0.18, 0.1, -0.3]}>
        <planeGeometry args={[previewW * 0.86, previewH * 0.82]} />
        <meshBasicMaterial color="#4c1d95" transparent opacity={0.3} />
      </mesh>
      <Text position={[previewW * 0.3, previewH * 0.22, -0.29]} fontSize={0.08} color="#c4b5fd">
        state
      </Text>
      <mesh position={[-0.14, -0.08, -0.46]}>
        <planeGeometry args={[previewW * 0.74, previewH * 0.7]} />
        <meshBasicMaterial color="#14532d" transparent opacity={0.26} />
      </mesh>
      <Text position={[-previewW * 0.18, -previewH * 0.18, -0.45]} fontSize={0.08} color="#86efac">
        logic
      </Text>
      {expanded && (
        <Html position={[0, previewH * 0.55, 0.04]} center distanceFactor={9} zIndexRange={[12, 0]}>
          <div className="rounded-md border border-white/10 bg-black/70 px-2 py-1 font-mono text-[9px] text-slate-200">
            preview · UI · state · logic
          </div>
        </Html>
      )}
    </group>
  )
}
