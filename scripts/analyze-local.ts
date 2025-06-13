#!/usr/bin/env tsx

import { ASTAnalyzer } from '../app/lib/parser/ast-analyzer';
import { ManifestReader } from '../app/lib/parser/manifest-reader';
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

async function analyzeLocalProject(projectPath: string) {
  const analyzer = new ASTAnalyzer(path.join(projectPath, 'tsconfig.json'));
  const manifestReader = new ManifestReader();
  
  console.log(`Analyzing project at: ${projectPath}`);
  
  // Try to read manifests
  const manifests = await manifestReader.readManifests(projectPath);
  if (manifests) {
    console.log('Found Next.js build manifests');
  }
  
  // Find files
  const files = await glob([
    'app/**/*.{js,jsx,ts,tsx}',
    'pages/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
  ], {
    cwd: projectPath,
    ignore: ['node_modules/**', '.next/**'],
  });
  
  console.log(`Found ${files.length} files to analyze`);
  
  const components = [];
  
  for (const file of files) {
    const content = await fs.promises.readFile(path.join(projectPath, file), 'utf-8');
    const result = await analyzer.analyzeFile(file, content);
    
    if (result) {
      components.push(result);
      console.log(`✓ ${result.name} (${result.type}) - ${file}`);
    }
  }
  
  console.log(`\nAnalyzed ${components.length} components`);
  
  // Save results
  await fs.promises.writeFile(
    path.join(projectPath, 'component-analysis.json'),
    JSON.stringify(components, null, 2)
  );
}

// Run if called directly
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  analyzeLocalProject(projectPath).catch(console.error);
} 