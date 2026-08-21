export type SwarmVersionId =
  | 'board'
  | 'repo'
  | 'chip'
  | 'neon'
  | 'daylight'
  | 'universe'
  | 'gource'
  | 'hive'

export type AgentId = 'scout' | 'architect' | 'fixer' | 'scribe' | 'lead'

export type AgentKind = 'idle' | 'fly' | 'scan' | 'edit' | 'grow' | 'spawn' | 'fix' | 'talk' | 'link'

export type CameraMode = 'orbit' | 'follow' | 'cinematic'

export interface DistrictDef {
  id: string
  name: string
  origin: [number, number, number]
  size: [number, number]
  color: string
  neon: string
}

export interface BuildingDef {
  id: string
  name: string
  district: string
  col: number
  row: number
  lines: number
  kind: 'page' | 'component' | 'hook' | 'util' | 'api' | 'config'
  code: string
  path?: string
  folder?: string
  uses?: string[]
  sandbox?: boolean
  hasBug?: boolean
  hidden?: boolean
}

export interface BuildingState {
  id: string
  name: string
  district: string
  position: [number, number, number]
  height: number
  lines: number
  kind: BuildingDef['kind']
  color: string
  code: string
  path: string
  folder: string
  col: number
  row: number
  uses: string[]
  sandbox: boolean
  hasBug: boolean
  beingWorked: boolean
  spawned: boolean
  growth: number
}

export interface AgentDef {
  id: AgentId
  name: string
  role: string
  glyph: string
  color: string
  speed: number
  version: string
}

export interface AgentRuntime {
  id: AgentId
  status: string
  targetId: string | null
  position: [number, number, number]
  kind: AgentKind
  beam: boolean
}

export interface CodeSlabState {
  buildingId: string
  title: string
  text: string
  visible: boolean
  accent: string
}

export interface TrailSegment {
  id: string
  from: [number, number, number]
  to: [number, number, number]
  color: string
  bornAt: number
}

export interface FlowStep {
  at: number
  agent: AgentId
  kind: Exclude<AgentKind, 'idle'>
  targetId?: string
  message: string
  tool?: string
  code?: string
  growBy?: number
  spawnId?: string
  linkTo?: string
}

export interface MissionFlow {
  id: string
  title: string
  blurb: string
  duration: number
  loop: boolean
  steps: FlowStep[]
}

export interface VersionTheme {
  id: SwarmVersionId
  label: string
  tagline: string
  background: string
  fog: string
  fogNear: number
  fogFar: number
  ground: string
  road: string
  ambient: number
  sun: [number, number, number]
  sunColor: string
  sunIntensity: number
  stars: boolean
  sky: boolean
  floatIslands: boolean
  nodeMode: boolean
  hivePull: boolean
  chipMode: boolean
  cardMode?: boolean
}

export interface WorldSnapshot {
  time: number
  missionId: string
  playing: boolean
  buildings: BuildingState[]
  agents: AgentRuntime[]
  slabs: CodeSlabState[]
  trails: TrailSegment[]
  log: string[]
  activeStep: FlowStep | null
  repoName?: string
}

export interface SwarmCatalog {
  buildings?: BuildingDef[]
  missions?: MissionFlow[]
  repoName?: string
}
