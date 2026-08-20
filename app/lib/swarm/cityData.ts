import type { AgentDef, BuildingDef, DistrictDef } from './types'

export const DISTRICTS: DistrictDef[] = [
  { id: 'app', name: 'app/', origin: [-12, 0, -10], size: [10, 8], color: '#1e293b', neon: '#38bdf8' },
  { id: 'components', name: 'components/', origin: [4, 0, -10], size: [12, 8], color: '#172554', neon: '#a78bfa' },
  { id: 'lib', name: 'lib/', origin: [-12, 0, 4], size: [10, 8], color: '#14532d', neon: '#34d399' },
  { id: 'api', name: 'api/', origin: [6, 0, 4], size: [10, 8], color: '#7c2d12', neon: '#fb7185' },
  { id: 'root', name: 'root', origin: [-2, 0, 14], size: [8, 4], color: '#3f3f46', neon: '#fbbf24' },
]

export const BUILDINGS: BuildingDef[] = [
  { id: 'page', name: 'page.tsx', district: 'app', col: 0, row: 0, lines: 142, kind: 'page', code: 'export default function Home() {\n  return <UniverseView />\n}' },
  { id: 'layout', name: 'layout.tsx', district: 'app', col: 1, row: 0, lines: 48, kind: 'page', code: 'export default function RootLayout({ children }) {\n  return <html>{children}</html>\n}' },
  { id: 'universe', name: '3dcode/page.tsx', district: 'app', col: 2, row: 0, lines: 254, kind: 'page', code: 'export default function ThreeDCodePage() {\n  return <CodeUniverse3D />\n}' },
  { id: 'filetree', name: '3dfiletree-v2', district: 'app', col: 0, row: 1, lines: 186, kind: 'page', code: 'export default function FileTreeV2Page() {\n  return <FileTreeV2Scene />\n}' },
  { id: 'sandbox', name: '3dsandbox', district: 'app', col: 1, row: 1, lines: 110, kind: 'page', code: 'export default function SandboxPage() {\n  return <Sandbox3DScene />\n}' },
  { id: 'swarm-page', name: 'swarm/page.tsx', district: 'app', col: 2, row: 1, lines: 40, kind: 'page', code: 'export default function SwarmPage() {\n  return <SwarmGame />\n}', hidden: true },
  { id: 'dashboard', name: 'dashboard/page.tsx', district: 'app', col: 3, row: 1, lines: 88, kind: 'page', code: 'export default function Dashboard() {\n  return <MetricsGrid />\n}', hidden: true },

  { id: 'filecard', name: 'FileCard3D.tsx', district: 'components', col: 0, row: 0, lines: 220, kind: 'component', code: 'export default function FileCard3D({ component }) {\n  return <RoundedBox />\n}' },
  { id: 'agent', name: 'ModularAgent.tsx', district: 'components', col: 1, row: 0, lines: 280, kind: 'component', code: 'export default function ModularAgent() {\n  useFrame(() => fly())\n}' },
  { id: 'universe-view', name: 'UniverseView.tsx', district: 'components', col: 2, row: 0, lines: 118, kind: 'component', code: 'export default function UniverseView() {\n  return <CodeUniverse3D />\n}' },
  { id: 'labs', name: 'LabsMenu.tsx', district: 'components', col: 3, row: 0, lines: 46, kind: 'component', code: 'export default function LabsMenu() {\n  return <DropdownMenu />\n}' },
  { id: 'header', name: 'AppHeader.tsx', district: 'components', col: 0, row: 1, lines: 135, kind: 'component', code: 'export default function AppHeader() {\n  return <header />\n}' },
  { id: 'canvas', name: 'Canvas.tsx', district: 'components', col: 1, row: 1, lines: 90, kind: 'component', code: 'export default function Canvas() {\n  return <ReactFlow />\n}' },
  { id: 'explorer', name: 'FileExplorer.tsx', district: 'components', col: 2, row: 1, lines: 160, kind: 'component', code: 'export default function FileExplorer() {\n  return <tree />\n}' },
  { id: 'session-guard', name: 'SessionGuard.tsx', district: 'components', col: 3, row: 1, lines: 32, kind: 'component', code: 'export function SessionGuard({ children }) {\n  if (!session) redirect("/login")\n  return children\n}', hidden: true },

  { id: 'ast', name: 'ast-analyzer.ts', district: 'lib', col: 0, row: 0, lines: 410, kind: 'util', code: 'export function analyzeFile(source: string) {\n  return parseComponents(source)\n}' },
  { id: 'downloader', name: 'repo-downloader.ts', district: 'lib', col: 1, row: 0, lines: 180, kind: 'util', code: 'export async function downloadRepo(url: string) {\n  return extractTar(url)\n}' },
  { id: 'graph-hook', name: 'useComponentGraph.ts', district: 'lib', col: 2, row: 0, lines: 95, kind: 'hook', code: 'export function useComponentGraph(components) {\n  return { nodes, edges }\n}' },
  { id: 'analyze-hook', name: 'useAnalyzeRepo.ts', district: 'lib', col: 0, row: 1, lines: 140, kind: 'hook', code: 'export function useAnalyzeRepo() {\n  return { analyzeRepository }\n}' },
  { id: 'types', name: 'types/index.ts', district: 'lib', col: 1, row: 1, lines: 98, kind: 'util', code: 'export interface ComponentMetadata {\n  name: string\n  file: string\n}' },
  { id: 'cache', name: 'cache.ts', district: 'lib', col: 2, row: 1, lines: 70, kind: 'util', code: 'export function readCache(key: string) {\n  return localStorage.getItem(key)\n}', hasBug: true },

  { id: 'analyze-api', name: 'analyze-repo', district: 'api', col: 0, row: 0, lines: 210, kind: 'api', code: 'export async function POST(req: Request) {\n  return analyze(await req.json())\n}' },
  { id: 'auth-api', name: 'auth.ts', district: 'api', col: 1, row: 0, lines: 160, kind: 'api', code: 'export async function POST() {\n  return NextResponse.json({ ok: true })\n}', hasBug: true },
  { id: 'file-api', name: 'file-content', district: 'api', col: 2, row: 0, lines: 80, kind: 'api', code: 'export async function GET(req: Request) {\n  return fileByPath(req)\n}' },
  { id: 'cache-api', name: 'cache/route.ts', district: 'api', col: 0, row: 1, lines: 55, kind: 'api', code: 'export async function GET() {\n  return listCache()\n}' },
  { id: 'users-api', name: 'users.ts', district: 'api', col: 1, row: 1, lines: 120, kind: 'api', code: 'export async function GET() {\n  return listUsers()\n}', hidden: true },

  { id: 'pkg', name: 'package.json', district: 'root', col: 0, row: 0, lines: 63, kind: 'config', code: '{ "name": "docai", "dependencies": { "three": "^0.185" } }' },
  { id: 'tsconfig', name: 'tsconfig.json', district: 'root', col: 1, row: 0, lines: 41, kind: 'config', code: '{ "compilerOptions": { "strict": true } }' },
  { id: 'readme', name: 'README.md', district: 'root', col: 2, row: 0, lines: 62, kind: 'config', code: '# DocAI\nVisualize any GitHub repository in 3D.' },
]

