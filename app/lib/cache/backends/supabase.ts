import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CacheStore, CachedRepo } from '../types';
import { getCacheKey } from '../key';

const TABLE = 'repo_cache';

export function supabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseKey());
}

function getSupabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function getSupabaseKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

interface RepoCacheRow {
  cache_key: string;
  url: string;
  branch: string;
  commit_sha: string | null;
  version: string;
  timestamp: string;
  payload_bytes: number | null;
  components: CachedRepo['components'];
  edges: CachedRepo['edges'] | null;
  all_files: CachedRepo['allFiles'];
  repository: CachedRepo['repository'];
}

function rowToEntry(row: RepoCacheRow): CachedRepo {
  return {
    version: row.version,
    url: row.url,
    branch: row.branch,
    timestamp: row.timestamp,
    commitSha: row.commit_sha ?? undefined,
    components: row.components,
    edges: row.edges ?? undefined,
    allFiles: row.all_files,
    repository: row.repository,
  };
}

export const supabaseStore: CacheStore = {
  backend: 'supabase',

  async get(repoUrl, branch) {
    const supabase = getClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('cache_key', getCacheKey(repoUrl, branch))
      .maybeSingle();

    if (error) {
      console.error('Error reading Supabase cache:', error.message);
      return null;
    }
    if (!data) return null;
    return rowToEntry(data as RepoCacheRow);
  },

  async set(repoUrl, branch, entry) {
    const supabase = getClient();
    if (!supabase) return;

    const payloadBytes = JSON.stringify(entry).length;
    const { error } = await supabase.from(TABLE).upsert(
      {
        cache_key: getCacheKey(repoUrl, branch),
        url: entry.url,
        branch: entry.branch,
        commit_sha: entry.commitSha ?? null,
        version: entry.version,
        timestamp: entry.timestamp,
        payload_bytes: payloadBytes,
        components: entry.components,
        edges: entry.edges ?? [],
        all_files: entry.allFiles,
        repository: entry.repository,
      },
      { onConflict: 'cache_key' }
    );

    if (error) {
      throw new Error(`Supabase cache write failed: ${error.message}`);
    }
  },

  async stats() {
    const supabase = getClient();
    if (!supabase) return { totalFiles: 0, totalSize: 0 };

    const { data, error } = await supabase
      .from(TABLE)
      .select('payload_bytes, timestamp');

    if (error || !data) {
      console.error('Error reading Supabase cache stats:', error?.message);
      return { totalFiles: 0, totalSize: 0 };
    }

    let oldestFile: Date | undefined;
    let newestFile: Date | undefined;
    let totalSize = 0;

    for (const row of data as Array<{ payload_bytes: number | null; timestamp: string }>) {
      totalSize += row.payload_bytes ?? 0;
      const ts = new Date(row.timestamp);
      if (!oldestFile || ts < oldestFile) oldestFile = ts;
      if (!newestFile || ts > newestFile) newestFile = ts;
    }

    return { totalFiles: data.length, totalSize, oldestFile, newestFile };
  },

  async clear() {
    const supabase = getClient();
    if (!supabase) return;
    const { error } = await supabase.from(TABLE).delete().neq('cache_key', '');
    if (error) {
      throw new Error(`Supabase cache clear failed: ${error.message}`);
    }
  },
};
