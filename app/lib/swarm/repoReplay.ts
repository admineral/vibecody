import type { BuildingDef, FlowStep, MissionFlow } from './types'
import { DISTRICTS } from './cityData'
import { enrichBuildingMeta, folderFromPath, knownModuleIndex } from './moduleGraph'

export const DEFAULT_SWARM_REPO = 'https://github.com/admineral/OpenAI-Assistant-API-Chat'

export interface RepoFileInput {
  path: string
  content?: string
}

export interface RepoCommitFile {
  path: string
  status: 'added' | 'modified' | 'removed' | 'renamed' | string
  patch?: string
}

export interface RepoCommitInput {
  sha: string
  message: string
  files: RepoCommitFile[]
}

export interface RepoReplayPayload {
  repoUrl: string
  owner: string
  name: string
  branch: string
  live: boolean
  buildings: BuildingDef[]
  mission: MissionFlow
}

export function parseGithubRepo(repoUrl: string) {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/i)
  if (!match) return null
  return { owner: match[1], name: match[2].replace(/\.git$/, '') }
}

function districtFromPath(filePath: string) {
  if (filePath.includes('/api/') || filePath.startsWith('app/api')) return 'api'
  if (filePath.includes('/hooks/') || filePath.includes('/modules/') || filePath.includes('/services/') || filePath.includes('/utils/') || filePath.startsWith('lib/')) {
    return 'lib'
  }
  if (filePath.includes('/components/') || filePath.startsWith('components/')) return 'components'
  if (filePath.startsWith('app/')) return 'app'
  return 'root'
}

function kindFromPath(filePath: string): BuildingDef['kind'] {
  const name = filePath.split('/').pop() ?? filePath
  if (filePath.includes('/api/')) return 'api'
  if (name.startsWith('use') && name.endsWith('.ts')) return 'hook'
  if (name === 'page.tsx' || name === 'layout.tsx' || filePath.includes('/page.')) return 'page'
  if (filePath.includes('/components/')) return 'component'
  if (name.endsWith('.json') || name.endsWith('.md') || name.endsWith('.css')) return 'config'
  return 'util'
}

function fileId(filePath: string) {
  return filePath.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 64)
}

function stubCode(filePath: string, content?: string) {
  if (content && content.trim()) return content.split('\n').slice(0, 18).join('\n')
  const name = filePath.split('/').pop() ?? filePath
  return `// ${filePath}\nexport default function ${name.replace(/\W/g, '_')}() {\n  return null\n}`
}

function pathScore(filePath: string) {
  if (filePath.includes('node_modules') || filePath.includes('package-lock')) return -1
  if (filePath.includes('components/ui/')) return 1
  if (filePath.endsWith('.md') || filePath.endsWith('.css')) return 2
  if (filePath.includes('/api/')) return 7
  if (filePath.includes('/hooks/')) return 8
  if (filePath.includes('/components/') && !filePath.includes('/ui/')) return 9
  if (filePath.endsWith('page.tsx') || filePath.endsWith('layout.tsx')) return 10
  if (filePath.includes('/modules/') || filePath.includes('/services/')) return 7
  return 5
}

export function filesToBuildings(files: RepoFileInput[], limit = 28): BuildingDef[] {
  const ranked = files
    .filter((file) => pathScore(file.path) >= 0)
    .sort((a, b) => pathScore(b.path) - pathScore(a.path) || a.path.localeCompare(b.path))
    .slice(0, limit)

  const counters: Record<string, number> = {}
  const drafted = ranked.map((file) => {
    const district = districtFromPath(file.path)
    const districtDef = DISTRICTS.find((item) => item.id === district) ?? DISTRICTS[0]
    const cols = Math.max(3, Math.floor(districtDef.size[0] / 1.9))
    const index = counters[district] ?? 0
    counters[district] = index + 1
    const lines = file.content ? file.content.split('\n').length : 40 + (file.path.length % 80)
    const kind = kindFromPath(file.path)
    return {
      id: fileId(file.path),
      name: file.path.split('/').pop() ?? file.path,
      district,
      col: index % cols,
      row: Math.floor(index / cols),
      lines,
      kind,
      path: file.path,
      folder: folderFromPath(file.path),
      sandbox: kind === 'page',
      code: stubCode(file.path, file.content),
    } satisfies BuildingDef
  })
  const known = knownModuleIndex(drafted)
  return drafted.map((building) => ({
    ...building,
    ...enrichBuildingMeta(building, known),
  }))
}

function snippetFromPatch(patch?: string) {
  if (!patch) return undefined
  const lines = patch
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1))
    .filter((line) => line.trim())
    .slice(0, 6)
  return lines.length ? lines.join('\n') : undefined
}

