import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { ComponentMetadata } from './types';

const CACHE_DIR = path.join(process.cwd(), '.cache', 'repos');
const CACHE_VERSION = '2.0'; // Bump version to invalidate old caches

interface CachedRepo {
  version: string;
  url: string;
  branch: string;
  timestamp: string;
  components: ComponentMetadata[];
  allFiles: Array<{ path: string; type: string; url: string }>;
  repository: {
    owner: string;
    name: string;
    branch: string;
  };
}

// Generate cache key from repo URL and branch
function getCacheKey(repoUrl: string, branch: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(`${repoUrl}#${branch}`);
  return hash.digest('hex');
}

// Get cache file path
function getCachePath(repoUrl: string, branch: string): string {
  const key = getCacheKey(repoUrl, branch);
  return path.join(CACHE_DIR, `${key}.json`);
}

// Get cached repo data
export async function getCachedRepo(repoUrl: string, branch: string): Promise<CachedRepo | null> {
  try {
    const cachePath = getCachePath(repoUrl, branch);
    const exists = await fs.access(cachePath).then(() => true).catch(() => false);
    
    if (!exists) {
      return null;
    }
    
    const data = await fs.readFile(cachePath, 'utf-8');
    const cached = JSON.parse(data) as CachedRepo;
    
    // Check version
    if (cached.version !== CACHE_VERSION) {
      console.log(`Cache version mismatch: ${cached.version} !== ${CACHE_VERSION}`);
      await fs.unlink(cachePath).catch(() => {}); // Delete old cache
      return null;
    }
    
    // Check age (optional: implement cache expiry)
    const age = Date.now() - new Date(cached.timestamp).getTime();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    if (age > maxAge) {
      console.log(`Cache too old: ${age}ms > ${maxAge}ms`);
      return null;
    }
    
    return cached;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

// Cache repo data
export async function cacheRepo(
  repoUrl: string,
  branch: string,
  components: ComponentMetadata[],
  allFiles: Array<{ path: string; type: string; url: string }>,
  repository: { owner: string; name: string; branch: string }
): Promise<void> {
  try {
    // Ensure cache directory exists
    await fs.mkdir(CACHE_DIR, { recursive: true });
    
    const cachePath = getCachePath(repoUrl, branch);
    const cacheData: CachedRepo = {
      version: CACHE_VERSION,
      url: repoUrl,
      branch,
      timestamp: new Date().toISOString(),
      components,
      allFiles,
      repository,
    };
    
    await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
    console.log(`✅ Cached ${components.length} components for ${repoUrl}#${branch}`);
  } catch (error) {
    console.error('Error caching repo:', error);
  }
}

// Get cache statistics
export async function getCacheStats() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const files = await fs.readdir(CACHE_DIR);
    
    let totalSize = 0;
    let oldestFile: Date | undefined;
    let newestFile: Date | undefined;
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(CACHE_DIR, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        
        if (!oldestFile || stats.mtime < oldestFile) {
          oldestFile = stats.mtime;
        }
        if (!newestFile || stats.mtime > newestFile) {
          newestFile = stats.mtime;
        }
      }
    }
    
    return {
      totalFiles: files.filter(f => f.endsWith('.json')).length,
      totalSize,
      oldestFile,
      newestFile,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
    };
  }
}

// Clear all cache
export async function clearCache(): Promise<void> {
  try {
    await fs.rm(CACHE_DIR, { recursive: true, force: true });
    await fs.mkdir(CACHE_DIR, { recursive: true });
    console.log('✅ Cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
} 