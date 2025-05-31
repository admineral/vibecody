"use client"

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
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

// Dynamic import for 3D component to prevent SSR issues
const CodeCarousel3D = dynamic(() => import('./components/canvas/CodeCarousel3D'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading 3D Carousel...</p>
      </div>
    </div>
  ),
});

// Error boundary for 3D component
function ThreeDErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      if (error.message?.includes('reconciler') || 
          error.message?.includes('fiber') ||
          error.message?.includes('ReactCurrentOwner') ||
          error.message?.includes('react-three')) {
        console.error('3D rendering error caught:', error);
        setHasError(true);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('reconciler') || 
          event.reason?.message?.includes('fiber') ||
          event.reason?.message?.includes('ReactCurrentOwner') ||
          event.reason?.message?.includes('react-three')) {
        console.error('3D rendering promise rejection caught:', event.reason);
        setHasError(true);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-white text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">3D View Error</h3>
          <p className="text-gray-300">The 3D visualization encountered a compatibility issue.</p>
          <p className="text-sm text-gray-400 mt-2">This may be due to React Three Fiber compatibility with your React version.</p>
          <p className="text-sm text-gray-400 mt-1">Please use the 2D canvas view instead.</p>
          <button 
            onClick={() => setHasError(false)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

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
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [cacheStats, setCacheStats] = useState<{
    totalFiles: number;
    totalSizeMB: number;
    oldestFile?: string;
    newestFile?: string;
  } | null>(null);
  const [showCacheInfo, setShowCacheInfo] = useState(false);
  
  const selectedComponent = selectedNode 
    ? components.find(c => c.name === selectedNode) || null
    : null;

  // Fetch cache stats on component mount
  useEffect(() => {
    const fetchCacheStats = async () => {
      try {
        const response = await fetch('/api/cache');
        if (response.ok) {
          const data = await response.json();
          setCacheStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch cache stats:', error);
      }
    };

    fetchCacheStats();
  }, []);

  // Close cache info when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCacheInfo && !(event.target as Element)?.closest('.cache-dropdown')) {
        setShowCacheInfo(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCacheInfo]);

  // Clear cache function
  const clearCache = async () => {
    try {
      const response = await fetch('/api/cache', { method: 'DELETE' });
      if (response.ok) {
        setCacheStats({ totalFiles: 0, totalSizeMB: 0 });
        setMessage('Cache cleared successfully');
      } else {
        setMessage('Failed to clear cache');
      }
    } catch {
      setMessage('Error clearing cache');
    }
  };
  
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
      let buffer = ''; // Buffer to hold incomplete lines
      let doneReading = false; // Variable to track if reader is done
      
      while (true) {
        const { done, value } = await reader.read();
        doneReading = done; // Update doneReading status
        if (doneReading) break;
        
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
                  const cacheMessage = data.fromCache ? ' (from cache)' : '';
                  setMessage(`Successfully analyzed ${data.analyzedFiles} components from ${data.totalFiles} files${cacheMessage}`);
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

      // If the stream ends and there's still data in the buffer, try to process it
      if (doneReading && buffer.trim().startsWith('data: ')) {
        try {
          const rawJson = buffer.trim().slice(6);
          const data = JSON.parse(rawJson);
          // Handle the last piece of data (similar to the switch statement above)
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
                setMessage(`Analyzing... Found ${tempComponents.length} components`);
                break;
              case 'progress':
                setMessage(`Analyzing file ${data.current}/${data.total}: ${data.file}`);
                break;
              case 'complete':
                updateComponents(data.components);
                setMessage(`Successfully analyzed ${data.analyzedFiles} components from ${data.totalFiles} files`);
                break;
              case 'error':
                setMessage(`Error: ${data.error}`);
                break;
            }
        } catch (e) {
          console.error('Failed to parse final SSE data:', e, 'Buffer content:', buffer);
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
          
          {/* View mode toggle */}
          {hasComponents && (
            <div className="flex items-center bg-gray-800 rounded-md p-1">
              <button
                onClick={() => setViewMode('2d')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === '2d' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                2D Graph
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === '3d' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                3D Carousel
              </button>
            </div>
          )}
          
          {/* Cache Management */}
          <div className="relative cache-dropdown">
            <button
              onClick={() => setShowCacheInfo(!showCacheInfo)}
              className="px-4 py-1 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center text-sm"
              title="Cache Management"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              Cache
              {cacheStats && cacheStats.totalFiles > 0 && (
                <span className="ml-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {cacheStats.totalFiles}
                </span>
              )}
            </button>
            
            {showCacheInfo && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Cache Statistics</h3>
                  {cacheStats ? (
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>Cached repositories:</span>
                        <span className="font-medium">{cacheStats.totalFiles}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total size:</span>
                        <span className="font-medium">{cacheStats.totalSizeMB} MB</span>
                      </div>
                      {cacheStats.newestFile && (
                        <div className="flex justify-between">
                          <span>Last cached:</span>
                          <span className="font-medium">
                            {new Date(cacheStats.newestFile).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-gray-200">
                        <button
                          onClick={() => {
                            clearCache();
                            setShowCacheInfo(false);
                          }}
                          className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                        >
                          Clear Cache
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Loading cache statistics...</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3D Card Demo Link */}
          <Link 
            href="/3d-card"
            className="px-4 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            3D Card Demo
          </Link>
          
          {/* 3D Code Universe Link */}
          <Link 
            href="/3dcode"
            className="px-4 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            3D Code Universe
          </Link>
          
          {/* CodeSandbox2 Link */}
          <Link 
            href="/codesandbox2"
            className="px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l-5.172-5.172a4 4 0 010-5.656L10 4l5.172 5.172a4 4 0 010 5.656L10 20z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4v16" />
            </svg>
            CodeSandbox2
          </Link>
          
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
              viewMode === '2d' ? (
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
                <ThreeDErrorBoundary>
                  <CodeCarousel3D 
                    components={components}
                    onSelectComponent={selectNode}
                  />
                </ThreeDErrorBoundary>
              )
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