export function commitsToMission(
  commits: RepoCommitInput[],
  buildings: BuildingDef[],
  repoName: string,
): MissionFlow {
  const byPath = new Map(buildings.map((building) => [building.name, building]))
  const byId = new Map(buildings.map((building) => [building.id, building]))
  const resolve = (filePath: string) => byId.get(fileId(filePath)) ?? byPath.get(filePath.split('/').pop() ?? '')

  const steps: FlowStep[] = [
    {
      at: 200,
      agent: 'lead',
      kind: 'talk',
      message: `Replay ${repoName} — ${commits.length} commits as synthetic swarm steps.`,
      tool: `orchestrate({ repo: "${repoName}" })`,
    },
  ]

  let at = 900
  const agents = ['scout', 'scribe', 'fixer', 'architect'] as const

  commits.forEach((commit, index) => {
    const headline = commit.message.split('\n')[0].slice(0, 72)
    const files = commit.files.filter((file) => resolve(file.path))
    const targets: RepoCommitFile[] = files.length
      ? files
      : buildings.slice(index, index + 1).map((item) => ({
          path: item.name,
          status: 'modified',
        }))
    const first = targets[0]
    const building = first ? resolve(first.path) : undefined
    const agent = agents[index % agents.length]
    const lower = headline.toLowerCase()
    const isFix = /fix|bug|patch|error/.test(lower)
    const isAdd = first?.status === 'added' || /add|create|new|move/.test(lower)

    steps.push({
      at,
      agent: 'lead',
      kind: 'talk',
      message: `Commit ${commit.sha.slice(0, 7)}: ${headline}`,
      tool: `git.show("${commit.sha.slice(0, 7)}")`,
    })
    at += 700

    if (building) {
      steps.push({
        at,
        agent: 'scout',
        kind: 'fly',
        targetId: building.id,
        message: `Scout locking onto ${building.name}`,
      })
      at += 1400
      steps.push({
        at,
        agent: 'scout',
        kind: 'scan',
        targetId: building.id,
        message: `Scanning ${building.name}`,
        tool: `scanFile("${first?.path ?? building.name}")`,
        code: building.code,
      })
      at += 1600

      if (isAdd) {
        steps.push({
          at,
          agent: 'architect',
          kind: 'grow',
          targetId: building.id,
          growBy: 1.2,
          message: `Raising ${building.name} from the commit`,
        })
        at += 1400
      }

      const editor = isFix ? 'fixer' : agent === 'scout' ? 'scribe' : agent
      steps.push({
        at,
        agent: editor,
        kind: isFix ? 'fix' : 'edit',
        targetId: building.id,
        message: isFix ? `Patch ${building.name}` : `Write ${building.name}`,
        tool: `${isFix ? 'applyPatch' : 'editFile'}("${first?.path ?? building.name}")`,
        code: snippetFromPatch(first?.patch) ?? building.code,
      })
      at += 1800
    }

    if (targets[1]) {
      const other = resolve(targets[1].path)
      if (building && other) {
        steps.push({
          at,
          agent: 'lead',
          kind: 'link',
          targetId: building.id,
          linkTo: other.id,
          message: `${building.name} ↔ ${other.name}`,
        })
        at += 1200
      }
    }
  })

  steps.push({
    at,
    agent: 'lead',
    kind: 'talk',
    message: 'Replay loop. Swarm idle until next pass.',
  })

  return {
    id: 'repo-replay',
    title: 'Repo Replay',
    blurb: `Synthetic swarm walk through ${repoName} git history.`,
    duration: at + 2400,
    loop: true,
    steps,
  }
}

