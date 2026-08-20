import { CACHE_VERSION, CACHE_TTL_SECONDS, CachedRepo } from './types';

export function isEntryFresh(cached: CachedRepo, commitSha?: string): boolean {
  if (cached.version !== CACHE_VERSION) {
    return false;
  }

  if (commitSha && cached.commitSha && cached.commitSha === commitSha) {
    return true;
  }

  if (commitSha && cached.commitSha && cached.commitSha !== commitSha) {
    return false;
  }

  const ageMs = Date.now() - new Date(cached.timestamp).getTime();
  return ageMs <= CACHE_TTL_SECONDS * 1000;
}
