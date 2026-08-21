import { CacheStore, CachedRepo, KV_INDEX_KEY, CACHE_TTL_SECONDS } from '../types';
import { getKvKey } from '../key';

export function kvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
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

export const kvStore: CacheStore = {
  backend: 'kv',

  async get(repoUrl, branch) {
    try {
      const raw = await kvCommand<string | null>(['GET', getKvKey(repoUrl, branch)]);
      if (!raw) return null;
      return JSON.parse(raw) as CachedRepo;
    } catch (error) {
      console.error('Error reading KV cache:', error);
      return null;
    }
  },

  async set(repoUrl, branch, entry) {
    const key = getKvKey(repoUrl, branch);
    await kvCommand(['SET', key, JSON.stringify(entry), 'EX', CACHE_TTL_SECONDS]);
    await kvCommand(['SADD', KV_INDEX_KEY, key]);
  },

  async stats() {
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

    return { totalFiles: liveCount, totalSize, oldestFile: oldest, newestFile: newest };
  },

  async clear() {
    const keys = (await kvCommand<string[]>(['SMEMBERS', KV_INDEX_KEY])) ?? [];
    if (keys.length > 0) {
      await kvCommand(['DEL', ...keys, KV_INDEX_KEY]);
    }
  },
};
