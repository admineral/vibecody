import { NextRequest, NextResponse } from 'next/server';
import { ComponentMetadata } from '@/app/lib/types';
import { getCachedRepo, cacheRepo } from '@/app/lib/cache';
import { ASTAnalyzer } from '@/app/lib/parser/ast-analyzer';
import { RepoDownloader } from '@/app/lib/parser/repo-downloader';
// import { ManifestReader } from '@/app/lib/parser/manifest-reader'; // Reserved for future use
import * as path from 'path';
import { glob } from 'glob';
import * as fs from 'fs';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { repoUrl, branch = 'main', includeAllFiles = false } = body;

  if (!repoUrl) {
    return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
  }

  // Extract owner and repo name from URL
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    return NextResponse.json({ error: 'Invalid GitHub repository URL' }, { status: 400 });
  }

  const [, owner, repoName] = match;

  // Create a streaming response
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const writer = {
        write: async (chunk: Uint8Array) => {
          controller.enqueue(chunk);
        },
        close: async () => {
          controller.close();
        }
      };

      try {
        await processRepositoryAST(owner, repoName, branch, writer, encoder, includeAllFiles);
      } catch (error) {
        console.error('Error in stream:', error);
        const errorMessage = `data: ${JSON.stringify({ 
          type: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })}\n\n`;
        controller.enqueue(encoder.encode(errorMessage));
      } finally {
        controller.close();
      }
    }
  });

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function processRepositoryAST(
  owner: string,
  repoName: string,
  branch: string,
  writer: { write: (chunk: Uint8Array) => Promise<void>; close: () => Promise<void> },
  encoder: TextEncoder,
  includeAllFiles: boolean = false
) {
  const downloader = new RepoDownloader();
  const analyzer = new ASTAnalyzer();
  // const manifestReader = new ManifestReader(); // Reserved for future use when analyzing built projects
  let tempDir: string | null = null;
  
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
        apiCallsUsed: 0,
        fromCache: true
      })}\n\n`));
      
      return;
    }

    // Download repository
    await writer.write(encoder.encode(`data: ${JSON.stringify({ 
      type: 'status', 
      message: 'Downloading repository...' 
    })}\n\n`));
    
    tempDir = await downloader.downloadRepo({
      owner,
      repo: repoName,
      branch,
      token: process.env.GITHUB_TOKEN,
    });
    
    // Try to read Next.js manifests (for future use)
    // const manifests = await manifestReader.readManifests(tempDir);
    
    // Find all relevant files
    const patterns = includeAllFiles 
      ? ['**/*.{js,jsx,ts,tsx,json,md,mdx,css,scss}']
      : ['app/**/*.{js,jsx,ts,tsx}', 'pages/**/*.{js,jsx,ts,tsx}', 
         'components/**/*.{js,jsx,ts,tsx}', 'lib/**/*.{js,jsx,ts,tsx}',
         'utils/**/*.{js,jsx,ts,tsx}', 'hooks/**/*.{js,jsx,ts,tsx}',
         'contexts/**/*.{js,jsx,ts,tsx}', 'services/**/*.{js,jsx,ts,tsx}',
         '*.config.{js,ts}', 'package.json'];
    
    const files = await glob(patterns, {
      cwd: tempDir,
      ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**'],
    });
    
    console.log(`Found ${files.length} files to analyze`);
    
    // Send file list
    const allFiles = files.map(file => ({
      path: file,
      type: 'blob' as const,
      url: `https://github.com/${owner}/${repoName}/blob/${branch}/${file}`,
    }));
    
    await writer.write(encoder.encode(`data: ${JSON.stringify({ 
      type: 'files', 
      allFiles,
      repository: { owner, name: repoName, branch }
    })}\n\n`));
    
    // Analyze files
    const components: ComponentMetadata[] = [];
    let analyzedCount = 0;
    
    for (const file of files) {
      try {
        const filePath = path.join(tempDir, file);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        
        // Send progress
        await writer.write(encoder.encode(`data: ${JSON.stringify({ 
          type: 'progress', 
          current: analyzedCount + 1,
          total: files.length,
          file
        })}\n\n`));
        
        const parsed = await analyzer.analyzeFile(file, content);
        
        if (parsed) {
          const metadata: ComponentMetadata = {
            name: parsed.name,
            description: parsed.description,
            type: parsed.type,
            uses: parsed.imports,
            props: parsed.props,
            file: parsed.file,
            exports: parsed.exports,
            content: includeAllFiles ? content : undefined,
            isClientComponent: parsed.isClientComponent,
            isServerComponent: !parsed.isClientComponent,
          };
          
          components.push(metadata);
          analyzedCount++;
          
          // Send component immediately
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            type: 'component', 
            component: metadata 
          })}\n\n`));
        }
      } catch (error) {
        console.warn(`Failed to analyze ${file}:`, error);
      }
    }
    
    // Build relationships
    buildComponentRelationships(components);
    
    // Cache results
    const repository = { owner, name: repoName, branch };
    await cacheRepo(repoUrl, branch, components, allFiles, repository);
    
    // Send completion
    await writer.write(encoder.encode(`data: ${JSON.stringify({ 
      type: 'complete',
      components,
      totalFiles: files.length,
      analyzedFiles: components.length,
      apiCallsUsed: 1, // Only the download counts as an API call now
      fromCache: false
    })}\n\n`));
    
  } catch (error) {
    console.error('Error processing repository:', error);
    await writer.write(encoder.encode(`data: ${JSON.stringify({ 
      type: 'error', 
      error: (error as Error).message 
    })}\n\n`));
  } finally {
    // Clean up temp directory
    if (tempDir) {
      try {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Failed to clean up temp directory:', error);
      }
    }
  }
}

// Build relationships between components based on imports/exports
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