import type { BuildingDef, BuildingState, VersionTheme } from '@/app/lib/swarm/types'
import { DISTRICTS } from '@/app/lib/swarm/cityData'

export function hashString(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function themedBuildingPosition(
  building: BuildingState,
  theme: VersionTheme,
): [number, number, number] {
  const districtIndex = DISTRICTS.findIndex((d) => d.id === building.district)
  let [x, y, z] = building.position
  if (theme.floatIslands) {
    y += [2.4, 6.2, 1.1, 4.8, 8.1][Math.max(0, districtIndex)] ?? 3
  }
  if (theme.hivePull) {
    x *= 0.58
    z *= 0.58
  }
  if (theme.nodeMode) {
    y = 0.15
  }
  return [x, y, z]
}

export function themedDistrictY(districtId: string, theme: VersionTheme) {
  const districtIndex = DISTRICTS.findIndex((d) => d.id === districtId)
  if (theme.floatIslands) {
    return [2.4, 6.2, 1.1, 4.8, 8.1][Math.max(0, districtIndex)] ?? 3
  }
  return 0
}

export function themedXZ(x: number, z: number, theme: VersionTheme): [number, number] {
  if (theme.hivePull) return [x * 0.58, z * 0.58]
  return [x, z]
}

export function buildingFootprint(kind: BuildingDef['kind'], id: string): [number, number] {
  const n = (hashString(id) % 80) / 100
  switch (kind) {
    case 'page':
      return [0.92 + n * 0.18, 0.88 + n * 0.14]
    case 'component':
      return [1.18 + n * 0.22, 1.08 + n * 0.18]
    case 'hook':
      return [1.02, 1.38]
    case 'util':
      return [1.48, 1.42]
    case 'api':
      return [1.22, 1.18]
    default:
      return [0.96, 0.94]
  }
}

export interface FillerPlot {
  key: string
  districtId: string
  x: number
  z: number
  w: number
  d: number
  h: number
}

export function listFillerPlots(
  occupied: Array<{ district: string; position: [number, number, number] }>,
): FillerPlot[] {
  const plots: FillerPlot[] = []
  for (const district of DISTRICTS) {
    const gap = 1.56
    const cols = Math.floor(district.size[0] / gap)
    const rows = Math.floor(district.size[1] / gap)
    const originX = district.origin[0] - district.size[0] / 2 + gap * 0.55
    const originZ = district.origin[2] - district.size[1] / 2 + gap * 0.55
    const local = occupied.filter((b) => b.district === district.id)
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x = originX + col * gap
        const z = originZ + row * gap
        const tooClose = local.some((b) => {
          const dx = b.position[0] - x
          const dz = b.position[2] - z
          return dx * dx + dz * dz < 1.5 * 1.5
        })
        if (tooClose) continue
        const seed = hashString(`${district.id}:${col}:${row}`)
        if (seed % 7 === 0) continue
        plots.push({
          key: `${district.id}-${col}-${row}`,
          districtId: district.id,
          x,
          z,
          w: 0.7 + (seed % 9) / 26,
          d: 0.66 + (seed % 8) / 24,
          h: 0.7 + (seed % 41) / 9,
        })
      }
    }
  }
  return plots
}

export interface SkylinePlot {
  key: string
  x: number
  z: number
  w: number
  d: number
  h: number
}

export function listSkylinePlots(): SkylinePlot[] {
  const plots: SkylinePlot[] = []
  const count = 26
  for (let i = 0; i < count; i += 1) {
    const seed = hashString(`sky:${i}`)
    const angle = (i / count) * Math.PI * 2 + (seed % 10) * 0.012
    const radius = 20.5 + (seed % 9) * 0.45
    plots.push({
      key: `sky-${i}`,
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      w: 0.88 + (seed % 6) / 14,
      d: 0.82 + (seed % 5) / 14,
      h: 2.4 + (seed % 78) / 9,
    })
  }
  return plots
}
