import type { SwarmVersionId, VersionTheme } from './types'

type Look = Pick<
  VersionTheme,
  | 'background'
  | 'fog'
  | 'fogNear'
  | 'fogFar'
  | 'ground'
  | 'road'
  | 'ambient'
  | 'sun'
  | 'sunColor'
  | 'sunIntensity'
  | 'stars'
  | 'sky'
  | 'dark'
  | 'exposure'
  | 'hemiSky'
  | 'hemiGround'
  | 'grid'
  | 'paper'
  | 'ink'
>

/** Quiet graphite studio — default professional look. */
const STUDIO: Look = {
  background: '#0b0f14',
  fog: '#0b0f14',
  fogNear: 1e6,
  fogFar: 1e6,
  ground: '#12171e',
  road: '#1c2430',
  ambient: 0.42,
  sun: [18, 28, 12],
  sunColor: '#e8eef7',
  sunIntensity: 1.15,
  stars: true,
  sky: false,
  dark: true,
  exposure: 0.92,
  hemiSky: '#9bb4d0',
  hemiGround: '#0b0f14',
  grid: '#243044',
  paper: '#0f141b',
  ink: '#d7dee8',
}

const NIGHT: Look = {
  ...STUDIO,
  background: '#05060c',
  fog: '#05060c',
  ground: '#0a0c16',
  road: '#1a1030',
  ambient: 0.28,
  sun: [12, 22, 8],
  sunColor: '#8ec5ff',
  sunIntensity: 0.55,
  hemiSky: '#6d7cff',
  hemiGround: '#1a0524',
  grid: '#2a1850',
  paper: '#0c1020',
  ink: '#e2e8ff',
  exposure: 0.88,
}

const ATLAS: Look = {
  background: '#d7e6f5',
  fog: '#d7e6f5',
  fogNear: 1e6,
  fogFar: 1e6,
  ground: '#c5d4c8',
  road: '#94a3b8',
  ambient: 0.78,
  sun: [22, 34, 10],
  sunColor: '#fff4e5',
  sunIntensity: 1.35,
  stars: false,
  sky: true,
  dark: false,
  exposure: 1.12,
  hemiSky: '#f8fafc',
  hemiGround: '#94a3b8',
  grid: '#94a3b8',
  paper: '#f7f4ee',
  ink: '#1e293b',
}

const SPACE: Look = {
  ...STUDIO,
  background: '#04060d',
  fog: '#04060d',
  ground: '#070b16',
  ambient: 0.22,
  sun: [8, 26, 4],
  sunColor: '#c4d4ff',
  sunIntensity: 0.7,
  hemiSky: '#7aa2ff',
  hemiGround: '#050814',
  grid: '#1d2a4a',
  paper: '#0a1020',
  ink: '#e8eefc',
  exposure: 0.86,
}

const SILICON: Look = {
  ...STUDIO,
  background: '#0a1210',
  fog: '#0a1210',
  ground: '#10211c',
  road: '#1d4d3a',
  ambient: 0.5,
  sun: [8, 30, 4],
  sunColor: '#d7ffe8',
  sunIntensity: 1.05,
  stars: false,
  sky: false,
  hemiSky: '#c8f7dc',
  hemiGround: '#0a1210',
  grid: '#14532d',
  paper: '#0c1a16',
  ink: '#dcfce7',
  exposure: 0.95,
}

export const VERSIONS: VersionTheme[] = [
  {
    id: 'board',
    label: 'Studio',
    tagline: 'A graphite observatory of modules — inspect lifts a coding card',
    ...STUDIO,
    floatIslands: false,
    nodeMode: false,
    hivePull: false,
    chipMode: false,
    cardMode: true,
  },
  {
    id: 'repo',
    label: 'Repo Replay',
    tagline: 'Git history as a constellation of files and commit traces',
    ...SPACE,
    sunColor: '#fde68a',
    grid: '#3f2e12',
    floatIslands: false,
    nodeMode: false,
    hivePull: false,
    chipMode: false,
    cardMode: true,
  },
  {
    id: 'neon',
    label: 'Night Arcology',
    tagline: 'Editorial night city — glass, cyan, and architecture',
    ...NIGHT,
    road: '#312e81',
    floatIslands: false,
    nodeMode: false,
    hivePull: false,
    chipMode: false,
    cardMode: true,
  },
  {
    id: 'chip',
    label: 'Die City',
    tagline: 'Top-down silicon die with electron agents',
    ...SILICON,
    floatIslands: false,
    nodeMode: false,
    hivePull: false,
    chipMode: true,
    cardMode: false,
  },
  {
    id: 'daylight',
    label: 'Atlas',
    tagline: 'Museum daylight — paper modules on a campus grid',
    ...ATLAS,
    floatIslands: false,
    nodeMode: false,
    hivePull: false,
    chipMode: false,
    cardMode: true,
  },
  {
    id: 'universe',
    label: 'Code Universe',
    tagline: 'Folder islands drift in a starfield of modules',
    ...SPACE,
    sun: [6, 24, 18],
    floatIslands: true,
    nodeMode: false,
    hivePull: false,
    chipMode: false,
    cardMode: true,
  },
  {
    id: 'gource',
    label: 'Gource Pulse',
    tagline: 'Living history graph — files as nodes, commits as orbits',
    ...SPACE,
    sun: [0, 28, 0],
    sunColor: '#ffffff',
    grid: '#334155',
    floatIslands: false,
    nodeMode: true,
    hivePull: false,
    chipMode: false,
    cardMode: false,
  },
  {
    id: 'hive',
    label: 'Hive',
    tagline: 'Five agents orbit a glass problem crystal',
    ...NIGHT,
    road: '#4a044e',
    sun: [0, 26, 0],
    grid: '#701a75',
    paper: '#14081a',
    floatIslands: false,
    nodeMode: false,
    hivePull: true,
    chipMode: false,
    cardMode: true,
  },
]

export function getVersion(id: SwarmVersionId) {
  return VERSIONS.find((v) => v.id === id) ?? VERSIONS[0]
}
