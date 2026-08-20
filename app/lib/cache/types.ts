import { ComponentMetadata, GraphEdge } from '@/app/lib/types';

export const CACHE_VERSION = '4.0';
export const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;
export const KV_INDEX_KEY = 'repo-cache:index';

export type CacheBackend = 'supabase' | 'kv' | 'filesystem';

export interface CachedRepo {
  version: string;
  url: string;
  branch: string;
  timestamp: string;
  commitSha?: string;
  components: ComponentMetadata[];
  edges?: GraphEdge[];
  allFiles: Array<{ path: string; type: string; url: string }>;
  repository: {
    owner: string;
    name: string;
    branch: string;
  };
}

export interface CacheStats {
  totalFiles: number;
  totalSize: number;
  oldestFile?: Date;
  newestFile?: Date;
  backend: CacheBackend;
  backends: CacheBackend[];
  ttlDays: number;
  ephemeral: boolean;
}

export interface CacheStore {
  readonly backend: CacheBackend;
  get(repoUrl: string, branch: string): Promise<CachedRepo | null>;
  set(repoUrl: string, branch: string, entry: CachedRepo): Promise<void>;
  stats(): Promise<Pick<CacheStats, 'totalFiles' | 'totalSize' | 'oldestFile' | 'newestFile'>>;
  clear(): Promise<void>;
}
