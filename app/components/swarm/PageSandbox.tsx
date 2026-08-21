'use client'

import { useEffect, useMemo } from 'react'
import { Html, Text } from '@react-three/drei'
import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three'
import type { BuildingState } from '@/app/lib/swarm/types'

function paintPreview(building: BuildingState, expanded: boolean) {
  const width = expanded ? 720 : 480
  const height = expanded ? 900 : 600
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(0, 0, width, 42)
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.arc(18, 21, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#eab308'
  ctx.beginPath()
  ctx.arc(36, 21, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#22c55e'
  ctx.beginPath()
  ctx.arc(54, 21, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 14px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText('sandbox · ' + building.path, 74, 26)

  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(10, 52, width - 20, height - 64)

  ctx.fillStyle = '#2563eb'
  ctx.fillRect(10, 52, width - 20, 48)
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 20px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText(building.name.replace(/\.(tsx|ts|jsx|js)$/, ''), 24, 84)

  const isChat = /chat|message|welcome|assistant/i.test(building.path + building.name)
  const isDash = /dashboard|lab|metrics/i.test(building.path + building.name)
  const isTree = /file|tree|explorer/i.test(building.path + building.name)

  if (isChat) {
    const bubbles = [
      { x: 24, y: 130, w: width * 0.55, text: 'Upload a file and ask the assistant.' },
      { x: width * 0.32, y: 210, w: width * 0.58, text: 'Ready — thread created.' },
      { x: 24, y: 290, w: width * 0.5, text: 'Summarize this PDF.' },
    ]
    bubbles.forEach((bubble, i) => {
      ctx.fillStyle = i % 2 ? '#dbeafe' : '#e2e8f0'
      roundRect(ctx, bubble.x, bubble.y, bubble.w, 56, 14)
      ctx.fill()
      ctx.fillStyle = '#0f172a'
      ctx.font = '15px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText(bubble.text, bubble.x + 14, bubble.y + 34)
    })
    ctx.fillStyle = '#e2e8f0'
    roundRect(ctx, 24, height - 120, width - 48, 44, 10)
    ctx.fill()
    ctx.fillStyle = '#64748b'
    ctx.fillText('Send a message…', 38, height - 92)
  } else if (isDash) {
    ;[0, 1, 2].forEach((i) => {
      const x = 24 + i * ((width - 60) / 3)
      ctx.fillStyle = ['#dbeafe', '#ede9fe', '#dcfce7'][i]
      roundRect(ctx, x, 128, (width - 80) / 3, 90, 12)
      ctx.fill()
      ctx.fillStyle = '#0f172a'
      ctx.font = '700 22px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText(['128', '24', '5'][i], x + 16, 176)
      ctx.font = '12px ui-sans-serif, system-ui, sans-serif'
      ctx.fillStyle = '#475569'
      ctx.fillText(['files', 'hooks', 'agents'][i], x + 16, 198)
    })
  } else if (isTree) {
    ;['app/', '  page.tsx', '  components/', 'lib/', '  hooks/'].forEach((line, i) => {
      ctx.fillStyle = i % 2 ? '#f1f5f9' : '#ffffff'
      ctx.fillRect(24, 128 + i * 44, width - 48, 44)
      ctx.fillStyle = '#0f172a'
      ctx.font = '15px ui-monospace, Menlo, monospace'
      ctx.fillText(line, 40, 156 + i * 44)
    })
  } else {
    ctx.fillStyle = '#e2e8f0'
    roundRect(ctx, 24, 128, width - 48, 36, 8)
    ctx.fill()
    ctx.fillStyle = '#cbd5e1'
    roundRect(ctx, 24, 180, width * 0.62, 180, 12)
    ctx.fill()
    ctx.fillStyle = '#94a3b8'
    roundRect(ctx, width * 0.68, 180, width * 0.22, 180, 12)
    ctx.fill()
    ctx.fillStyle = '#0f172a'
    ctx.font = '14px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('Rendered preview', 40, 160)
  }

  ctx.fillStyle = '#64748b'
  ctx.font = '12px ui-monospace, Menlo, monospace'
  ctx.fillText('CodeSandbox-style preview · UI in front, logic behind', 24, height - 28)
  return canvas
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export default function PageSandbox({
  building,
  width,
  depth,
  expanded,
}: {
  building: BuildingState
  width: number
  depth: number
  expanded: boolean
}) {
  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null
    const map = new CanvasTexture(paintPreview(building, expanded))
    map.colorSpace = SRGBColorSpace
    map.minFilter = LinearFilter
    map.magFilter = LinearFilter
    map.flipY = true
    map.needsUpdate = true
    return map
  }, [building.name, building.path, expanded])

  useEffect(() => () => texture?.dispose(), [texture])

  const previewW = width * (expanded ? 1.05 : 0.92)
  const previewH = depth * (expanded ? 1.35 : 1.12)

  return (
    <group>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[previewW, previewH]} />
        <meshBasicMaterial map={texture ?? undefined} color={texture ? '#ffffff' : '#0f172a'} toneMapped={false} />
      </mesh>
      <mesh position={[0.08, 0.05, -0.16]}>
        <planeGeometry args={[previewW * 1.02, previewH * 1.02]} />
        <meshBasicMaterial color="#93c5fd" transparent opacity={0.42} />
      </mesh>
      <Text position={[previewW * 0.42, previewH * 0.4, -0.15]} fontSize={0.1} color="#1d4ed8">
        UI
      </Text>
      <mesh position={[0.18, 0.1, -0.32]}>
        <planeGeometry args={[previewW * 0.9, previewH * 0.86]} />
        <meshBasicMaterial color="#c4b5fd" transparent opacity={0.34} />
      </mesh>
      <Text position={[previewW * 0.36, previewH * 0.28, -0.31]} fontSize={0.1} color="#6d28d9">
        state
      </Text>
      <mesh position={[-0.14, -0.08, -0.48]}>
        <planeGeometry args={[previewW * 0.78, previewH * 0.72]} />
        <meshBasicMaterial color="#86efac" transparent opacity={0.28} />
      </mesh>
      <Text position={[-previewW * 0.22, -previewH * 0.22, -0.47]} fontSize={0.1} color="#047857">
        logic
      </Text>
      {expanded && (
        <Html position={[0, previewH * 0.58, 0.04]} center distanceFactor={9} zIndexRange={[12, 0]}>
          <div className="rounded-lg border border-slate-200 bg-white/95 px-2 py-1 text-[9px] font-semibold text-slate-700 shadow">
            sandbox page · UI · state · logic
          </div>
        </Html>
      )}
    </group>
  )
}
