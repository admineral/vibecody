import type { BuildingDef, BuildingState } from './types'

export function folderFromPath(filePath: string) {
  const parts = filePath.replace(/\\/g, '/').split('/').filter(Boolean)
  if (parts.length <= 1) return '/'
  return `${parts.slice(0, -1).join('/')}/`
}

export function displayPath(building: Pick<BuildingDef, 'path' | 'name' | 'district'>) {
  if (building.path) return building.path
  if (building.district === 'root') return building.name
  return `${building.district}/${building.name}`
}

const IMPORT_RE = /from\s+['"]([^'"]+)['"]/g
const REQUIRE_RE = /require\(\s*['"]([^'"]+)['"]\s*\)/g

export function parseUses(code: string | undefined, known: Map<string, string>) {
  if (!code) return [] as string[]
  const ids = new Set<string>()
  const collect = (raw: string) => {
    const base = raw.split('/').pop()?.replace(/\.(tsx|ts|jsx|js)$/, '') ?? raw
    const hit = known.get(base) ?? known.get(raw) ?? known.get(raw.replace(/^\.\//, ''))
    if (hit) ids.add(hit)
  }
  for (const match of code.matchAll(IMPORT_RE)) collect(match[1])
  for (const match of code.matchAll(REQUIRE_RE)) collect(match[1])
  return [...ids]
}

export function knownModuleIndex(buildings: Array<Pick<BuildingDef, 'id' | 'name' | 'path'>>) {
  const known = new Map<string, string>()
  for (const building of buildings) {
    known.set(building.id, building.id)
    known.set(building.name, building.id)
    known.set(building.name.replace(/\.(tsx|ts|jsx|js)$/, ''), building.id)
    if (building.path) {
      known.set(building.path, building.id)
      known.set(building.path.replace(/\.(tsx|ts|jsx|js)$/, ''), building.id)
    }
  }
  return known
}

export function enrichBuildingMeta(building: BuildingDef, known?: Map<string, string>): Pick<BuildingDef, 'path' | 'folder' | 'uses' | 'sandbox'> {
  const path = displayPath(building)
  const parsed = known ? parseUses(building.code, known) : []
  const uses = [...new Set([...(building.uses ?? []), ...parsed])].filter((id) => id !== building.id)
  return {
    path,
    folder: building.folder ?? folderFromPath(path),
    uses,
    sandbox: building.sandbox ?? building.kind === 'page',
  }
}

export function folderClusters(buildings: BuildingState[]) {
  const groups = new Map<string, BuildingState[]>()
  for (const building of buildings) {
    if (!building.spawned) continue
    const key = building.folder || building.district
    const list = groups.get(key) ?? []
    list.push(building)
    groups.set(key, list)
  }
  return [...groups.entries()].map(([folder, members]) => {
    const xs = members.map((item) => item.position[0])
    const zs = members.map((item) => item.position[2])
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minZ = Math.min(...zs)
    const maxZ = Math.max(...zs)
    return {
      folder,
      members,
      x: (minX + maxX) / 2,
      z: (minZ + maxZ) / 2,
      w: Math.max(2.4, maxX - minX + 2.2),
      d: Math.max(2.2, maxZ - minZ + 2.0),
    }
  })
}
