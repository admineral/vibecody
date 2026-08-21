#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { analyzeDirectory } from '../app/lib/analysis/pipeline';

async function analyzeLocalProject(projectPath: string) {
  console.log(`Analyzing project at: ${projectPath}`);

  const result = await analyzeDirectory({
    rootDir: projectPath,
    onProgress: async (event) => {
      if (event.type === 'progress') {
        process.stdout.write(`\rAnalyzing ${event.current}/${event.total}: ${event.file}`.padEnd(80));
      }
    },
  });

  console.log(`\nAnalyzed ${result.components.length} components, ${result.edges.length} edges`);

  const outputPath = path.join(projectPath, 'component-analysis.json');
  await fs.promises.writeFile(
    outputPath,
    JSON.stringify(
      {
        components: result.components,
        edges: result.edges,
      },
      null,
      2
    )
  );
  console.log(`Wrote ${outputPath}`);
}

analyzeLocalProject(process.argv[2] || process.cwd()).catch((error) => {
  console.error(error);
  process.exit(1);
});
