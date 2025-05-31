"use client"

import { useState, useEffect, useMemo } from 'react';
import { 
  Sandpack,
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer 
} from '@codesandbox/sandpack-react';
import { sandpackDark } from '@codesandbox/sandpack-themes';
import { ComponentMetadata, ComponentType } from '../../lib/types';

interface SandpackEditorProps {
  component: ComponentMetadata;
  allComponents: ComponentMetadata[];
  repoUrl: string;
}

export default function SandpackEditor({ component, allComponents, repoUrl }: SandpackEditorProps) {
  const [showFileExplorer, setShowFileExplorer] = useState(true);

  // Create files object for Sandpack - include ALL files
  const files = useMemo(() => {
    const fileMap: Record<string, string> = {};
    
    // Add ALL files from allComponents to Sandpack
    allComponents.forEach(comp => {
      const fileName = comp.file.startsWith('/') ? comp.file : `/${comp.file}`;
      fileMap[fileName] = comp.content || `// File: ${comp.file}\n// Content not available`;
    });
    
    // Create a simple App.tsx if it doesn't exist
    if (!fileMap['/App.tsx'] && !fileMap['/app.tsx'] && !fileMap['/App.js'] && !fileMap['/app.js']) {
      // Check if the selected component is a page or regular component
      const isPage = component.type === ComponentType.PAGE || 
                    component.file.includes('/page.') ||
                    component.file.includes('/pages/');
      
      if (isPage) {
        fileMap['/App.tsx'] = `// Auto-generated App wrapper
import PageComponent from '.${component.file}';

export default function App() {
  return <PageComponent />;
}`;
      } else {
        fileMap['/App.tsx'] = `// Auto-generated App wrapper
import ${component.name} from '.${component.file}';

export default function App() {
  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '20px', color: '#333', fontSize: '24px', fontWeight: '600' }}>
          ${component.name} Component Preview
        </h1>
        <div style={{ 
          background: 'white', 
          border: '1px solid #e5e7eb', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        }}>
          <${component.name} />
        </div>
      </div>
    </div>
  );
}`;
      }
    }
    
    // Add package.json if it doesn't exist
    if (!fileMap['/package.json']) {
      fileMap['/package.json'] = JSON.stringify({
        "name": "sandpack-project",
        "version": "1.0.0",
        "main": "/App.tsx",
        "dependencies": {
          "react": "^18.0.0",
          "react-dom": "^18.0.0",
          "@types/react": "^18.0.0",
          "@types/react-dom": "^18.0.0"
        }
      }, null, 2);
    }
    
    // Add basic styles if not present
    if (!fileMap['/styles.css'] && !fileMap['/index.css'] && !fileMap['/global.css']) {
      fileMap['/styles.css'] = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #ffffff;
  color: #111827;
  line-height: 1.5;
}`;
    }
    
    return fileMap;
  }, [component, allComponents]);

  // Custom theme
  const customTheme = {
    ...sandpackDark,
    colors: {
      ...sandpackDark.colors,
      surface1: '#1e1e1e',
      surface2: '#252526',
      surface3: '#3c3c3c',
    },
  };

  // Extract dependencies from all files
  const dependencies = useMemo(() => {
    const deps: Record<string, string> = {
      'react': '^18.0.0',
      'react-dom': '^18.0.0',
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0',
    };
    
    // Scan all files for common dependencies
    allComponents.forEach(comp => {
      const content = comp.content || '';
      
      // Common dependencies based on imports
      if (content.includes('next/link') || content.includes('next/image') || content.includes('next/router')) {
        deps['next'] = 'latest';
      }
      if (content.includes('lucide-react')) {
        deps['lucide-react'] = 'latest';
      }
      if (content.includes('clsx')) {
        deps['clsx'] = 'latest';
      }
      if (content.includes('framer-motion')) {
        deps['framer-motion'] = 'latest';
      }
      if (content.includes('@radix-ui')) {
        deps['@radix-ui/react-slot'] = 'latest';
      }
      if (content.includes('class-variance-authority')) {
        deps['class-variance-authority'] = 'latest';
      }
      if (content.includes('tailwind-merge')) {
        deps['tailwind-merge'] = 'latest';
      }
      if (content.includes('axios')) {
        deps['axios'] = 'latest';
      }
      if (content.includes('react-hook-form')) {
        deps['react-hook-form'] = 'latest';
      }
      if (content.includes('zod')) {
        deps['zod'] = 'latest';
      }
    });
    
    return deps;
  }, [allComponents]);

  return (
    <div className="h-full bg-gray-900">
      <div className="h-full flex flex-col">
        {/* Toggle button for file explorer */}
        <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
          <h3 className="text-sm font-medium text-gray-300">
            {component.name} - Full Repository
          </h3>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-400">
              {allComponents.length} files loaded
            </span>
            <button
              onClick={() => setShowFileExplorer(!showFileExplorer)}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              {showFileExplorer ? 'Hide' : 'Show'} File Explorer
            </button>
          </div>
        </div>
        
        {/* Sandpack with modular components */}
        <div className="flex-1">
          <SandpackProvider
            files={files}
            theme={customTheme}
            template="react-ts"
            customSetup={{
              dependencies,
              devDependencies: {
                '@types/node': '^18.0.0',
                'typescript': '^5.0.0',
              }
            }}
          >
            <SandpackLayout className="h-full">
              {showFileExplorer && (
                <SandpackFileExplorer 
                  style={{ minWidth: '240px' }}
                />
              )}
              <SandpackCodeEditor 
                showTabs
                showLineNumbers
                wrapContent
                style={{ flex: 1 }}
              />
              <SandpackPreview 
                showNavigator
                showOpenInCodeSandbox
                showRefreshButton
                style={{ minWidth: '400px' }}
              />
            </SandpackLayout>
          </SandpackProvider>
        </div>
      </div>
    </div>
  );
} 