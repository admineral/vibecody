import { loadResolverConfig, resolveImport } from '../app/lib/analysis/graph/import-resolver';

async function main() {
  const files = [
    'app/page.tsx',
    'app/lib/analysis/pipeline.ts',
    'app/lib/cache/index.ts',
    'app/lib/hooks/useComponentGraph.ts',
    'app/components/workspace/CacheMenu.tsx',
    'components/ui/button.tsx',
    'lib/utils.ts',
  ];
  const config = await loadResolverConfig(process.cwd(), files);

  const cases: Array<[string, string, string | null]> = [
    ['app/page.tsx', '@/app/lib/analysis/pipeline', 'app/lib/analysis/pipeline.ts'],
    ['app/page.tsx', './lib/hooks/useComponentGraph', 'app/lib/hooks/useComponentGraph.ts'],
    ['app/lib/analysis/pipeline.ts', '@/app/lib/cache', 'app/lib/cache/index.ts'],
    ['app/components/workspace/CacheMenu.tsx', '@/components/ui/button', 'components/ui/button.tsx'],
    ['app/page.tsx', 'react', null],
    ['app/page.tsx', 'lucide-react', null],
  ];

  let failed = 0;
  for (const [from, spec, expected] of cases) {
    const resolved = resolveImport(from, spec, config);
    const ok = resolved === expected;
    console.log(`${ok ? 'ok' : 'FAIL'} ${from} <- ${spec} => ${resolved} (expected ${expected})`);
    if (!ok) failed += 1;
  }

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
