import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { ComponentMetadata, GraphEdge } from '@/app/lib/types';
import { ASTAnalyzer, ParsedComponent } from '@/app/lib/parser/ast-analyzer';
import { RepoDownloader } from '@/app/lib/parser/repo-downloader';
import { cacheRepo, getCachedRepo, getRepoHeadSha } from '@/app/lib/cache';
import { loadResolverConfig } from '@/app/lib/analysis/graph/import-resolver';
import { buildComponentRelationships } from '@/app/lib/analysis/graph/relationship-builder';

const DEFAULT_PATTERNS = [
  'app/**/*.{js,jsx,ts,tsx}',
  'pages/**/*.{js,jsx,ts,tsx}',
  'components/**/*.{js,jsx,ts,tsx}',
  'lib/**/*.{js,jsx,ts,tsx}',
  'utils/**/*.{js,jsx,ts,tsx}',
  'hooks/**/*.{js,jsx,ts,tsx}',
  'contexts/**/*.{js,jsx,ts,tsx}',
  'context/**/*.{js,jsx,ts,tsx}',
  'services/**/*.{js,jsx,ts,tsx}',
  'src/**/*.{js,jsx,ts,tsx}',
  '*.config.{js,ts}',
];

const INCLUDE_ALL_PATTERNS = ['**/*.{js,jsx,ts,tsx,json,md,mdx,css,scss}'];

export interface AnalyzeFileEntry {
  path: string;
  type: 'blob';
  url: string;
}

export interface AnalyzeResult {
  components: ComponentMetadata[];
  edges: GraphEdge[];
  allFiles: AnalyzeFileEntry[];
  repository: { owner: string; name: string; branch: string };
  fromCache: boolean;
  totalFiles: number;
}

export type AnalyzeProgressEvent =
  | { type: 'status'; message: string }
  | { type: 'files'; allFiles: AnalyzeFileEntry[]; repository: AnalyzeResult['repository'] }
  | { type: 'progress'; current: number; total: number; file: string }
  | { type: 'component'; component: ComponentMetadata }
  | { type: 'complete'; result: AnalyzeResult };

export type AnalyzeProgress = (event: AnalyzeProgressEvent) => void | Promise<void>;

export async function analyzeGitHubRepo(options: {
  owner: string;
  repo: string;
  branch?: string;
  includeAllFiles?: boolean;
  token?: string;
  onProgress?: AnalyzeProgress;
}): Promise<AnalyzeResult> {
  const { owner, repo, branch = 'main', includeAllFiles = false, token, onProgress } = options;
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const repository = { owner, name: repo, branch };

  await onProgress?.({ type: 'status', message: 'Checking cache...' });

  const commitSha = await getRepoHeadSha(owner, repo, branch, token);
  const cached = await getCachedRepo(repoUrl, branch, commitSha);
  if (cached) {
    const result: AnalyzeResult = {
      components: cached.components,
      edges: cached.edges ?? [],
      allFiles: cached.allFiles.map((file) => ({
        path: file.path,
        type: 'blob' as const,
        url: file.url,
      })),
      repository: cached.repository,
      fromCache: true,
      totalFiles: cached.allFiles.length,
    };
    await onProgress?.({ type: 'files', allFiles: result.allFiles, repository: result.repository });
    for (const component of result.components) {
      await onProgress?.({ type: 'component', component });
    }
    await onProgress?.({ type: 'complete', result });
    return result;
  }

  await onProgress?.({ type: 'status', message: 'Downloading repository...' });

  const downloader = new RepoDownloader();
  const tempDir = await downloader.downloadRepo({
    owner,
    repo,
    branch,
    token,
  });

  try {
    const result = await analyzeDirectory({
      rootDir: tempDir,
      includeAllFiles,
      fileUrl: (file) => `https://github.com/${owner}/${repo}/blob/${branch}/${file}`,
      repository,
      onProgress,
    });

    await cacheRepo(repoUrl, branch, result, commitSha);
    return result;
  } finally {
    await downloader.cleanup(tempDir).catch((error) => {
      console.warn('Failed to clean up temp directory:', error);
    });
  }
}

export async function analyzeDirectory(options: {
  rootDir: string;
  includeAllFiles?: boolean;
  fileUrl?: (file: string) => string;
  repository?: AnalyzeResult['repository'];
  onProgress?: AnalyzeProgress;
}): Promise<AnalyzeResult> {
  const {
    rootDir,
    includeAllFiles = false,
    fileUrl = (file) => file,
    repository = { owner: 'local', name: path.basename(rootDir), branch: 'local' },
    onProgress,
  } = options;

  const tsconfigPath = path.join(rootDir, 'tsconfig.json');
  const analyzer = new ASTAnalyzer(
    fs.existsSync(tsconfigPath) ? tsconfigPath : undefined
  );
  const patterns = includeAllFiles ? INCLUDE_ALL_PATTERNS : DEFAULT_PATTERNS;
  const files = await glob(patterns, {
    cwd: rootDir,
    ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**', '.git/**'],
  });

  const allFiles: AnalyzeFileEntry[] = files.map((file) => ({
    path: file.replace(/\\/g, '/'),
    type: 'blob' as const,
    url: fileUrl(file.replace(/\\/g, '/')),
  }));

  await onProgress?.({ type: 'files', allFiles, repository });

  const parsed: Array<ParsedComponent & { content?: string }> = [];

  for (let index = 0; index < files.length; index++) {
    const file = files[index].replace(/\\/g, '/');
    await onProgress?.({
      type: 'progress',
      current: index + 1,
      total: files.length,
      file,
    });

    try {
      const content = await fs.promises.readFile(path.join(rootDir, file), 'utf-8');
      const result = await analyzer.analyzeFile(file, content);
      if (result) {
        parsed.push({ ...result, content: includeAllFiles ? content : undefined });
      }
    } catch (error) {
      console.warn(`Failed to analyze ${file}:`, error);
    }
  }

  const resolver = await loadResolverConfig(rootDir, parsed.map((item) => item.file));
  const components: ComponentMetadata[] = parsed.map((item) => ({
    name: item.name,
    description: item.description,
    type: item.type,
    uses: [],
    usedBy: [],
    props: item.props,
    file: item.file,
    exports: item.exports,
    content: item.content,
    isClientComponent: item.isClientComponent,
    isServerComponent: !item.isClientComponent,
    importSpecs: item.importSpecs,
  }));

  const edges = buildComponentRelationships(components, resolver);

  for (const component of components) {
    await onProgress?.({ type: 'component', component });
  }

  const result: AnalyzeResult = {
    components,
    edges,
    allFiles,
    repository,
    fromCache: false,
    totalFiles: files.length,
  };

  await onProgress?.({ type: 'complete', result });
  return result;
}
