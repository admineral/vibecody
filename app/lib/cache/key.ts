import crypto from 'crypto';

export function getCacheKey(repoUrl: string, branch: string): string {
  return crypto.createHash('sha256').update(`${repoUrl}#${branch}`).digest('hex');
}

export function getKvKey(repoUrl: string, branch: string): string {
  return `repo-cache:${getCacheKey(repoUrl, branch)}`;
}
