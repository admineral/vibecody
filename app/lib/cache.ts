import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { ComponentMetadata } from './types';

const CACHE_VERSION = '3.0';
const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days when commit SHA is unknown
const KV_INDEX_KEY = 'repo-cache:index';

const isVercel = process.env.VERCEL === '1' || Boolean(process.env.VERCEL);
const CACHE_DIR = isVercel
  ? path.join(os.tmpdir(), 'docai-cache', 'repos')
  : path.join(process.cwd(), '.cache', 'repos');

export type CacheBackend = 'kv' | 'filesystem';

interface CachedRepo {
  version: string;
  url: string;
  branch: string;
  timestamp: string;
  commitSha?: string;
  components: ComponentMetadata[];
  allFiles: Array<{ path: string; type: string; url: string }>;
  repository: {
    owner: string;
    name: string;
    branch: string;
  };
}

function getCacheKey(repoUrl: string, branch: string): string {
  return crypto.createHash('sha256').update(`${repoUrl}#${branch}`).digest('hex');
}

function getKvKey(repoUrl: string, branch: string): string {
  return `repo-cache:${getCacheKey(repoUrl, branch)}`;
}

function getCachePath(repoUrl: string, branch: string): string {
  return path.join(CACHE_DIR, `${getCacheKey(repoUrl, branch)}.json`);
}

function kvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function isEntryFresh(cached: CachedRepo, commitSha?: string): boolean {
  if (cached.version !== CACHE_VERSION) {
    return false;
  }

  // Same git commit → keep the analysis indefinitely
  if (commitSha && cached.commitSha && cached.commitSha === commitSha) {
    return true;
  }

  // Repo moved on → force a re-analyze
  if (commitSha && cached.commitSha && cached.commitSha !== commitSha) {
    return false;
  }

  const ageMs = Date.now() - new Date(cached.timestamp).getTime();
  return ageMs <= CACHE_TTL_SECONDS * 1000;
}

async function kvCommand<T>(command: Array<string | number>): Promise<T | null> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`KV command failed (${response.status}): ${detail}`);
  }

  const payload = (await response.json()) as { result: T };
  return payload.result;
}

async function readFilesystemCache(repoUrl: string, branch: string): Promise<CachedRepo | null> {
  try {
    const cachePath = getCachePath(repoUrl, branch);
    const exists = await fs.access(cachePath).then(() => true).catch(() => false);
    if (!exists) return null;

    const cached = JSON.parse(await fs.readFile(cachePath, 'utf-8')) as CachedRepo;
    return cached;
  } catch (error) {
    console.error('Error reading filesystem cache:', error);
    return null;
  }
}

async function writeFilesystemCache(repoUrl: string, branch: string, entry: CachedRepo): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(getCachePath(repoUrl, branch), JSON.stringify(entry), 'utf-8');
}

async function readKvCache(repoUrl: string, branch: string): Promise<CachedRepo | null> {
  try {
    const raw = await kvCommand<string | null>(['GET', getKvKey(repoUrl, branch)]);
    if (!raw) return null;
    return JSON.parse(raw) as CachedRepo;
  } catch (error) {
    console.error('Error reading KV cache:', error);
    return null;
  }
}

async function writeKvCache(repoUrl: string, branch: string, entry: CachedRepo): Promise<void> {
  const key = getKvKey(repoUrl, branch);
  await kvCommand(['SET', key, JSON.stringify(entry), 'EX', CACHE_TTL_SECONDS]);
  await kvCommand(['SADD', KV_INDEX_KEY, key]);
}

export async function getRepoHeadSha(
  owner: string,
  repo: string,
  branch: string,
  token?: string
): Promise<string | undefined> {
  try {
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.sha',
      'User-Agent': 'DocAI-Analyzer',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/${encodeURIComponent(branch)}`,
      {
        headers,
        // Cache the SHA lookup on Vercel's Data Cache so repeat analyzes stay cheap
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      console.warn(`Could not resolve HEAD SHA for ${owner}/${repo}#${branch}: ${response.status}`);
      return undefined;
    }

    return (await response.text()).trim() || undefined;
  } catch (error) {
    console.warn('Failed to fetch repository HEAD SHA:', error);
    return undefined;
  }
}

