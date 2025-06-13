import * as fs from 'fs';
import * as path from 'path';

export interface RouteManifest {
  pages: Record<string, string>;
  layouts: Record<string, string>;
  components: Record<string, {
    file: string;
    isClientComponent: boolean;
  }>;
}

export class ManifestReader {
  async readManifests(projectDir: string): Promise<RouteManifest | null> {
    const nextDir = path.join(projectDir, '.next');
    
    if (!fs.existsSync(nextDir)) {
      return null;
    }
    
    try {
      // Read app-paths-manifest.json
      const appManifestPath = path.join(nextDir, 'server', 'app-paths-manifest.json');
      const appManifest = await this.readJSON(appManifestPath);
      
      // Read server-reference-manifest.json for RSC boundaries
      const rscManifestPath = path.join(nextDir, 'server', 'server-reference-manifest.json');
      const rscManifest = await this.readJSON(rscManifestPath);
      
      return this.parseManifests(appManifest, rscManifest);
    } catch (error) {
      console.error('Failed to read manifests:', error);
      return null;
    }
  }
  
  private async readJSON(filePath: string): Promise<Record<string, unknown>> {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }
  
  private parseManifests(appManifest: Record<string, unknown>, rscManifest: Record<string, unknown>): RouteManifest {
    const result: RouteManifest = {
      pages: {},
      layouts: {},
      components: {},
    };
    
    // Parse app manifest
    Object.entries(appManifest).forEach(([route, info]) => {
      if (route.endsWith('/page')) {
        result.pages[route] = String(info);
      } else if (route.endsWith('/layout')) {
        result.layouts[route] = String(info);
      }
    });
    
    // Parse RSC manifest for client components
    if (rscManifest.clientModules && typeof rscManifest.clientModules === 'object') {
      Object.entries(rscManifest.clientModules as Record<string, unknown>).forEach(([id, info]) => {
        const moduleInfo = info as Record<string, unknown>;
        result.components[id] = {
          file: (moduleInfo.chunks as string[])?.[0] || id,
          isClientComponent: true,
        };
      });
    }
    
    return result;
  }
} 