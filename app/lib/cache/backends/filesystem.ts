import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { CacheStore, CachedRepo } from '../types';
import { getCacheKey } from '../key';

const isVercel = process.env.VERCEL === '1' || Boolean(process.env.VERCEL);

export const FILESYSTEM_CACHE_DIR = isVercel
  ? path.join(os.tmpdir(), 'docai-cache', 'repos')
  : path.join(process.cwd(), '.cache', 'repos');

export const filesystemIsEphemeral = isVercel;

function getCachePath(repoUrl: string, branch: string): string {
  return path.join(FILESYSTEM_CACHE_DIR, `${getCacheKey(repoUrl, branch)}.json`);
}

export const filesystemStore: CacheStore = {
  backend: 'filesystem',

  async get(repoUrl, branch) {
    try {
      const cachePath = getCachePath(repoUrl, branch);
      await fs.access(cachePath);
      return JSON.parse(await fs.readFile(cachePath, 'utf-8')) as CachedRepo;
    } catch {
      return null;
    }
  },

  async set(repoUrl, branch, entry) {
    await fs.mkdir(FILESYSTEM_CACHE_DIR, { recursive: true });
    await fs.writeFile(getCachePath(repoUrl, branch), JSON.stringify(entry), 'utf-8');
  },

  async stats() {
    try {
      await fs.mkdir(FILESYSTEM_CACHE_DIR, { recursive: true });
      const files = (await fs.readdir(FILESYSTEM_CACHE_DIR)).filter((file) => file.endsWith('.json'));
      let totalSize = 0;
      let oldestFile: Date | undefined;
      let newestFile: Date | undefined;

      for (const file of files) {
        const stats = await fs.stat(path.join(FILESYSTEM_CACHE_DIR, file));
        totalSize += stats.size;
        if (!oldestFile || stats.mtime < oldestFile) oldestFile = stats.mtime;
        if (!newestFile || stats.mtime > newestFile) newestFile = stats.mtime;
      }

      return { totalFiles: files.length, totalSize, oldestFile, newestFile };
    } catch {
      return { totalFiles: 0, totalSize: 0 };
    }
  },

  async clear() {
    await fs.rm(FILESYSTEM_CACHE_DIR, { recursive: true, force: true });
    await fs.mkdir(FILESYSTEM_CACHE_DIR, { recursive: true });
  },
};
