import type { AgentDef, BuildingDef, DistrictDef } from './types'
import { enrichBuildingMeta, knownModuleIndex } from './moduleGraph'

export const DISTRICTS: DistrictDef[] = [
  { id: 'app', name: 'app/', origin: [-12, 0, -10], size: [10, 8], color: '#dbeafe', neon: '#0284c7' },
  { id: 'components', name: 'components/', origin: [4, 0, -10], size: [12, 8], color: '#ede9fe', neon: '#7c3aed' },
  { id: 'lib', name: 'lib/', origin: [-12, 0, 4], size: [10, 8], color: '#dcfce7', neon: '#15803d' },
  { id: 'api', name: 'api/', origin: [6, 0, 4], size: [10, 8], color: '#fee2e2', neon: '#be123c' },
  { id: 'root', name: 'root', origin: [-2, 0, 14], size: [8, 4], color: '#fef9c3', neon: '#a16207' },
]

const RAW_BUILDINGS: BuildingDef[] = [
  {
    id: 'page',
    name: 'page.tsx',
    district: 'app',
    col: 0,
    row: 0,
    lines: 142,
    kind: 'page',
    path: 'app/page.tsx',
    uses: ['universe-view', 'header'],
    sandbox: true,
    code: `import AppHeader from '@/components/AppHeader'
import UniverseView from '@/components/UniverseView'

export default function Home() {
  return (
    <main className="home">
      <AppHeader />
      <UniverseView />
    </main>
  )
}`,
  },
  {
    id: 'layout',
    name: 'layout.tsx',
    district: 'app',
    col: 1,
    row: 0,
    lines: 48,
    kind: 'page',
    path: 'app/layout.tsx',
    uses: ['header', 'session-guard'],
    sandbox: true,
    code: `import AppHeader from '@/components/AppHeader'
import { SessionGuard } from '@/components/SessionGuard'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionGuard>
          <AppHeader />
          {children}
        </SessionGuard>
      </body>
    </html>
  )
}`,
  },
  {
    id: 'universe',
    name: '3dcode/page.tsx',
    district: 'app',
    col: 2,
    row: 0,
    lines: 254,
    kind: 'page',
    path: 'app/3dcode/page.tsx',
    uses: ['universe-view', 'graph-hook'],
    sandbox: true,
    code: `import UniverseView from '@/components/UniverseView'
import { useComponentGraph } from '@/lib/useComponentGraph'

export default function ThreeDCodePage() {
  const graph = useComponentGraph()
  return <UniverseView graph={graph} />
}`,
  },
  {
    id: 'filetree',
    name: '3dfiletree-v2',
    district: 'app',
    col: 0,
    row: 1,
    lines: 186,
    kind: 'page',
    path: 'app/3dfiletree-v2/page.tsx',
    uses: ['explorer', 'filecard'],
    sandbox: true,
    code: `import FileExplorer from '@/components/FileExplorer'
import FileCard3D from '@/components/FileCard3D'

export default function FileTreeV2Page() {
  return (
    <FileExplorer>
      <FileCard3D />
    </FileExplorer>
  )
}`,
  },
  {
    id: 'sandbox',
    name: '3dsandbox',
    district: 'app',
    col: 1,
    row: 1,
    lines: 110,
    kind: 'page',
    path: 'app/3dsandbox/page.tsx',
    uses: ['canvas', 'filecard'],
    sandbox: true,
    code: `import Canvas from '@/components/Canvas'
import FileCard3D from '@/components/FileCard3D'

export default function SandboxPage() {
  return (
    <Canvas>
      <FileCard3D />
    </Canvas>
  )
}`,
  },
  {
    id: 'swarm-page',
    name: 'swarm/page.tsx',
    district: 'app',
    col: 2,
    row: 1,
    lines: 40,
    kind: 'page',
    path: 'app/swarm/page.tsx',
    uses: ['agent'],
    sandbox: true,
    hidden: true,
    code: `import ModularAgent from '@/components/ModularAgent'

export default function SwarmPage() {
  return <ModularAgent />
}`,
  },
  {
    id: 'dashboard',
    name: 'dashboard/page.tsx',
    district: 'app',
    col: 3,
    row: 1,
    lines: 88,
    kind: 'page',
    path: 'app/dashboard/page.tsx',
    uses: ['labs', 'analyze-hook'],
    sandbox: true,
    hidden: true,
    code: `import LabsMenu from '@/components/LabsMenu'
import { useAnalyzeRepo } from '@/lib/useAnalyzeRepo'

export default function Dashboard() {
  const { metrics } = useAnalyzeRepo()
  return <LabsMenu metrics={metrics} />
}`,
  },

  {
    id: 'filecard',
    name: 'FileCard3D.tsx',
    district: 'components',
    col: 0,
    row: 0,
    lines: 220,
    kind: 'component',
    path: 'app/components/FileCard3D.tsx',
    uses: ['types'],
    code: `import type { ComponentMetadata } from '@/lib/types'

export default function FileCard3D({ component }: { component: ComponentMetadata }) {
  return <article className="card">{component.name}</article>
}`,
  },
  {
    id: 'agent',
    name: 'ModularAgent.tsx',
    district: 'components',
    col: 1,
    row: 0,
    lines: 280,
    kind: 'component',
    path: 'app/components/ModularAgent.tsx',
    uses: ['ast', 'graph-hook'],
    code: `import { analyzeFile } from '@/lib/ast-analyzer'
import { useComponentGraph } from '@/lib/useComponentGraph'

export default function ModularAgent() {
  const graph = useComponentGraph(analyzeFile)
  return <drone graph={graph} />
}`,
  },
  {
    id: 'universe-view',
    name: 'UniverseView.tsx',
    district: 'components',
    col: 2,
    row: 0,
    lines: 118,
    kind: 'component',
    path: 'app/components/UniverseView.tsx',
    uses: ['graph-hook', 'canvas'],
    code: `import Canvas from '@/components/Canvas'
import { useComponentGraph } from '@/lib/useComponentGraph'

export default function UniverseView() {
  const { nodes } = useComponentGraph()
  return <Canvas nodes={nodes} />
}`,
  },
  {
    id: 'labs',
    name: 'LabsMenu.tsx',
    district: 'components',
    col: 3,
    row: 0,
    lines: 46,
    kind: 'component',
    path: 'app/components/LabsMenu.tsx',
    uses: ['header'],
    code: `import AppHeader from '@/components/AppHeader'

export default function LabsMenu() {
  return (
    <nav>
      <AppHeader />
      <DropdownMenu />
    </nav>
  )
}`,
  },
  {
    id: 'header',
    name: 'AppHeader.tsx',
    district: 'components',
    col: 0,
    row: 1,
    lines: 135,
    kind: 'component',
    path: 'app/components/AppHeader.tsx',
    uses: ['session-guard'],
    code: `import { SessionGuard } from '@/components/SessionGuard'

export default function AppHeader() {
  return (
    <header>
      <SessionGuard>
        <Logo />
      </SessionGuard>
    </header>
  )
}`,
  },
  {
    id: 'canvas',
    name: 'Canvas.tsx',
    district: 'components',
    col: 1,
    row: 1,
    lines: 90,
    kind: 'component',
    path: 'app/components/Canvas.tsx',
    uses: ['graph-hook'],
    code: `import { useComponentGraph } from '@/lib/useComponentGraph'

export default function Canvas() {
  const graph = useComponentGraph()
  return <ReactFlow nodes={graph.nodes} />
}`,
  },
  {
    id: 'explorer',
    name: 'FileExplorer.tsx',
    district: 'components',
    col: 2,
    row: 1,
    lines: 160,
    kind: 'component',
    path: 'app/components/FileExplorer.tsx',
    uses: ['filecard', 'types'],
    code: `import FileCard3D from '@/components/FileCard3D'
import type { ComponentMetadata } from '@/lib/types'

export default function FileExplorer({ files }: { files: ComponentMetadata[] }) {
  return files.map((file) => <FileCard3D key={file.name} component={file} />)
}`,
  },
  {
    id: 'session-guard',
    name: 'SessionGuard.tsx',
    district: 'components',
    col: 3,
    row: 1,
    lines: 32,
    kind: 'component',
    path: 'app/components/SessionGuard.tsx',
    uses: ['auth-api'],
    hidden: true,
    code: `export function SessionGuard({ children }) {
  if (!session) redirect('/login')
  return children
}`,
  },

  {
    id: 'ast',
    name: 'ast-analyzer.ts',
    district: 'lib',
    col: 0,
    row: 0,
    lines: 410,
    kind: 'util',
    path: 'lib/ast-analyzer.ts',
    uses: ['types'],
    code: `import type { ComponentMetadata } from '@/lib/types'

export function analyzeFile(source: string): ComponentMetadata {
  return parseComponents(source)
}`,
  },
  {
    id: 'downloader',
    name: 'repo-downloader.ts',
    district: 'lib',
    col: 1,
    row: 0,
    lines: 180,
    kind: 'util',
    path: 'lib/repo-downloader.ts',
    uses: ['cache'],
    code: `import { readCache } from '@/lib/cache'

export async function downloadRepo(url: string) {
  return readCache(url) ?? extractTar(url)
}`,
  },
  {
    id: 'graph-hook',
    name: 'useComponentGraph.ts',
    district: 'lib',
    col: 2,
    row: 0,
    lines: 95,
    kind: 'hook',
    path: 'lib/useComponentGraph.ts',
    uses: ['types', 'ast'],
    code: `import { analyzeFile } from '@/lib/ast-analyzer'
import type { ComponentMetadata } from '@/lib/types'

export function useComponentGraph(components: ComponentMetadata[]) {
  return { nodes: analyzeFile, edges: [] }
}`,
  },
  {
    id: 'analyze-hook',
    name: 'useAnalyzeRepo.ts',
    district: 'lib',
    col: 0,
    row: 1,
    lines: 140,
    kind: 'hook',
    path: 'lib/useAnalyzeRepo.ts',
    uses: ['ast', 'downloader'],
    code: `import { analyzeFile } from '@/lib/ast-analyzer'
import { downloadRepo } from '@/lib/repo-downloader'

export function useAnalyzeRepo() {
  return { analyzeRepository: async (url) => analyzeFile(await downloadRepo(url)) }
}`,
  },
  {
    id: 'types',
    name: 'types/index.ts',
    district: 'lib',
    col: 1,
    row: 1,
    lines: 98,
    kind: 'util',
    path: 'lib/types/index.ts',
    uses: [],
    code: `export interface ComponentMetadata {
  name: string
  file: string
  kind: 'page' | 'component' | 'hook'
}`,
  },
  {
    id: 'cache',
    name: 'cache.ts',
    district: 'lib',
    col: 2,
    row: 1,
    lines: 70,
    kind: 'util',
    path: 'lib/cache.ts',
    uses: [],
    hasBug: true,
    code: `export function readCache(key: string) {
  return localStorage.getItem(key)
}`,
  },

  {
    id: 'analyze-api',
    name: 'analyze-repo',
    district: 'api',
    col: 0,
    row: 0,
    lines: 210,
    kind: 'api',
    path: 'app/api/analyze-repo/route.ts',
    uses: ['analyze-hook'],
    code: `import { useAnalyzeRepo } from '@/lib/useAnalyzeRepo'

export async function POST(req: Request) {
  const { url } = await req.json()
  return analyze(url)
}`,
  },
  {
    id: 'auth-api',
    name: 'auth.ts',
    district: 'api',
    col: 1,
    row: 0,
    lines: 160,
    kind: 'api',
    path: 'app/api/auth/route.ts',
    uses: ['cache'],
    hasBug: true,
    code: `import { readCache } from '@/lib/cache'

export async function POST() {
  return NextResponse.json({ ok: true, session: readCache('auth') })
}`,
  },
  {
    id: 'file-api',
    name: 'file-content',
    district: 'api',
    col: 2,
    row: 0,
    lines: 80,
    kind: 'api',
    path: 'app/api/file-content/route.ts',
    uses: ['downloader'],
    code: `import { downloadRepo } from '@/lib/repo-downloader'

export async function GET(req: Request) {
  return fileByPath(req)
}`,
  },
  {
    id: 'cache-api',
    name: 'cache/route.ts',
    district: 'api',
    col: 0,
    row: 1,
    lines: 55,
    kind: 'api',
    path: 'app/api/cache/route.ts',
    uses: ['cache'],
    code: `import { readCache } from '@/lib/cache'

export async function GET() {
  return listCache()
}`,
  },
  {
    id: 'users-api',
    name: 'users.ts',
    district: 'api',
    col: 1,
    row: 1,
    lines: 120,
    kind: 'api',
    path: 'app/api/users/route.ts',
    uses: ['auth-api'],
    hidden: true,
    code: `export async function GET() {
  return listUsers()
}`,
  },

  {
    id: 'pkg',
    name: 'package.json',
    district: 'root',
    col: 0,
    row: 0,
    lines: 63,
    kind: 'config',
    path: 'package.json',
    uses: [],
    code: '{ "name": "docai", "dependencies": { "three": "^0.185" } }',
  },
  {
    id: 'tsconfig',
    name: 'tsconfig.json',
    district: 'root',
    col: 1,
    row: 0,
    lines: 41,
    kind: 'config',
    path: 'tsconfig.json',
    uses: [],
    code: '{ "compilerOptions": { "strict": true } }',
  },
  {
    id: 'readme',
    name: 'README.md',
    district: 'root',
    col: 2,
    row: 0,
    lines: 62,
    kind: 'config',
    path: 'README.md',
    uses: [],
    code: '# DocAI\nVisualize any GitHub repository in 3D.',
  },
]

const known = knownModuleIndex(RAW_BUILDINGS)

export const BUILDINGS: BuildingDef[] = RAW_BUILDINGS.map((building) => ({
  ...building,
  ...enrichBuildingMeta(building, known),
}))

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
  const x = district.origin[0] - w / 2 + 1.35 + building.col * 1.9
  const z = district.origin[2] - d / 2 + 1.35 + building.row * 1.9
  return [x, 0, z]
}

export function heightFromLines(lines: number) {
  return Math.max(1.15, lines / 46)
}
