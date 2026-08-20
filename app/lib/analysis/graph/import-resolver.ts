import * as fs from 'fs';
import * as path from 'path';

export interface PathAlias {
  prefix: string;
  targets: string[];
}

export interface ResolverConfig {
  baseUrl: string;
  aliases: PathAlias[];
  files: Set<string>;
}

const SOURCE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];
const INDEX_FILES = SOURCE_EXTENSIONS.map((ext) => `/index${ext}`);

export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
}

export async function loadResolverConfig(
  rootDir: string,
  analyzedFiles: string[]
): Promise<ResolverConfig> {
  const files = new Set(analyzedFiles.map(normalizePath));
  const tsconfig = path.join(rootDir, 'tsconfig.json');
  const jsconfig = path.join(rootDir, 'jsconfig.json');
  const configPath = (await fileExists(tsconfig))
    ? tsconfig
    : (await fileExists(jsconfig))
      ? jsconfig
      : null;

  if (!configPath) {
    return { baseUrl: '.', aliases: [], files };
  }

  try {
    const raw = await fs.promises.readFile(configPath, 'utf-8');
    const json = JSON.parse(stripJsonComments(raw)) as {
      compilerOptions?: { baseUrl?: string; paths?: Record<string, string[]> };
    };
    const compilerOptions = json.compilerOptions ?? {};
    const baseUrl = compilerOptions.baseUrl || '.';
    const aliases: PathAlias[] = Object.entries(compilerOptions.paths ?? {}).map(
      ([pattern, targets]) => ({
        prefix: pattern.replace(/\*$/, ''),
        targets: (targets ?? []).map((target) => target.replace(/\*$/, '')),
      })
    );

    return { baseUrl, aliases, files };
  } catch (error) {
    console.warn('Failed to parse tsconfig paths:', error);
    return { baseUrl: '.', aliases: [], files };
  }
}

export function resolveImport(
  fromFile: string,
  specifier: string,
  config: ResolverConfig
): string | null {
  if (!specifier || specifier.startsWith('node:') || specifier.startsWith('data:')) {
    return null;
  }

  const fromDir = path.posix.dirname(normalizePath(fromFile));

  if (specifier.startsWith('.')) {
    return matchExistingFile(path.posix.normalize(`${fromDir}/${specifier}`), config.files);
  }

  const aliased = resolveAlias(specifier, config);
  if (aliased) {
    return aliased;
  }

  return null;
}

function resolveAlias(specifier: string, config: ResolverConfig): string | null {
  for (const alias of config.aliases) {
    if (alias.prefix === specifier || specifier.startsWith(alias.prefix)) {
      const rest = specifier.slice(alias.prefix.length);
      for (const target of alias.targets) {
        const mapped = path.posix.normalize(
          path.posix.join(normalizePath(config.baseUrl), target, rest)
        );
        const matched = matchExistingFile(mapped, config.files);
        if (matched) return matched;
      }
    }
  }
  return null;
}

function matchExistingFile(candidate: string, files: Set<string>): string | null {
  const normalized = normalizePath(candidate).replace(/\/+$/, '');
  const withoutExt = normalized.replace(/\.(tsx|ts|jsx|js)$/, '');

  const candidates = [
    normalized,
    ...SOURCE_EXTENSIONS.map((ext) => `${withoutExt}${ext}`),
    ...INDEX_FILES.map((index) => `${withoutExt}${index}`),
  ];

  for (const option of candidates) {
    if (files.has(option)) return option;
  }

  return null;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function stripJsonComments(input: string): string {
  return input
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/,(\s*[}\]])/g, '$1');
}
