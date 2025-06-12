import { NextRequest, NextResponse } from 'next/server';
import { ComponentMetadata, ComponentType, PropMetadata } from '@/app/lib/types';
import { getCachedRepo, cacheRepo } from '@/app/lib/cache';

// GitHub API types
interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree';
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, branch = 'main', includeAllFiles = false } = await request.json();
    
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
    processRepository(owner, repoName, branch, writer, encoder, includeAllFiles).finally(() => {
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
  encoder: TextEncoder,
  includeAllFiles: boolean = false
) {
  try {
    const repoUrl = `https://github.com/${owner}/${repoName}`;
    
    // Check cache first
    await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Checking cache...' })}\n\n`));
    
    const cachedData = await getCachedRepo(repoUrl, branch);
    if (cachedData) {
      console.log(`📦 Using cached data for ${repoUrl}#${branch}`);
      
      // Send cached files immediately
      await writer.write(encoder.encode(`data: ${JSON.stringify({ 
        type: 'files', 
        allFiles: cachedData.allFiles,
        repository: cachedData.repository
      })}\n\n`));
      
      // Send cached components
      for (const component of cachedData.components) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ 
          type: 'component', 
          component 
        })}\n\n`));
      }
      
      // Send completion message
      await writer.write(encoder.encode(`data: ${JSON.stringify({ 
        type: 'complete',
        components: cachedData.components,
        totalFiles: cachedData.allFiles.length,
        analyzedFiles: cachedData.components.length,
        apiCallsUsed: 0, // No API calls used for cached data
        fromCache: true
      })}\n\n`));
      
      return;
    }

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
    const allFiles = includeAllFiles 
      ? files.filter(file => file.type === 'blob') // Only include actual files, not directories
      : files.filter(file => 
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

    // When includeAllFiles is true, fetch content for ALL files
    if (includeAllFiles) {
      console.log(`📁 Loading ALL ${allFiles.length} files from repository`);
      
      await writer.write(encoder.encode(`data: ${JSON.stringify({ 
        type: 'status', 
        message: `Loading ${allFiles.length} files...` 
      })}\n\n`));

      const components: ComponentMetadata[] = [];
      let apiCallCount = 1;
      
      // Load ALL files without limit
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        try {
          apiCallCount++;
          
          // Send progress update
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            type: 'progress', 
            current: i + 1,
            total: allFiles.length,
            file: file.path
          })}\n\n`));
          
          const fileContent = await fetchFileContent(owner, repoName, file.path, branch);
          
          // Create a simple metadata for all files
          const metadata: ComponentMetadata = {
            name: file.path.split('/').pop()?.replace(/\.\w+$/, '') || file.path,
            description: `File: ${file.path}`,
            type: determineComponentType(file.path, fileContent), // Determine actual type
            uses: [],
            props: [],
            file: file.path,
            exports: [],
            content: fileContent
          };
          
          components.push(metadata);
          
          // Send the file data immediately
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            type: 'component', 
            component: metadata 
          })}\n\n`));
          
          // Small delay to prevent overwhelming the API
          if (i % 10 === 0 && i > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (error) {
          console.warn(`Failed to load file ${file.path}:`, error);
        }
      }
      
      console.log(`🎉 Loaded ${components.length} files using ${apiCallCount} API calls`);
      
      // Cache the results
      const repository = { owner, name: repoName, branch };
      await cacheRepo(repoUrl, branch, components, allFiles, repository);
      
      // Send completion message
      await writer.write(encoder.encode(`data: ${JSON.stringify({ 
        type: 'complete',
        components,
        totalFiles: allFiles.length,
        analyzedFiles: components.length,
        apiCallsUsed: apiCallCount,
        fromCache: false,
        allFilesMode: true
      })}\n\n`));
      
      return; // Exit early when loading all files
    }

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
    
    // Cache the results for future use
    const repository = { owner, name: repoName, branch };
    await cacheRepo(repoUrl, branch, components, allFiles, repository);
    
    // Send completion message with final data
    await writer.write(encoder.encode(`data: ${JSON.stringify({ 
      type: 'complete',
      components,
      totalFiles: allFiles.length,
      analyzedFiles: components.length,
      apiCallsUsed: apiCallCount,
      fromCache: false
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
  // Prefer raw.githubusercontent.com to avoid GitHub REST API rate-limits
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

  try {
    const rawRes = await fetch(rawUrl);
    if (rawRes.ok) {
      console.log(`✅ Fetched (raw) ${path}`);
      return await rawRes.text();
    }
  } catch (rawErr) {
    console.warn(`⚠️  Raw fetch failed for ${path}:`, rawErr);
  }

  // Fallback to GitHub REST API (base64 encoded) – this counts towards rate-limit
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  console.log(`🔗 Fallback API fetch: ${apiUrl}`);

  const apiRes = await fetch(apiUrl, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      ...(process.env.GITHUB_TOKEN && { 'Authorization': `token ${process.env.GITHUB_TOKEN}` })
    }
  });

  if (!apiRes.ok) {
    console.error(`❌ API fetch failed: ${apiRes.status} ${apiRes.statusText} for ${path}`);
    throw new Error(`Failed to fetch file content: ${apiRes.status}`);
  }

  const data = await apiRes.json();
  if (data.content) {
    console.log(`✅ Successfully fetched (API) ${path}`);
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
    exports,
    content // Store the file content for later use
  };
}