export async function getCachedRepo(
  repoUrl: string,
  branch: string,
  commitSha?: string
): Promise<CachedRepo | null> {
  const cached = kvConfigured()
    ? (await readKvCache(repoUrl, branch)) ?? (await readFilesystemCache(repoUrl, branch))
    : await readFilesystemCache(repoUrl, branch);

  if (!cached) return null;

  if (!isEntryFresh(cached, commitSha)) {
    console.log(`Cache stale for ${repoUrl}#${branch}`);
    return null;
  }

  console.log(`📦 Cache hit for ${repoUrl}#${branch}${cached.commitSha ? ` @ ${cached.commitSha.slice(0, 7)}` : ''}`);
  return cached;
}

export async function cacheRepo(
  repoUrl: string,
  branch: string,
  components: ComponentMetadata[],
  allFiles: Array<{ path: string; type: string; url: string }>,
  repository: { owner: string; name: string; branch: string },
  commitSha?: string
): Promise<void> {
  const entry: CachedRepo = {
    version: CACHE_VERSION,
    url: repoUrl,
    branch,
    timestamp: new Date().toISOString(),
    commitSha,
    components,
    allFiles,
    repository,
  };

  try {
    if (kvConfigured()) {
      await writeKvCache(repoUrl, branch, entry);
      console.log(`✅ Cached ${components.length} components in Vercel KV for ${repoUrl}#${branch}`);
    }

    // Always write local/tmp as a warm-instance fallback
    await writeFilesystemCache(repoUrl, branch, entry);
    if (!kvConfigured()) {
      console.log(`✅ Cached ${components.length} components on disk for ${repoUrl}#${branch}`);
    }
  } catch (error) {
    console.error('Error caching repo:', error);
  }
}

export async function getCacheStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  oldestFile?: Date;
  newestFile?: Date;
  backend: CacheBackend;
  ttlDays: number;
  ephemeral: boolean;
}> {
  const backend: CacheBackend = kvConfigured() ? 'kv' : 'filesystem';

  if (backend === 'kv') {
    try {
      const keys = (await kvCommand<string[]>(['SMEMBERS', KV_INDEX_KEY])) ?? [];
      let newest: Date | undefined;
      let oldest: Date | undefined;
      let totalSize = 0;
      let liveCount = 0;

      for (const key of keys) {
        const raw = await kvCommand<string | null>(['GET', key]);
        if (!raw) continue;
        liveCount += 1;
        totalSize += raw.length;
        try {
          const entry = JSON.parse(raw) as CachedRepo;
          const ts = new Date(entry.timestamp);
          if (!oldest || ts < oldest) oldest = ts;
          if (!newest || ts > newest) newest = ts;
        } catch {
          // Ignore unreadable entries
        }
      }

      return {
        totalFiles: liveCount,
        totalSize,
        oldestFile: oldest,
        newestFile: newest,
        backend,
        ttlDays: CACHE_TTL_SECONDS / (24 * 60 * 60),
        ephemeral: false,
      };
    } catch (error) {
      console.error('Error getting KV cache stats:', error);
    }
  }

  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const files = (await fs.readdir(CACHE_DIR)).filter((file) => file.endsWith('.json'));

    let totalSize = 0;
    let oldestFile: Date | undefined;
    let newestFile: Date | undefined;

    for (const file of files) {
      const stats = await fs.stat(path.join(CACHE_DIR, file));
      totalSize += stats.size;
      if (!oldestFile || stats.mtime < oldestFile) oldestFile = stats.mtime;
      if (!newestFile || stats.mtime > newestFile) newestFile = stats.mtime;
    }

    return {
      totalFiles: files.length,
      totalSize,
      oldestFile,
      newestFile,
      backend,
      ttlDays: CACHE_TTL_SECONDS / (24 * 60 * 60),
      ephemeral: isVercel,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      backend,
      ttlDays: CACHE_TTL_SECONDS / (24 * 60 * 60),
      ephemeral: isVercel,
    };
  }
}

export async function clearCache(): Promise<void> {
  if (kvConfigured()) {
    try {
      const keys = (await kvCommand<string[]>(['SMEMBERS', KV_INDEX_KEY])) ?? [];
      if (keys.length > 0) {
        await kvCommand(['DEL', ...keys, KV_INDEX_KEY]);
      }
      console.log(`🗑️  Cleared ${keys.length} KV cache entries`);
    } catch (error) {
      console.error('Error clearing KV cache:', error);
    }
  }

  try {
    await fs.rm(CACHE_DIR, { recursive: true, force: true });
    await fs.mkdir(CACHE_DIR, { recursive: true });
    console.log('✅ Filesystem cache cleared');
  } catch (error) {
    console.error('Error clearing filesystem cache:', error);
  }
}
