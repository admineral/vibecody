import { filesystemIsEphemeral, filesystemStore } from './backends/filesystem';
import { kvConfigured, kvStore } from './backends/kv';
import { supabaseConfigured, supabaseStore } from './backends/supabase';
import { isEntryFresh } from './freshness';
import { CACHE_TTL_SECONDS, CACHE_VERSION, CacheBackend, CacheStats, CacheStore, CachedRepo } from './types';

export type { CacheBackend, CachedRepo, CacheStats } from './types';
export { CACHE_VERSION, CACHE_TTL_SECONDS } from './types';
export { saveBrowserCache, loadBrowserCache, loadLastBrowserCache, clearBrowserCache } from './browser';

function remoteStores(): CacheStore[] {
  const stores: CacheStore[] = [];
  if (supabaseConfigured()) stores.push(supabaseStore);
  if (kvConfigured()) stores.push(kvStore);
  return stores;
}

function allStores(): CacheStore[] {
  return [...remoteStores(), filesystemStore];
}

export function primaryBackend(): CacheBackend {
  if (supabaseConfigured()) return 'supabase';
  if (kvConfigured()) return 'kv';
  return 'filesystem';
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
  for (const store of allStores()) {
    const cached = await store.get(repoUrl, branch);
    if (!cached) continue;
    if (!isEntryFresh(cached, commitSha)) {
      console.log(`Cache stale in ${store.backend} for ${repoUrl}#${branch}`);
      continue;
    }
    console.log(`📦 Cache hit (${store.backend}) for ${repoUrl}#${branch}${cached.commitSha ? ` @ ${cached.commitSha.slice(0, 7)}` : ''}`);
    return cached;
  }

  return null;
}

export async function cacheRepo(
  repoUrl: string,
  branch: string,
  result: Pick<CachedRepo, 'components' | 'edges' | 'allFiles' | 'repository'>,
  commitSha?: string
): Promise<void> {
  const entry: CachedRepo = {
    version: CACHE_VERSION,
    url: repoUrl,
    branch,
    timestamp: new Date().toISOString(),
    commitSha,
    components: result.components,
    edges: result.edges,
    allFiles: result.allFiles,
    repository: result.repository,
  };

  const remote = remoteStores()[0];
  try {
    if (remote) {
      await remote.set(repoUrl, branch, entry);
      console.log(`✅ Cached ${result.components.length} components in ${remote.backend} for ${repoUrl}#${branch}`);
    }
  } catch (error) {
    console.error(`Error caching repo in ${remote?.backend}:`, error);
  }

  try {
    await filesystemStore.set(repoUrl, branch, entry);
    if (!remote) {
      console.log(`✅ Cached ${result.components.length} components on disk for ${repoUrl}#${branch}`);
    }
  } catch (error) {
    console.error('Error caching repo on disk:', error);
  }
}

export async function getCacheStats(): Promise<CacheStats> {
  const backend = primaryBackend();
  const backends: CacheBackend[] = allStores().map((store) => store.backend);
  const primary = allStores().find((store) => store.backend === backend) ?? filesystemStore;

  try {
    const stats = await primary.stats();
    return {
      ...stats,
      backend,
      backends,
      ttlDays: CACHE_TTL_SECONDS / (24 * 60 * 60),
      ephemeral: backend === 'filesystem' && filesystemIsEphemeral,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      backend,
      backends,
      ttlDays: CACHE_TTL_SECONDS / (24 * 60 * 60),
      ephemeral: backend === 'filesystem' && filesystemIsEphemeral,
    };
  }
}

export async function clearCache(): Promise<void> {
  for (const store of allStores()) {
    try {
      await store.clear();
      console.log(`🗑️  Cleared ${store.backend} cache`);
    } catch (error) {
      console.error(`Error clearing ${store.backend} cache:`, error);
    }
  }
}