function isNextJsComponentFile(content: string, filePath: string): boolean {
  // Always include API routes as utilities (they're important for understanding the app)
  if (filePath.includes('/api/') && filePath.match(/\.(ts|js)$/)) {
    return true; // Include API routes as utilities
  }
  
  // Include Next.js config files as utilities
  if (filePath.match(/(next\.config|tailwind\.config|postcss\.config|prettier\.config)\./)) {
    return true;
  }
  
  // Include TypeScript config and other important config files
  if (filePath.match(/(tsconfig|package)\.json$/) || 
      filePath.match(/\.(config|constants|utils|helpers)\.(tsx|jsx|ts|js)$/)) {
    return true;
  }
  
  // Include utility files and type definitions
  if (filePath.match(/\/(utils|lib|helpers|config|constants|types|services|modules)\//)) {
    return true;
  }
  
  // Include important root files
  if (filePath.match(/^(middleware|instrumentation)\.(ts|js)$/) ||
      filePath.endsWith('.d.ts')) {
    return true;
  }
  
  // Skip test files
  if (filePath.match(/\.(test|spec)\.(tsx|jsx|ts|js)$/)) {
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
  const isUtility = !!filePath.match(/\/(utils|lib|helpers|config|constants|services|modules|types)\//);
  
  // Check for export patterns (any exported function, class, or const)
  const hasExports = /export\s+(function|class|const|interface|type)/.test(content);
  
  return (hasReactImport || hasJSXReturn || isNextPage || isNextLayout || isHook || isUtility || hasExports) && 
         (hasExportDefault || hasComponentPattern || isHook || isUtility || hasExports);
}

function determineComponentType(filePath: string, content: string): ComponentType {
  // API Routes (Next.js)
  if (filePath.includes('/api/') && filePath.match(/\.(ts|js)$/)) {
    return ComponentType.UTILITY;
  }
  
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
  
  // Utilities, libs, helpers, configs, services, modules
  if (filePath.includes('/utils/') || 
      filePath.includes('/lib/') || 
      filePath.includes('/helpers/') ||
      filePath.includes('/config/') ||
      filePath.includes('/constants/') ||
      filePath.includes('/services/') ||
      filePath.includes('/modules/') ||
      filePath.includes('/types/') ||
      filePath.match(/\.(config|constants|utils|helpers|types)\.(tsx|jsx|ts|js)$/) ||
      filePath.match(/(tsconfig|package)\.json$/)) {
    return ComponentType.UTILITY;
  }
  
  // Default to component
  return ComponentType.COMPONENT;
}

function extractComponentName(content: string, fileName: string): string {
  // For utility/service files, try to extract a more meaningful name
  if (fileName.toLowerCase().includes('api') || fileName.toLowerCase().includes('service')) {
    // Look for class names or main object exports
    const classMatch = content.match(/(?:export\s+)?class\s+([A-Z][a-zA-Z0-9]*)/);
    if (classMatch) {
      return classMatch[1];
    }
    
    // Look for main service object
    const serviceMatch = content.match(/(?:export\s+)?const\s+([A-Za-z][a-zA-Z0-9]*(?:Service|API|Client))\s*=/);
    if (serviceMatch) {
      return serviceMatch[1];
    }
    
    // For API files, use "ApiService" or similar
    if (fileName.toLowerCase() === 'api') {
      return 'ApiService';
    }
  }
  
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
  
  // For utility files, create a meaningful name from filename
  if (fileName.match(/^(utils?|helpers?|lib|config|constants?)$/i)) {
    return fileName.charAt(0).toUpperCase() + fileName.slice(1).toLowerCase() + 'Utils';
  }
  
  // Fallback to filename with proper capitalization
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
      // Extract component/function names from the import
      const componentMatch = match[0].match(/import\s+(?:{([^}]+)}|(\w+))/);
      if (componentMatch) {
        const imports = componentMatch[1] 
          ? componentMatch[1].split(',').map(c => c.trim().replace(/\s+as\s+\w+/, '')) // Handle "as" aliases
          : [componentMatch[2]];
        
        // Add all imported items (components, functions, etc.)
        dependencies.push(...imports.filter(c => c && /^[A-Za-z]/.test(c)));
      }
      
      // Also try to infer the module name from the path for utility files
      const pathParts = importPath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      if (fileName && !fileName.startsWith('.')) {
        // Convert file names to potential export names
        const potentialExports = [
          fileName.replace(/\.(ts|js|tsx|jsx)$/, ''), // Remove extension
          fileName.charAt(0).toUpperCase() + fileName.slice(1).replace(/\.(ts|js|tsx|jsx)$/, ''), // Capitalize
        ];
        dependencies.push(...potentialExports.filter(name => name.length > 1));
      }
    }
  }
  
  // Also look for function calls in the code to detect usage
  // This helps catch cases where functions are imported but the import isn't clearly parsed
  const functionCallMatches = content.matchAll(/(?:await\s+)?(\w+)\s*\(/g);
  for (const match of functionCallMatches) {
    const functionName = match[1];
    // Only include if it's not a common JS keyword and starts with lowercase (utility functions)
    if (functionName && 
        functionName.length > 2 &&
        !/^(if|for|while|switch|return|const|let|var|function|import|export|console|JSON|Object|Array|String|Number|Boolean|Date|Math|Promise|Error)$/.test(functionName) &&
        /^[a-z]/.test(functionName)) {
      dependencies.push(functionName);
    }
  }
  
  // Remove duplicates and return
  return [...new Set(dependencies)];
}

function extractExports(content: string): string[] {
  const exports: string[] = [];
  
  // Extract named exports (ES6 style)
  const namedExportMatches = content.matchAll(/export\s+(?:function\s+(\w+)|const\s+(\w+)|{([^}]+)})/g);
  
  for (const match of namedExportMatches) {
    if (match[1]) exports.push(match[1]); // function export
    if (match[2]) exports.push(match[2]); // const export
    if (match[3]) { // destructured exports
      const names = match[3].split(',').map(n => n.trim());
      exports.push(...names);
    }
  }
  
  // Extract arrow function exports
  const arrowFunctionMatches = content.matchAll(/export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g);
  for (const match of arrowFunctionMatches) {
    exports.push(match[1]);
  }
  
  // Extract CommonJS exports (for .js files)
  const commonJSMatches = content.matchAll(/(?:module\.)?exports\.(\w+)\s*=|exports\[['"](\w+)['"]\]\s*=/g);
  for (const match of commonJSMatches) {
    const exportName = match[1] || match[2];
    if (exportName) exports.push(exportName);
  }
  
  // Extract functions that might be exported (look for function declarations)
  const functionDeclarations = content.matchAll(/(?:^|\n)\s*(?:const\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)|function\s+(\w+)\s*\([^)]*\)\s*{)/gm);
  for (const match of functionDeclarations) {
    const functionName = match[1] || match[2];
    if (functionName) {
      // Check if this function appears to be exported later
      if (content.includes(`exports.${functionName}`) || 
          content.includes(`export { ${functionName}`) ||
          content.includes(`export {${functionName}`) ||
          content.includes(`module.exports.${functionName}`)) {
        exports.push(functionName);
      }
    }
  }
  
  // Extract default export
  const defaultExportMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/);
  if (defaultExportMatch) {
    exports.push(defaultExportMatch[1]);
  }
  
  // For module.exports = { ... } pattern
  const moduleExportsMatch = content.match(/module\.exports\s*=\s*{([^}]+)}/);
  if (moduleExportsMatch) {
    const exportContent = moduleExportsMatch[1];
    const exportItems = exportContent.split(',').map(item => {
      const cleanItem = item.trim();
      // Handle both "key: value" and shorthand "key" syntax
      const keyMatch = cleanItem.match(/^(\w+)(?:\s*:|$)/);
      return keyMatch ? keyMatch[1] : null;
    }).filter((item): item is string => item !== null);
    exports.push(...exportItems);
  }
  
  // Remove duplicates
  return [...new Set(exports)];
}

