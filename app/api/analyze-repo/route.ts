import { NextRequest, NextResponse } from 'next/server';
import { ComponentMetadata, ComponentType, PropMetadata } from '@/app/lib/types';

// GitHub API types
interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree';
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, branch = 'main' } = await request.json();
    
    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    // Parse GitHub URL
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }

    const [, owner, repo] = repoMatch;
    const repoName = repo.replace(/\.git$/, ''); // Remove .git suffix if present

    // Create a TransformStream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start processing in the background
    processRepository(owner, repoName, branch, writer, encoder).finally(() => {
      writer.close();
    });

    // Return the stream as Server-Sent Events
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error analyzing repository:', error);
    return NextResponse.json(
      { error: 'Failed to analyze repository: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

async function processRepository(
  owner: string, 
  repoName: string, 
  branch: string,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder
) {
  try {
    // Send initial status
    await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Fetching repository structure...' })}\n\n`));

    // Get repository tree from GitHub API
    const treeUrl = `https://api.github.com/repos/${owner}/${repoName}/git/trees/${branch}?recursive=1`;
    
    console.log(`🌳 Fetching repository tree: ${treeUrl}`);
    const response = await fetch(treeUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // Add GitHub token if available for higher rate limits
        ...(process.env.GITHUB_TOKEN && {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`
        })
      }
    });

    if (!response.ok) {
      console.log(`❌ Tree fetch failed: ${response.status} ${response.statusText}`);
      const errorMessage = response.status === 404 
        ? 'Repository not found or branch does not exist'
        : `GitHub API error: ${response.status}`;
      
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`));
      return;
    }

    const treeData = await response.json();
    const files = treeData.tree as GitHubTreeItem[];

    // Get all files (not just component files) for the file tree
    const allFiles = files.filter(file => 
      !file.path.includes('node_modules') &&
      !file.path.includes('.next') &&
      !file.path.includes('dist') &&
      !file.path.includes('build')
    );

    // Send all files immediately for the file tree
    await writer.write(encoder.encode(`data: ${JSON.stringify({ 
      type: 'files', 
      allFiles,
      repository: { owner, name: repoName, branch }
    })}\n\n`));

    // Filter for React/Next.js component files with improved Next.js support
    const componentFiles = prioritizeNextJsFiles(files.filter(file => 
      file.type === 'blob' && 
      (file.path.endsWith('.tsx') || 
       file.path.endsWith('.jsx') || 
       file.path.endsWith('.ts') || 
       file.path.endsWith('.js')) &&
      !file.path.includes('node_modules') &&
      !file.path.includes('.next') &&
      !file.path.includes('dist') &&
      !file.path.includes('build')
    ));

    console.log(`📁 Found ${componentFiles.length} component files, analyzing all of them`);
    
    await writer.write(encoder.encode(`data: ${JSON.stringify({ 
      type: 'status', 
      message: `Found ${componentFiles.length} files to analyze...` 
    })}\n\n`));

    // Analyze files and extract component metadata
    const components: ComponentMetadata[] = [];
    let apiCallCount = 1; // Already made 1 call for the tree
    
    // Analyze all component files (with reasonable limit)
    const maxFilesToAnalyze = Math.min(componentFiles.length, 100); // Analyze up to 100 files
    
    for (let i = 0; i < maxFilesToAnalyze; i++) {
      const file = componentFiles[i];
      try {
        apiCallCount++;
        console.log(`📄 API call #${apiCallCount}: Fetching ${file.path}`);
        
        // Send progress update
        await writer.write(encoder.encode(`data: ${JSON.stringify({ 
          type: 'progress', 
          current: i + 1,
          total: maxFilesToAnalyze,
          file: file.path
        })}\n\n`));
        
        const fileContent = await fetchFileContent(owner, repoName, file.path, branch);
        const metadata = analyzeFileContent(file.path, fileContent);
        
        if (metadata) {
          components.push(metadata);
          console.log(`✅ Analyzed component: ${metadata.name} (${metadata.type})`);
          
          // Send the component immediately
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            type: 'component', 
            component: metadata 
          })}\n\n`));
        } else {
          console.log(`⚠️  No component found in ${file.path}`);
        }
      } catch (error) {
        console.warn(`❌ Failed to analyze file ${file.path}:`, error);
        // Continue with other files instead of failing completely
      }
    }

    // Build relationships between components
    buildComponentRelationships(components);

    console.log(`🎉 Analysis complete: ${apiCallCount} API calls, ${components.length} components found`);
    
    // Send completion message with final data
    await writer.write(encoder.encode(`data: ${JSON.stringify({ 
      type: 'complete',
      components,
      totalFiles: allFiles.length,
      analyzedFiles: components.length,
      apiCallsUsed: apiCallCount
    })}\n\n`));
    
  } catch (error) {
    console.error('Error processing repository:', error);
    await writer.write(encoder.encode(`data: ${JSON.stringify({ 
      type: 'error', 
      error: (error as Error).message 
    })}\n\n`));
  }
}

async function fetchFileContent(owner: string, repo: string, path: string, branch: string): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  
  console.log(`🔗 Fetching: ${url}`);
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      ...(process.env.GITHUB_TOKEN && {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`
      })
    }
  });

  if (!response.ok) {
    console.log(`❌ Fetch failed: ${response.status} ${response.statusText} for ${path}`);
    throw new Error(`Failed to fetch file content: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.content) {
    console.log(`✅ Successfully fetched ${path} (${data.content.length} chars)`);
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }
  
  throw new Error('No content found in file');
}

function analyzeFileContent(filePath: string, content: string): ComponentMetadata | null {
  const fileName = filePath.split('/').pop()?.replace(/\.(tsx|jsx|ts|js)$/, '') || '';
  
  // Skip if it's not a component file (using Next.js optimized function)
  if (!isNextJsComponentFile(content, filePath)) {
    return null;
  }

  // Determine component type
  const type = determineComponentType(filePath, content);
  
  // Extract component name
  const componentName = extractComponentName(content, fileName);
  
  // Extract description from comments
  const description = extractDescription(content);
  
  // Extract props
  const props = extractProps(content);
  
  // Extract imports/dependencies
  const uses = extractDependencies(content);
  
  // Extract exports
  const exports = extractExports(content);

  return {
    name: componentName,
    description,
    type,
    uses,
    props,
    file: filePath,
    exports
  };
}

function isNextJsComponentFile(content: string, filePath: string): boolean {
  // Skip API routes
  if (filePath.includes('/api/') && !filePath.match(/\.(tsx|jsx)$/)) {
    return false;
  }
  
  // Skip Next.js config files, but include them as utilities
  if (filePath.match(/(next\.config|tailwind\.config|postcss\.config)\./)) {
    return true; // Include as utility
  }
  
  // Skip test files
  if (filePath.match(/\.(test|spec)\.(tsx|jsx|ts|js)$/)) {
    return false;
  }
  
  // Skip type definition files unless they export components
  if (filePath.endsWith('.d.ts') && !/export.*Component|export.*Provider/.test(content)) {
    return false;
  }
  
  // Check if it's a React component file
  const hasReactImport = /import.*React/.test(content);
  const hasJSXReturn = /return\s*\([\s\S]*</.test(content);
  const hasExportDefault = /export\s+default/.test(content);
  const hasComponentPattern = /function\s+[A-Z]|const\s+[A-Z].*=|class\s+[A-Z]/.test(content);
  
  // Check for Next.js specific patterns
  const isNextPage = !!filePath.match(/\/(pages|app)\/.*\.(tsx|jsx|ts|js)$/);
  const isNextLayout = filePath.includes('layout.');
  
  // Check for hook pattern
  const isHook = /export\s+(function\s+use[A-Z]|const\s+use[A-Z])/.test(content);
  
  // Check for utility/config files
  const isUtility = !!filePath.match(/\/(utils|lib|helpers|config|constants)\//);
  
  return (hasReactImport || hasJSXReturn || isNextPage || isNextLayout || isHook || isUtility) && 
         (hasExportDefault || hasComponentPattern || isHook || isUtility);
}

function determineComponentType(filePath: string, content: string): ComponentType {
  // Next.js App Router patterns (priority order)
  
  // App Router pages (app/*/page.tsx)
  if (filePath.match(/\/app\/.*\/page\.(tsx|jsx|ts|js)$/)) {
    return ComponentType.PAGE;
  }
  
  // Pages Router pages (pages/*.tsx, but not _app, _document, api)
  if (filePath.match(/\/pages\/.*\.(tsx|jsx|ts|js)$/) && 
      !filePath.includes('_app') && 
      !filePath.includes('_document') && 
      !filePath.includes('/api/')) {
    return ComponentType.PAGE;
  }
  
  // App Router layouts (app/*/layout.tsx)
  if (filePath.match(/\/app\/.*\/layout\.(tsx|jsx|ts|js)$/)) {
    return ComponentType.LAYOUT;
  }
  
  // Global layouts or layout components
  if (filePath.includes('layout.') || 
      filePath.includes('/layouts/') || 
      filePath.includes('_app.') ||
      /Layout(?:Component)?$/.test(content)) {
    return ComponentType.LAYOUT;
  }
  
  // App Router loading, error, not-found pages
  if (filePath.match(/\/app\/.*(loading|error|not-found|global-error)\.(tsx|jsx|ts|js)$/)) {
    return ComponentType.PAGE;
  }
  
  // Route groups (app/(group)/page.tsx)
  if (filePath.match(/\/app\/\([^)]+\)\/.*\/page\.(tsx|jsx|ts|js)$/)) {
    return ComponentType.PAGE;
  }
  
  // Dynamic routes (app/[slug]/page.tsx)
  if (filePath.match(/\/app\/.*\[.*\].*\/page\.(tsx|jsx|ts|js)$/)) {
    return ComponentType.PAGE;
  }
  
  // Custom hooks (use prefix + hooks directory)
  if (filePath.includes('/hooks/') || 
      /export\s+(function\s+use[A-Z]|const\s+use[A-Z])/.test(content) ||
      filePath.match(/use[A-Z][a-zA-Z]*\.(tsx|jsx|ts|js)$/)) {
    return ComponentType.HOOK;
  }
  
  // Context providers and contexts
  if (filePath.includes('/context/') || 
      filePath.includes('Context') || 
      filePath.includes('Provider') ||
      /createContext|useContext|Provider/.test(content)) {
    return ComponentType.CONTEXT;
  }
  
  // Utilities, libs, helpers, configs
  if (filePath.includes('/utils/') || 
      filePath.includes('/lib/') || 
      filePath.includes('/helpers/') ||
      filePath.includes('/config/') ||
      filePath.includes('/constants/') ||
      filePath.match(/\.(config|constants|utils|helpers)\.(tsx|jsx|ts|js)$/)) {
    return ComponentType.UTILITY;
  }
  
  // Default to component
  return ComponentType.COMPONENT;
}

function extractComponentName(content: string, fileName: string): string {
  // Try to extract from export default
  const exportMatch = content.match(/export\s+default\s+(?:function\s+)?([A-Z][a-zA-Z0-9]*)/);
  if (exportMatch) {
    return exportMatch[1];
  }
  
  // Try to extract from function declaration
  const functionMatch = content.match(/(?:export\s+)?function\s+([A-Z][a-zA-Z0-9]*)/);
  if (functionMatch) {
    return functionMatch[1];
  }
  
  // Try to extract from const declaration
  const constMatch = content.match(/(?:export\s+)?const\s+([A-Z][a-zA-Z0-9]*)\s*=/);
  if (constMatch) {
    return constMatch[1];
  }
  
  // Fallback to filename
  return fileName.charAt(0).toUpperCase() + fileName.slice(1);
}

function extractDescription(content: string): string | undefined {
  // Look for JSDoc comments
  const jsdocMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
  if (jsdocMatch) {
    return jsdocMatch[1];
  }
  
  // Look for single line comments above component
  const commentMatch = content.match(/\/\/\s*(.+?)\n\s*(?:export\s+)?(?:function|const|class)/);
  if (commentMatch) {
    return commentMatch[1];
  }
  
  return undefined;
}

function extractProps(content: string): PropMetadata[] {
  const props: PropMetadata[] = [];
  
  // Look for TypeScript interface definitions
  const interfaceMatch = content.match(/interface\s+\w*Props\s*{([^}]+)}/);
  if (interfaceMatch) {
    const propsContent = interfaceMatch[1];
    const propMatches = propsContent.matchAll(/(\w+)(\?)?:\s*([^;]+);?/g);
    
    for (const match of propMatches) {
      props.push({
        name: match[1],
        type: match[3].trim(),
        required: !match[2],
        description: undefined
      });
    }
  }
  
  return props;
}

function extractDependencies(content: string): string[] {
  const dependencies: string[] = [];
  
  // Extract from import statements
  const importMatches = content.matchAll(/import\s+(?:{[^}]+}|\w+|[^}]+)\s+from\s+['"]([^'"]+)['"]/g);
  
  for (const match of importMatches) {
    const importPath = match[1];
    
    // Skip external libraries and focus on relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../') || importPath.startsWith('@/')) {
      // Extract component names from the import
      const componentMatch = match[0].match(/import\s+(?:{([^}]+)}|(\w+))/);
      if (componentMatch) {
        const components = componentMatch[1] 
          ? componentMatch[1].split(',').map(c => c.trim())
          : [componentMatch[2]];
        
        dependencies.push(...components.filter(c => c && /^[A-Z]/.test(c)));
      }
    }
  }
  
  return dependencies;
}

function extractExports(content: string): string[] {
  const exports: string[] = [];
  
  // Extract named exports
  const namedExportMatches = content.matchAll(/export\s+(?:function\s+(\w+)|const\s+(\w+)|{([^}]+)})/g);
  
  for (const match of namedExportMatches) {
    if (match[1]) exports.push(match[1]); // function export
    if (match[2]) exports.push(match[2]); // const export
    if (match[3]) { // destructured exports
      const names = match[3].split(',').map(n => n.trim());
      exports.push(...names);
    }
  }
  
  // Extract default export
  const defaultExportMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/);
  if (defaultExportMatch) {
    exports.push(defaultExportMatch[1]);
  }
  
  return exports;
}

function buildComponentRelationships(components: ComponentMetadata[]): void {
  // Build usedBy relationships
  for (const component of components) {
    if (component.uses) {
      for (const usedComponentName of component.uses) {
        const usedComponent = components.find(c => c.name === usedComponentName);
        if (usedComponent) {
          if (!usedComponent.usedBy) {
            usedComponent.usedBy = [];
          }
          if (!usedComponent.usedBy.includes(component.name)) {
            usedComponent.usedBy.push(component.name);
          }
        }
      }
    }
  }
}

// Enhanced file prioritization for Next.js
function prioritizeNextJsFiles(files: GitHubTreeItem[]): GitHubTreeItem[] {
  return files.sort((a, b) => {
    // Priority order for Next.js analysis
    const getPriority = (path: string): number => {
      if (path.match(/\/app\/.*\/page\.(tsx|jsx)$/)) return 1; // App Router pages
      if (path.match(/\/pages\/.*\.(tsx|jsx)$/)) return 2; // Pages Router pages
      if (path.match(/\/app\/.*\/layout\.(tsx|jsx)$/)) return 3; // App Router layouts
      if (path.includes('_app.') || path.includes('_document.')) return 4; // Special Next.js files
      if (path.match(/\/app\/.*(loading|error|not-found)\.(tsx|jsx)$/)) return 5; // App Router special pages
      if (path.includes('/components/')) return 6; // Components
      if (path.includes('/hooks/')) return 7; // Hooks
      if (path.includes('/context/')) return 8; // Context
      if (path.includes('/lib/') || path.includes('/utils/')) return 9; // Utilities
      if (path.endsWith('.config.js') || path.endsWith('.config.ts')) return 10; // Config files
      return 11; // Everything else
    };
    
    return getPriority(a.path) - getPriority(b.path);
  });
} 