export const AGENTS: AgentDef[] = [
  {
    id: 'scout',
    name: 'Scout',
    role: 'Patrols districts, finds bugs, paints Gource trails',
    glyph: 'S',
    color: '#60a5fa',
    speed: 1.35,
    version: 'v1 · radar',
  },
  {
    id: 'architect',
    name: 'Architect',
    role: 'Grows towers, opens new city blocks',
    glyph: 'A',
    color: '#f59e0b',
    speed: 0.85,
    version: 'v2 · builder',
  },
  {
    id: 'fixer',
    name: 'Fixer',
    role: 'Lands on red modules and patches them',
    glyph: 'F',
    color: '#34d399',
    speed: 1.1,
    version: 'v3 · patch',
  },
  {
    id: 'scribe',
    name: 'Scribe',
    role: 'Writes 3D code slabs, expands modules',
    glyph: 'W',
    color: '#a78bfa',
    speed: 0.95,
    version: 'v4 · codegen',
  },
  {
    id: 'lead',
    name: 'Swarm Lead',
    role: 'Assigns missions, you can ride this drone',
    glyph: 'L',
    color: '#f472b6',
    speed: 1.0,
    version: 'v5 · conductor',
  },
]

const KIND_COLORS: Record<BuildingDef['kind'], string> = {
  page: '#38bdf8',
  component: '#a78bfa',
  hook: '#fb923c',
  util: '#94a3b8',
  api: '#fb7185',
  config: '#fbbf24',
}

export function kindColor(kind: BuildingDef['kind']) {
  return KIND_COLORS[kind]
}

export function buildingWorldPosition(building: BuildingDef): [number, number, number] {
  const district = DISTRICTS.find((d) => d.id === building.district)
  if (!district) return [0, 0, 0]
  const [w, d] = district.size
  const x = district.origin[0] - w / 2 + 1.4 + building.col * 2.2
  const z = district.origin[2] - d / 2 + 1.4 + building.row * 2.2
  return [x, 0, z]
}

export function heightFromLines(lines: number) {
  return Math.max(1.15, lines / 46)
}
