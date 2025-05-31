import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ComponentMetadata } from '../types';

// Cache directory path
const CACHE_DIR = path.join(process.cwd(), '.cache', 'repos');

// Cache entry interface
export interface CacheEntry {
  repoUrl: string;
  branch: string;
  timestamp: number;
  components: ComponentMetadata[];
  allFiles: Array<{
    path: string;
    type: 'blob' | 'tree';
    url: string;
  }>;
  repository: {
    owner: string;
    name: string;
    branch: string;
  };
  // Cache metadata
  version: string; // Cache format version
  expiresAt: number; // Expiration timestamp
}

// Cache configuration
const CACHE_VERSION = '1.0.0';
const CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours
const MAX_CACHE_SIZE_MB = 100; // Maximum cache size in MB

// Generate cache key from repository URL and branch
export function generateCacheKey(repoUrl: string, branch: string = 'main'): string {
  const normalizedUrl = repoUrl.toLowerCase().replace(/\.git$/, '');
  const key = `${normalizedUrl}#${branch}`;
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Ensure cache directory exists
async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create cache directory:', error);
  }
}

// Get cache file path for a given key
function getCacheFilePath(cacheKey: string): string {
  return path.join(CACHE_DIR, `${cacheKey}.json`);
}

// Check if cache entry is valid (not expired)
function isCacheValid(entry: CacheEntry): boolean {
  const now = Date.now();
  return entry.expiresAt > now && entry.version === CACHE_VERSION;
}

// Get cached repository data
export async function getCachedRepo(repoUrl: string, branch: string = 'main'): Promise<CacheEntry | null> {
  try {
    const cacheKey = generateCacheKey(repoUrl, branch);
    const cacheFilePath = getCacheFilePath(cacheKey);
    
    // Check if cache file exists
    try {
      await fs.access(cacheFilePath);
    } catch {
      return null; // Cache file doesn't exist
    }
    
    // Read and parse cache file
    const cacheData = await fs.readFile(cacheFilePath, 'utf-8');
    const entry: CacheEntry = JSON.parse(cacheData);
    
    // Validate cache entry
    if (!isCacheValid(entry)) {
      // Cache is expired or invalid, remove it
      await fs.unlink(cacheFilePath).catch(() => {}); // Ignore errors
      return null;
    }
    
    console.log(`📦 Cache hit for ${repoUrl}#${branch}`);
    return entry;
    
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

// Cache repository data
export async function cacheRepo(
  repoUrl: string,
  branch: string,
  components: ComponentMetadata[],
  allFiles: Array<{ path: string; type: 'blob' | 'tree'; url: string }>,
  repository: { owner: string; name: string; branch: string }
): Promise<void> {
  try {
    await ensureCacheDir();
    
    const cacheKey = generateCacheKey(repoUrl, branch);
    const cacheFilePath = getCacheFilePath(cacheKey);
    
    const entry: CacheEntry = {
      repoUrl,
      branch,
      timestamp: Date.now(),
      components,
      allFiles,
      repository,
      version: CACHE_VERSION,
      expiresAt: Date.now() + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000)
    };
    
    // Write cache file
    await fs.writeFile(cacheFilePath, JSON.stringify(entry, null, 2), 'utf-8');
    
    console.log(`💾 Cached repository data for ${repoUrl}#${branch}`);
    
    // Clean up old cache files if needed
    await cleanupCache();
    
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

// Clean up expired cache files and enforce size limits
async function cleanupCache(): Promise<void> {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const cacheFiles = files.filter(file => file.endsWith('.json'));
    
    let totalSize = 0;
    const fileStats: Array<{ file: string; path: string; size: number; mtime: Date }> = [];
    
    // Get file stats
    for (const file of cacheFiles) {
      const filePath = path.join(CACHE_DIR, file);
      try {
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        fileStats.push({
          file,
          path: filePath,
          size: stats.size,
          mtime: stats.mtime
        });
      } catch {
        // File might have been deleted, skip
        continue;
      }
    }
    
    // Remove expired files
    for (const { file, path: filePath } of fileStats) {
      try {
        const cacheData = await fs.readFile(filePath, 'utf-8');
        const entry: CacheEntry = JSON.parse(cacheData);
        
        if (!isCacheValid(entry)) {
          await fs.unlink(filePath);
          console.log(`🗑️  Removed expired cache file: ${file}`);
        }
      } catch {
        // If we can't read the file, it's probably corrupted, remove it
        await fs.unlink(filePath).catch(() => {});
      }
    }
    
    // If cache is too large, remove oldest files
    const maxSizeBytes = MAX_CACHE_SIZE_MB * 1024 * 1024;
    if (totalSize > maxSizeBytes) {
      // Sort by modification time (oldest first)
      fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
      
      let currentSize = totalSize;
      for (const { file, path: filePath, size } of fileStats) {
        if (currentSize <= maxSizeBytes) break;
        
        try {
          await fs.unlink(filePath);
          currentSize -= size;
          console.log(`🗑️  Removed cache file to free space: ${file}`);
        } catch {
          // Ignore errors
        }
      }
    }
    
  } catch (error) {
    console.error('Error during cache cleanup:', error);
  }
}

// Get cache statistics
export async function getCacheStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  oldestFile?: Date;
  newestFile?: Date;
}> {
  try {
    await ensureCacheDir();
    const files = await fs.readdir(CACHE_DIR);
    const cacheFiles = files.filter(file => file.endsWith('.json'));
    
    let totalSize = 0;
    let oldestFile: Date | undefined;
    let newestFile: Date | undefined;
    
    for (const file of cacheFiles) {
      try {
        const filePath = path.join(CACHE_DIR, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        
        if (!oldestFile || stats.mtime < oldestFile) {
          oldestFile = stats.mtime;
        }
        if (!newestFile || stats.mtime > newestFile) {
          newestFile = stats.mtime;
        }
      } catch {
        // Skip files we can't read
      }
    }
    
    return {
      totalFiles: cacheFiles.length,
      totalSize,
      oldestFile,
      newestFile
    };
  } catch {
    return { totalFiles: 0, totalSize: 0 };
  }
}

// Clear all cache
export async function clearCache(): Promise<void> {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const cacheFiles = files.filter(file => file.endsWith('.json'));
    
    await Promise.all(
      cacheFiles.map(file => 
        fs.unlink(path.join(CACHE_DIR, file)).catch(() => {})
      )
    );
    
    console.log(`🗑️  Cleared ${cacheFiles.length} cache files`);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
} 