import * as tar from 'tar';
import * as fs from 'fs';
import * as path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { tmpdir } from 'os';

export interface DownloadOptions {
  owner: string;
  repo: string;
  branch?: string;
  token?: string;
}

export class RepoDownloader {
  async downloadRepo(options: DownloadOptions): Promise<string> {
    const { owner, repo, branch = 'main', token } = options;
    
    // Create temp directory
    const tempDir = path.join(tmpdir(), `repo-${owner}-${repo}-${Date.now()}`);
    await fs.promises.mkdir(tempDir, { recursive: true });
    
    // Download tarball
    const tarballUrl = `https://api.github.com/repos/${owner}/${repo}/tarball/${branch}`;
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'DocAI-Analyzer',
    };
    
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    
    const response = await fetch(tarballUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to download repository: ${response.statusText}`);
    }
    
    // Save and extract
    const tarPath = path.join(tempDir, 'repo.tar.gz');
    const fileStream = createWriteStream(tarPath);
    
    await pipeline(
      response.body as unknown as NodeJS.ReadableStream,
      fileStream
    );
    
    // Extract
    await tar.extract({
      file: tarPath,
      cwd: tempDir,
      strip: 1, // Remove top-level directory
    });
    
    // Clean up tarball
    await fs.promises.unlink(tarPath);
    
    return tempDir;
  }
  
  async cleanup(directory: string): Promise<void> {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
} 