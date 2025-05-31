"use client"

import { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import FileExplorer from '../components/explorer/FileExplorer';
import SandpackEditor from '../components/codesandbox2/SandpackEditor';
import { useComponentData } from '../lib/context/ComponentDataContext';
import { ComponentMetadata } from '../lib/types';
import Link from 'next/link';

interface GitHubFile {
  path: string;
  type: 'blob' | 'tree';
  url: string;
}

export default function CodeSandbox2Page() {
  const { components: contextComponents, updateComponents } = useComponentData();
  const [repoUrl, setRepoUrl] = useState('https://github.com/admineral/OpenAI-Assistant-API-Chat');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [message, setMessage] = useState('');
  const [allFiles, setAllFiles] = useState<GitHubFile[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<ComponentMetadata | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Function to analyze GitHub repository (always loads all files)
  const analyzeRepository = async () => {
    const urlToAnalyze = repoUrl.trim();
    
    if (!urlToAnalyze) {
      setMessage('Please enter a repository URL');
      return;
    }
    
    setIsAnalyzing(true);
    setMessage('Loading all repository files...');
    
    try {
      const response = await fetch('/api/analyze-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          repoUrl: urlToAnalyze,
          includeAllFiles: true // Always load all files
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        setMessage(`Error: ${error.error || 'Failed to analyze repository'}`);
        return;
      }

      // Clear existing components when starting new analysis
      updateComponents([]);
      setAllFiles([]);
      
      // Read the stream
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

  // Handle component selection
  const handleSelectComponent = (componentName: string) => {
    const component = contextComponents.find(c => c.name === componentName);
    if (component) {
      setSelectedComponent(component);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAnalyzing) {
      analyzeRepository();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="h-14 border-b border-gray-300 flex items-center px-4 bg-gray-900 text-white">
        <div className="flex items-center space-x-2">
          <Link 
            href="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm">Back</span>
          </Link>
        </div>
        
        <h1 className="text-lg font-semibold ml-4">
          CodeSandbox2 - Full Repository in Sandpack
        </h1>
        
        {/* GitHub Repository Input */}
        <div className="ml-auto flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-gray-800 rounded-md px-3 py-1">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="https://github.com/username/repository"
              className="bg-transparent text-white placeholder-gray-400 border-none outline-none text-sm w-96"
              disabled={isAnalyzing}
            />
          </div>
          
          <button
            onClick={analyzeRepository}
            disabled={isAnalyzing}
            className="px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
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

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-800 transition-colors"
            title={isSidebarOpen ? "Hide file explorer" : "Show file explorer"}
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={isSidebarOpen ? "M4 6h16M4 12h16M4 18h7" : "M4 6h16M4 12h16M4 18h16"} 
              />
            </svg>
          </button>
        </div>
      </header>
      
      {/* Message bar */}
      {message && (
        <div className="bg-blue-50 border-l-4 border-blue-600 text-blue-900 p-2 text-sm">
          {message}
        </div>
      )}
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* File Explorer */}
          {isSidebarOpen && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
                <FileExplorer 
                  components={contextComponents}
                  allFiles={allFiles}
                  selectedComponent={selectedComponent?.name || null}
                  onSelectComponent={handleSelectComponent}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}
          
          {/* Sandpack Editor */}
          <ResizablePanel defaultSize={isSidebarOpen ? 80 : 100}>
            {contextComponents.length > 0 ? (
              <SandpackEditor 
                component={selectedComponent || contextComponents[0]}
                allComponents={contextComponents}
                repoUrl={repoUrl}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50">
                <svg className="w-24 h-24 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l-5.172-5.172a4 4 0 11-2.828 2.828L10 20zm9-8a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Load a Repository</h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  Enter a GitHub repository URL to load all files into Sandpack
                </p>
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    All repository files will be loaded, including configuration files, tests, and documentation
                  </p>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
} 