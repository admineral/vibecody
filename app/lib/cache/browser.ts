import { CachedRepo } from './types';

const LAST_KEY = 'docai:lastRepo';
const PREFIX = 'docai:repo:';
const LEGACY_KEY = 'componentData';

function storageKey(repoUrl: string, branch: string): string {
  return `${PREFIX}${repoUrl}#${branch}`;
}

export function saveBrowserCache(entry: CachedRepo): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(entry);
    localStorage.setItem(storageKey(entry.url, entry.branch), serialized);
    localStorage.setItem(LAST_KEY, JSON.stringify({ url: entry.url, branch: entry.branch }));
    localStorage.setItem(LEGACY_KEY, JSON.stringify(entry.components));
  } catch (error) {
    console.warn('Browser cache write skipped:', error);
  }
}

export function loadBrowserCache(repoUrl: string, branch: string): CachedRepo | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(storageKey(repoUrl, branch));
    if (raw) return JSON.parse(raw) as CachedRepo;
  } catch (error) {
    console.warn('Failed to parse browser cache:', error);
  }
  return null;
}

export function loadLastBrowserCache(): CachedRepo | null {
  if (typeof window === 'undefined') return null;

  try {
    const last = localStorage.getItem(LAST_KEY);
    if (last) {
      const { url, branch } = JSON.parse(last) as { url: string; branch: string };
      const keyed = loadBrowserCache(url, branch);
      if (keyed) return keyed;
    }

    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      return {
        version: 'legacy',
        url: '',
        branch: 'main',
        timestamp: new Date().toISOString(),
        components: JSON.parse(legacy),
        allFiles: [],
        repository: { owner: '', name: '', branch: 'main' },
      };
    }
  } catch (error) {
    console.warn('Failed to load last browser cache:', error);
  }

  return null;
}

export function clearBrowserCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(PREFIX) || key === LAST_KEY || key === LEGACY_KEY)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear browser cache:', error);
  }
}
