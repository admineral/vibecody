'use client'

import { useEffect, useMemo } from 'react'
import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three'
import { kindColor } from '@/app/lib/swarm/cityData'
import type { BuildingDef, VersionTheme } from '@/app/lib/swarm/types'

export interface Facade {
  map: CanvasTexture
  emissiveMap: CanvasTexture
}

export interface FacadeLibrary {
  byKind: Record<BuildingDef['kind'], Facade>
  filler: Facade
  dispose: () => void
}

const KINDS: BuildingDef['kind'][] = ['page', 'component', 'hook', 'util', 'api', 'config']

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function makeFacade(body: string, theme: VersionTheme, kind: string): Facade {
  const width = 128
  const height = 256
  const mapCanvas = document.createElement('canvas')
  mapCanvas.width = width
  mapCanvas.height = height
  const emitCanvas = document.createElement('canvas')
  emitCanvas.width = width
  emitCanvas.height = height
  const ctx = mapCanvas.getContext('2d')
  const emit = emitCanvas.getContext('2d')
  if (!ctx || !emit) {
    return { map: new CanvasTexture(mapCanvas), emissiveMap: new CanvasTexture(emitCanvas) }
  }

  const daylight = true
  const neon = theme.id === 'neon' || theme.id === 'hive' || theme.id === 'repo'
  ctx.fillStyle = body
  ctx.fillRect(0, 0, width, height)
  emit.fillStyle = '#000000'
  emit.fillRect(0, 0, width, height)

  ctx.fillStyle = daylight ? '#cbd5e1' : '#020617'
  ctx.fillRect(0, 0, width, 10)
  ctx.fillRect(0, height - 8, width, 8)

  const cols = kind === 'util' ? 3 : kind === 'config' ? 3 : 4
  const rows = kind === 'page' ? 16 : kind === 'config' || kind === 'util' ? 7 : 12
  const padX = 9
  const padY = 16
  const gapX = 3
  const gapY = 3
  const winW = (width - padX * 2 - gapX * (cols - 1)) / cols
  const winH = (height - padY * 2 - gapY * (rows - 1)) / rows
  const rand = mulberry32(kind.split('').reduce((h, c) => h + c.charCodeAt(0), theme.id.length * 17))

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = padX + col * (winW + gapX)
      const y = padY + row * (winH + gapY)
      const lit = rand() > (daylight ? 0.58 : 0.18)
      const accent = rand()
      const litColor = daylight
        ? '#fde68a'
        : accent > 0.7
          ? body
          : accent > 0.4
            ? '#67e8f9'
            : '#fde047'
      const darkColor = daylight ? '#64748b' : '#1e293b'
      ctx.fillStyle = daylight ? '#e2e8f0' : '#0b1220'
      ctx.fillRect(x - 1, y - 1, winW + 2, winH + 2)
      ctx.fillStyle = lit ? litColor : darkColor
      ctx.fillRect(x, y, winW, winH * 0.86)
      if (lit) {
        emit.fillStyle = litColor
        emit.fillRect(x, y, winW, winH * 0.86)
      }
    }
  }

  if (neon) {
    ctx.fillStyle = body
    ctx.fillRect(0, 10, width, 4)
    emit.fillStyle = body
    emit.fillRect(0, 10, width, 4)
  }

  const map = new CanvasTexture(mapCanvas)
  const emissiveMap = new CanvasTexture(emitCanvas)
  for (const texture of [map, emissiveMap]) {
    texture.colorSpace = SRGBColorSpace
    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter
    texture.needsUpdate = true
  }
  return { map, emissiveMap }
}

export function createFacadeLibrary(theme: VersionTheme): FacadeLibrary {
  const byKind = {} as Record<BuildingDef['kind'], Facade>
  const all: Facade[] = []
  for (const kind of KINDS) {
    const facade = makeFacade(kindColor(kind), theme, kind)
    byKind[kind] = facade
    all.push(facade)
  }
  const filler = makeFacade('#94a3b8', theme, 'filler')
  all.push(filler)
  return {
    byKind,
    filler,
    dispose() {
      for (const facade of all) {
        facade.map.dispose()
        facade.emissiveMap.dispose()
      }
    },
  }
}

export function useFacadeLibrary(theme: VersionTheme) {
  const library = useMemo(() => {
    if (theme.chipMode || theme.nodeMode || typeof document === 'undefined') return null
    return createFacadeLibrary(theme)
  }, [theme])

  useEffect(() => () => library?.dispose(), [library])
  return library
}
