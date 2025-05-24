"use client"

import { useState } from 'react';
import Canvas from './components/canvas/Canvas';
import FileExplorer from './components/explorer/FileExplorer';
import PropertiesPanel from './components/properties/PropertiesPanel';
import { useComponentGraph } from './lib/hooks/useComponentGraph';
import { useComponentData } from './lib/context/ComponentDataContext';
import { ComponentMetadata } from './lib/types';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import 'reactflow/dist/style.css';

interface GitHubFile {
  path: string;
  type: 'blob' | 'tree';
  url: string;
}

export default function Home() {
  const { components: contextComponents, updateComponents, isLoading } = useComponentData();
  const { components, selectedNode, selectNode, nodes, edges, onNodesChange, onEdgesChange, resetLayout } = useComponentGraph(contextComponents);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(true);
  const [repoUrl, setRepoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [message, setMessage] = useState('');
  const [allFiles, setAllFiles] = useState<GitHubFile[]>([]);
  
  const selectedComponent = selectedNode 
    ? components.find(c => c.name === selectedNode) || null
    : null;
  
  // Function to analyze GitHub repository
  const analyzeRepository = async () => {
    const urlToAnalyze = repoUrl.trim() || 'https://github.com/admineral/OpenAI-Assistant-API-Chat';
    
    setIsAnalyzing(true);
    setMessage('Analyzing repository...');
    
    try {
      const response = await fetch('/api/analyze-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl: urlToAnalyze }),
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
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'status':
                  setMessage(data.message);
                  break;
                  
                case 'files':
                  setAllFiles(data.allFiles || []);
                  break;
                  
                case 'component':
                  // Add component to temporary array
                  tempComponents.push(data.component);
                  // Update the components immediately so they appear on canvas
                  updateComponents([...tempComponents]);
                  setMessage(`Analyzing... Found ${tempComponents.length} components`);
                  break;
                  
                case 'progress':
                  setMessage(`Analyzing file ${data.current}/${data.total}: ${data.file}`);
                  break;
                  
                case 'complete':
                  // Final update with all components and relationships built
                  updateComponents(data.components);
                  setMessage(`Successfully analyzed ${data.analyzedFiles} components from ${data.totalFiles} files`);
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

  // Show a loading state if data is being loaded
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-white justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-700">Loading component data...</p>
      </div>
    );
  }
  
  // Show welcome message if no components are loaded
  const hasComponents = components.length > 0;
  
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="h-14 border-b border-gray-300 flex items-center px-4 bg-gray-900 text-white">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
        <h1 className="text-lg font-semibold ml-4">
          DocAI - Component Visualization
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
              placeholder="https://github.com/admineral/OpenAI-Assistant-API-Chat"
              className="bg-transparent text-white placeholder-gray-400 border-none outline-none text-sm w-80"
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
                Analyzing...
              </>
            ) : (
              'Analyze'
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
          
          <button
            onClick={() => setIsDetailsPanelOpen(!isDetailsPanelOpen)}
            className="p-2 rounded-md hover:bg-gray-800 transition-colors"
            title={isDetailsPanelOpen ? "Hide details panel" : "Show details panel"}
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
                d={isDetailsPanelOpen ? "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : "M13 16h-1v-4h-1m1-4h.01M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"} 
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
                  components={components}
                  allFiles={allFiles}
                  selectedComponent={selectedNode}
                  onSelectComponent={selectNode}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}
          
          {/* Canvas */}
          <ResizablePanel defaultSize={isSidebarOpen && isDetailsPanelOpen ? 60 : isSidebarOpen || isDetailsPanelOpen ? 80 : 100}>
            {hasComponents ? (
              <Canvas 
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={(nodeId) => selectNode(nodeId || null)}
                onResetLayout={resetLayout}
                selectedNodeId={selectedNode}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <svg className="w-24 h-24 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to DocAI</h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  Visualize and explore the component architecture of any GitHub repository.
                </p>
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Enter a GitHub repository URL above and click &quot;Analyze&quot; to get started.
                  </p>
                  <p className="text-sm text-gray-500">
                    Example: <code className="bg-gray-100 px-2 py-1 rounded text-xs">https://github.com/admineral/OpenAI-Assistant-API-Chat</code>
                  </p>
                </div>
              </div>
            )}
          </ResizablePanel>
          
          {/* Properties panel */}
          {isDetailsPanelOpen && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
                <PropertiesPanel 
                  component={selectedComponent} 
                  relatedComponents={components}
                  onSelectComponent={selectNode}
                  repoUrl={repoUrl.trim() || 'https://github.com/admineral/OpenAI-Assistant-API-Chat'}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