function buildComponentRelationships(components: ComponentMetadata[]): void {
  // Create maps for faster lookups
  const componentsByName = new Map<string, ComponentMetadata>();
  const componentsByExports = new Map<string, ComponentMetadata>();
  const componentsByFileName = new Map<string, ComponentMetadata>();
  
  // Build lookup maps
  components.forEach(component => {
    componentsByName.set(component.name, component);
    
    // Map by exports
    if (component.exports) {
      component.exports.forEach(exportName => {
        componentsByExports.set(exportName, component);
      });
    }
    
    // Map by filename (without extension)
    const fileName = component.file.split('/').pop()?.replace(/\.(tsx|jsx|ts|js)$/, '');
    if (fileName) {
      componentsByFileName.set(fileName, component);
      // Also map capitalized version
      componentsByFileName.set(fileName.charAt(0).toUpperCase() + fileName.slice(1), component);
    }
  });

  // Build usedBy relationships
  for (const component of components) {
    if (component.uses) {
      for (const usedItem of component.uses) {
        let targetComponent: ComponentMetadata | undefined;
        
        // Try to find the target component in different ways
        // 1. Direct component name match
        targetComponent = componentsByName.get(usedItem);
        
        // 2. Export name match (for utility functions)
        if (!targetComponent) {
          targetComponent = componentsByExports.get(usedItem);
        }
        
        // 3. Filename match (for imported modules)
        if (!targetComponent) {
          targetComponent = componentsByFileName.get(usedItem);
        }
        
        // 4. Try to match with lowercase version (for utility functions)
        if (!targetComponent) {
          targetComponent = componentsByFileName.get(usedItem.toLowerCase());
        }
        
        // If we found a target component, create the relationship
        if (targetComponent && targetComponent !== component) {
          // Add to usedBy array
          if (!targetComponent.usedBy) {
            targetComponent.usedBy = [];
          }
          if (!targetComponent.usedBy.includes(component.name)) {
            targetComponent.usedBy.push(component.name);
          }
          
          // Clean up the uses array to reference the actual component name
          const usedIndex = component.uses.indexOf(usedItem);
          if (usedIndex !== -1 && targetComponent.name !== usedItem) {
            component.uses[usedIndex] = targetComponent.name;
          }
        }
      }
    }
  }
  
  // Remove duplicates and self-references
  components.forEach(component => {
    if (component.uses) {
      component.uses = [...new Set(component.uses.filter(name => name !== component.name))];
    }
    if (component.usedBy) {
      component.usedBy = [...new Set(component.usedBy.filter(name => name !== component.name))];
    }
  });
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