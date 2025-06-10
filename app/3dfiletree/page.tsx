"use client"

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useComponentData } from '../lib/context/ComponentDataContext'
import { ComponentMetadata } from '../lib/types'

// Dynamic import for 3D components to prevent SSR issues
const FileTree3DScene = dynamic(() => import('../components/3dfiletree/FileTree3DScene'), {
  ssr: false,
  loading: () => <LoadingScreen />,
})

interface GitHubFile {
  path: string;
  type: 'blob' | 'tree';
  url: string;
}

// Loading screen component
function LoadingScreen() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500 opacity-20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Loading 3D File Tree</h2>
        <p className="text-purple-200">Preparing interactive environment...</p>
      </div>
    </div>
  )
}

export default function ThreeDFileTreePage() {
  const { components: contextComponents, updateComponents } = useComponentData();
  const [repoUrl, setRepoUrl] = useState('https://github.com/admineral/OpenAI-Assistant-API-Chat');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [message, setMessage] = useState('');
  const [, setAllFiles] = useState<GitHubFile[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<ComponentMetadata | null>(null);
  const [showControls, setShowControls] = useState(true);

  // Function to analyze GitHub repository
  const analyzeRepository = async () => {
    const urlToAnalyze = repoUrl.trim();
    
    if (!urlToAnalyze) {
      setMessage('Please enter a repository URL');
      return;
    }
    
    setIsAnalyzing(true);
    setMessage('Loading repository files...');
    
    try {
      const response = await fetch('/api/analyze-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          repoUrl: urlToAnalyze,
          includeAllFiles: true
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        setMessage(`Error: ${error.error || 'Failed to analyze repository'}`);
        return;
      }

      updateComponents([]);
      setAllFiles([]);
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body');
      }

      const tempComponents: ComponentMetadata[] = [];
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true }); 
        
        let eolIndex;
        while ((eolIndex = buffer.indexOf('\n')) >= 0) { 
          const line = buffer.slice(0, eolIndex).trim();
          buffer = buffer.slice(eolIndex + 1);

          if (line.startsWith('data: ')) {
            try {
              const rawJson = line.slice(6);
              const data = JSON.parse(rawJson);
              
              switch (data.type) {
                case 'status':
                  setMessage(data.message);
                  break;
                  
                case 'files':
                  setAllFiles(data.allFiles || []);
                  break;
                  
                case 'component':
                  tempComponents.push(data.component);
                  updateComponents([...tempComponents]);
                  setMessage(`Loading files... ${tempComponents.length} loaded`);
                  break;
                  
                case 'progress':
                  setMessage(`Loading file ${data.current}/${data.total}: ${data.file}`);
                  break;
                  
                case 'complete':
                  updateComponents(data.components);
                  const cacheMessage = data.fromCache ? ' (from cache)' : '';
                  setMessage(`Successfully loaded ${data.analyzedFiles} files${cacheMessage}`);
                  // Auto-select first App.tsx or page.tsx if available
                  const appFile = data.components.find((c: ComponentMetadata) => 
                    c.file.includes('App.') || c.file.includes('page.') || c.file.includes('index.')
                  );
                  if (appFile) {
                    setSelectedComponent(appFile);
                  }
                  break;
                  
                case 'error':
                  setMessage(`Error: ${data.error}`);
                  break;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAnalyzing) {
      analyzeRepository();
    }
  };

  // Handle component selection
  const handleSelectComponent = (componentName: string) => {
    const component = contextComponents.find(c => c.name === componentName);
    if (component) {
      setSelectedComponent(component);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <Link 
            href="/"
            className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">3D File Tree</h1>
            <p className="text-purple-200 text-sm mt-1">
              Interactive file tree and code editing in 3D space
            </p>
          </div>
          
          <div className="w-32">
            {/* Empty div for layout balance */}
          </div>
        </div>
      </div>

      {/* Repository Input */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto">
        <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-md rounded-lg p-3">
          <svg className="w-5 h-5 text-purple-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="https://github.com/username/repository"
            className="bg-transparent text-white placeholder-purple-300 border-none outline-none text-sm w-96"
            disabled={isAnalyzing}
          />
          <button
            onClick={analyzeRepository}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              'Load Repository'
            )}
          </button>
        </div>
        
        {/* Message */}
        {message && (
          <div className="mt-2 bg-black/30 backdrop-blur-md rounded-lg p-2 text-purple-200 text-sm text-center">
            {message}
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      <FileTree3DScene 
        components={contextComponents}
        selectedComponent={selectedComponent}
        onSelectComponent={handleSelectComponent}
      />

      {/* Controls Help */}
      {showControls && (
        <div className="absolute bottom-6 right-6 z-10">
          <div className="bg-black/30 backdrop-blur-md rounded-lg p-4 text-white max-w-xs">
            <h3 className="font-semibold mb-2 flex items-center justify-between">
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Controls
              </span>
              <button
                onClick={() => setShowControls(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </h3>
            <div className="text-sm space-y-1 text-purple-100">
              <div><strong>Mouse:</strong> Rotate view</div>
              <div><strong>Scroll:</strong> Zoom in/out</div>
              <div><strong>Click file:</strong> Select file</div>
              <div><strong>Click card:</strong> Focus on editor</div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
} 