export const FALLBACK_REPO_FILES: RepoFileInput[] = [
  { path: 'app/page.tsx', content: 'import WelcomeForm from \'@/components/WelcomeForm\'\nexport default function Home() {\n  return <WelcomeForm />\n}' },
  { path: 'app/layout.tsx', content: 'export default function RootLayout({ children }) {\n  return <html>{children}</html>\n}' },
  { path: 'app/components/WelcomeForm.tsx', content: 'import InputForm from \'@/components/InputForm\'\nimport { useChatState } from \'@/hooks/useChatState\'\nexport default function WelcomeForm() {\n  const chat = useChatState()\n  return <InputForm chat={chat} />\n}' },
  { path: 'app/components/InputForm.tsx', content: 'import { useChatManager } from \'@/hooks/useChatManager\'\nexport default function InputForm() {\n  const { send } = useChatManager()\n  return <form onSubmit={send} />\n}' },
  { path: 'app/components/MessageList.js', content: 'export default function MessageList({ messages }) {\n  return messages.map(m => <p>{m}</p>)\n}' },
  { path: 'app/components/UploadFiles_Component.tsx', content: 'export default function UploadFiles() {\n  return <input type="file" />\n}' },
  { path: 'app/hooks/useChatState.ts', content: 'export function useChatState() {\n  return { messages: [], setMessages }\n}' },
  { path: 'app/hooks/useChatManager.ts', content: 'import { ChatManager } from \'@/services/ChatManager\'\nexport function useChatManager() {\n  return { send, status }\n}' },
  { path: 'app/hooks/useStartAssistant.ts', content: 'import { createAssistant } from \'@/modules/assistantModules\'\nexport function useStartAssistant() {\n  return { start: createAssistant }\n}' },
  { path: 'app/modules/assistantModules.ts', content: 'export async function createAssistant() {\n  return openai.beta.assistants.create({})\n}' },
  { path: 'app/modules/chatModules.ts', content: 'export async function addMessage(threadId, text) {\n  return openai.beta.threads.messages.create(threadId, { role: "user", content: text })\n}' },
  { path: 'app/services/ChatManager.ts', content: 'import { addMessage } from \'@/modules/chatModules\'\nexport class ChatManager {\n  async send(text: string) {\n    return addMessage(this.thread, text)\n  }\n}' },
  { path: 'app/services/api.js', content: 'export async function post(url, body) {\n  return fetch(url, { method: "POST", body: JSON.stringify(body) })\n}' },
  { path: 'app/api/createAssistant/route.ts', content: 'import { createAssistant } from \'@/modules/assistantModules\'\nexport async function POST() {\n  return Response.json(await createAssistant())\n}' },
  { path: 'app/api/createThread/route.ts', content: 'export async function POST() {\n  return Response.json(await openai.beta.threads.create())\n}' },
  { path: 'app/api/addMessage/route.ts', content: 'import { addMessage } from \'@/modules/chatModules\'\nexport async function POST(req) {\n  const { threadId, content } = await req.json()\n  return Response.json(await addMessage(threadId, content))\n}' },
  { path: 'app/api/runAssistant/route.ts', content: 'export async function POST(req) {\n  return Response.json(await runAssistant(await req.json()))\n}' },
  { path: 'app/api/listMessages/route.ts', content: 'export async function POST(req) {\n  const { threadId } = await req.json()\n  return Response.json(await listMessages(threadId))\n}' },
  { path: 'app/api/upload/route.ts', content: 'export async function POST(req) {\n  return Response.json(await uploadFile(req))\n}' },
  { path: 'app/utils/convertFileToBase64.ts', content: 'export function convertFileToBase64(file: File) {\n  return new Promise((resolve) => {\n    const reader = new FileReader()\n    reader.onload = () => resolve(reader.result)\n    reader.readAsDataURL(file)\n  })\n}' },
  { path: 'components/ui/button.tsx', content: 'export function Button({ children }) {\n  return <button>{children}</button>\n}' },
  { path: 'components/ui/input.tsx', content: 'export function Input(props) {\n  return <input {...props} />\n}' },
  { path: 'README.md', content: '# OpenAI Assistant API Chat\nCustomize your Assistant and chat with your files.' },
]

export const FALLBACK_COMMITS: RepoCommitInput[] = [
  {
    sha: '9b63620',
    message: 'Code Refactor 90% done. ----> Branch ---> Code_refactor',
    files: [
      { path: 'app/services/ChatManager.ts', status: 'modified' },
      { path: 'app/hooks/useChatManager.ts', status: 'modified' },
    ],
  },
  {
    sha: 'e3dbe84',
    message: 'Update WelcomeForm.tsx',
    files: [
      { path: 'app/components/WelcomeForm.tsx', status: 'modified', patch: '+onClick={() => setAssistantModel(\'gpt-3.5-turbo-1106\')}' },
    ],
  },
  {
    sha: '53c1ee1',
    message: 'Update useChatState.ts',
    files: [{ path: 'app/hooks/useChatState.ts', status: 'modified' }],
  },
  {
    sha: '5d64efb',
    message: 'smol refactor, moved ChatFileUpload from page.tsx -> Inputform',
    files: [
      { path: 'app/page.tsx', status: 'modified' },
      { path: 'app/components/InputForm.tsx', status: 'modified' },
    ],
  },
  {
    sha: '11dec33',
    message: 'testing Speedinsights from vercel',
    files: [{ path: 'app/layout.tsx', status: 'modified' }],
  },
  {
    sha: 'dbe6ded',
    message: 'Complete set of Shade UI components available for use',
    files: [
      { path: 'components/ui/button.tsx', status: 'added' },
      { path: 'components/ui/input.tsx', status: 'added' },
    ],
  },
]

export function buildRepoReplay(input?: {
  repoUrl?: string
  owner?: string
  name?: string
  branch?: string
  live?: boolean
  files?: RepoFileInput[]
  commits?: RepoCommitInput[]
}): RepoReplayPayload {
  const parsed = parseGithubRepo(input?.repoUrl || DEFAULT_SWARM_REPO)
  const owner = input?.owner ?? parsed?.owner ?? 'admineral'
  const name = input?.name ?? parsed?.name ?? 'OpenAI-Assistant-API-Chat'
  const files = input?.files?.length ? input.files : FALLBACK_REPO_FILES
  const commits = input?.commits?.length ? input.commits : FALLBACK_COMMITS
  const buildings = filesToBuildings(files)
  return {
    repoUrl: input?.repoUrl || DEFAULT_SWARM_REPO,
    owner,
    name,
    branch: input?.branch ?? 'main',
    live: Boolean(input?.live),
    buildings,
    mission: commitsToMission(commits, buildings, name),
  }
}
