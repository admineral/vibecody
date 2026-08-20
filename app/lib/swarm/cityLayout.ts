import type { BuildingState, VersionTheme } from '@/app/lib/swarm/types'
import { DISTRICTS } from '@/app/lib/swarm/cityData'

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
