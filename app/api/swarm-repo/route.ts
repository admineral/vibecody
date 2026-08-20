import { NextRequest, NextResponse } from 'next/server'
import {
  buildRepoReplay,
  parseGithubRepo,
  type RepoCommitInput,
  type RepoFileInput,
} from '@/app/lib/swarm/repoReplay'

export const runtime = 'nodejs'
export const maxDuration = 30

function githubHeaders() {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'DocAI-SwarmCity',
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return headers
}

async function github<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: githubHeaders(), next: { revalidate: 120 } })
  if (!response.ok) {
    throw new Error(`${url} → ${response.status}`)
  }
  return response.json() as Promise<T>
}

export async function GET(request: NextRequest) {
  const repoUrl = request.nextUrl.searchParams.get('repo')?.trim() || 'https://github.com/admineral/OpenAI-Assistant-API-Chat'
  const parsed = parseGithubRepo(repoUrl)
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid GitHub repository URL' }, { status: 400 })
  }

  try {
    const repo = await github<{ default_branch: string; name: string; owner: { login: string } }>(
      `https://api.github.com/repos/${parsed.owner}/${parsed.name}`,
    )
    const branch = repo.default_branch || 'main'
    const [commitList, tree] = await Promise.all([
      github<Array<{ sha: string; commit: { message: string } }>>(
        `https://api.github.com/repos/${parsed.owner}/${parsed.name}/commits?per_page=8&sha=${encodeURIComponent(branch)}`,
      ),
      github<{ tree: Array<{ path: string; type: string }> }>(
        `https://api.github.com/repos/${parsed.owner}/${parsed.name}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      ),
    ])

    const commitDetails = await Promise.all(
      commitList.slice(0, 6).map(async (item) => {
        const detail = await github<{
          sha: string
          commit: { message: string }
          files?: Array<{ filename: string; status: string; patch?: string; additions?: number }>
        }>(`https://api.github.com/repos/${parsed.owner}/${parsed.name}/commits/${item.sha}`)
        return {
          sha: detail.sha,
          message: detail.commit.message,
          files: (detail.files ?? []).map((file) => ({
            path: file.filename,
            status: file.status,
            patch: file.patch,
          })),
        } satisfies RepoCommitInput
      }),
    )

    const blobPaths = tree.tree
      .filter((entry) => entry.type === 'blob')
      .map((entry) => entry.path)
      .filter((path) => /\.(tsx|ts|jsx|js|json|md|css)$/.test(path))

    const files: RepoFileInput[] = blobPaths.map((path) => ({ path }))
    const priority = files
      .filter((file) => !file.path.includes('components/ui/'))
      .slice(0, 10)

    const contents = await Promise.all(
      priority.map(async (file) => {
        try {
          const raw = await fetch(
            `https://raw.githubusercontent.com/${parsed.owner}/${parsed.name}/${branch}/${file.path}`,
            { headers: { 'User-Agent': 'DocAI-SwarmCity' }, next: { revalidate: 300 } },
          )
          if (!raw.ok) return file
          const text = await raw.text()
          return { ...file, content: text.slice(0, 1800) }
        } catch {
          return file
        }
      }),
    )
    const contentByPath = new Map(contents.map((file) => [file.path, file.content]))
    const filesWithCode = files.map((file) => ({
      ...file,
      content: contentByPath.get(file.path),
    }))

    const payload = buildRepoReplay({
      repoUrl,
      owner: parsed.owner,
      name: parsed.name,
      branch,
      live: true,
      files: filesWithCode,
      commits: commitDetails,
    })
    return NextResponse.json(payload)
  } catch (error) {
    const fallback = buildRepoReplay({ repoUrl, live: false })
    return NextResponse.json({
      ...fallback,
      warning: error instanceof Error ? error.message : 'GitHub unavailable, using synthetic fallback',
    })
  }
}
