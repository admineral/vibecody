"use client"

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useComponentData } from '../lib/context/ComponentDataContext'
import { ComponentMetadata } from '../lib/types'
import ErrorBoundary from '../components/3dcode/ErrorBoundary'

// Dynamic import for 3D components to prevent SSR issues with error boundary
const CodeUniverse3D = dynamic(() => import('../components/3dcode/CodeUniverse3D'), {
  ssr: false,
  loading: () => <LoadingScreen />,
})

// Loading screen component
function LoadingScreen() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500 opacity-20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-blue-500 opacity-20"></div>
          <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-blue-500 border-b-transparent border-l-transparent animate-spin animation-delay-150"></div>
          <div className="absolute inset-4 rounded-full border-4 border-cyan-500 opacity-20"></div>
          <div className="absolute inset-4 rounded-full border-4 border-t-transparent border-r-transparent border-b-cyan-500 border-l-transparent animate-spin animation-delay-300"></div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Initializing Code Universe</h2>
        <p className="text-purple-200">Preparing immersive experience...</p>
      </div>
    </div>
  )
}

export default function ThreeDCodePage() {
  const { components: contextComponents, ignoredFiles, updateComponents } = useComponentData()
  const [isClient, setIsClient] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [agentsEnabled, setAgentsEnabled] = useState(true)
  const [agentSpeed, setAgentSpeed] = useState(0.3)
  const [viewMode, setViewMode] = useState<'orbital' | 'firstPerson' | 'follow' | 'cinematic'>('orbital')
  const [components, setComponents] = useState<ComponentMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load component data from localStorage or context
  useEffect(() => {
    setIsClient(true)
    
    // First check if we have components from context
    if (contextComponents && contextComponents.length > 0) {
      setComponents(contextComponents)
      setIsLoading(false)
    } else {
      // Try to load from localStorage
      try {
        const savedData = localStorage.getItem('componentData')
        if (savedData) {
          const parsedData = JSON.parse(savedData) as ComponentMetadata[]
          if (parsedData && parsedData.length > 0) {
            updateComponents(parsedData) // Update context
            setComponents(parsedData)
          }
        }
      } catch (error) {
        console.error('Failed to load component data:', error)
      }
      setIsLoading(false)
    }
  }, [contextComponents, updateComponents])

  // Filter out ignored files
  const visibleComponents = components.filter(comp => !ignoredFiles.has(comp.file))

  // Show loading while checking for data
  if (!isClient || isLoading) {
    return <LoadingScreen />
  }

  // If no components, show empty state
  if (visibleComponents.length === 0) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center max-w-md">
          <div className="mb-8">
            <svg className="w-24 h-24 mx-auto text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4">No Code Universe Yet</h2>
          <p className="text-purple-200 mb-8">
            Analyze a repository first to explore your code in 3D space.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go to Repository Analyzer
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
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
              <span>Back to 2D View</span>
            </Link>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white">Code Universe</h1>
              <p className="text-purple-200 text-sm mt-1">
                {visibleComponents.length} files in 3D space
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Mode Selector */}
              <div className="bg-black/20 backdrop-blur-sm rounded-lg p-1 flex">
                <button
                  onClick={() => setViewMode('orbital')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'orbital' ? 'bg-purple-600 text-white' : 'text-purple-200 hover:text-white'
                  }`}
                >
                  Orbital
                </button>
                <button
                  onClick={() => setViewMode('firstPerson')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'firstPerson' ? 'bg-purple-600 text-white' : 'text-purple-200 hover:text-white'
                  }`}
                >
                  First Person
                </button>
                <button
                  onClick={() => setViewMode('follow')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'follow' ? 'bg-purple-600 text-white' : 'text-purple-200 hover:text-white'
                  }`}
                >
                  Follow Agent
                </button>
                <button
                  onClick={() => setViewMode('cinematic')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'cinematic' ? 'bg-purple-600 text-white' : 'text-purple-200 hover:text-white'
                  }`}
                >
                  Cinematic
                </button>
              </div>

              {/* Agent Controls */}
              <div className="flex items-center space-x-4 bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2">
                {/* Agent Toggle */}
                <button
                  onClick={() => setAgentsEnabled(!agentsEnabled)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    agentsEnabled 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-2">{agentsEnabled ? '🤖' : '🚫'}</span>
                  Agent {agentsEnabled ? 'ON' : 'OFF'}
                </button>

                {/* Speed Slider */}
                {agentsEnabled && (
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-200 text-sm">Speed:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="0.6"
                      step="0.1"
                      value={agentSpeed}
                      onChange={(e) => setAgentSpeed(parseFloat(e.target.value))}
                      className="w-24 accent-purple-600"
                    />
                    <span className="text-white text-sm font-mono">{agentSpeed.toFixed(1)}x</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3D Canvas */}
        <CodeUniverse3D
          components={visibleComponents}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
          agentsEnabled={agentsEnabled}
          agentSpeed={agentSpeed}
          viewMode={viewMode}
        />

        {/* Controls Help */}
        <div className="absolute bottom-6 right-6 z-10">
          <div className="bg-black/30 backdrop-blur-md rounded-lg p-4 text-white max-w-xs">
            <h3 className="font-semibold mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Controls
            </h3>
            <div className="text-sm space-y-1 text-purple-100">
              <div><strong>Mouse:</strong> Rotate camera</div>
              <div><strong>Scroll:</strong> Zoom in/out</div>
              <div><strong>Click:</strong> Select file</div>
              <div><strong>Shift+Drag:</strong> Pan camera</div>
              <div><strong>Space:</strong> Reset view</div>
              {viewMode === 'follow' && agentsEnabled && (
                <div className="mt-2 pt-2 border-t border-purple-400/30">
                  <strong>Follow Mode:</strong> Camera follows AI agent
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add custom animations */}
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animation-delay-150 {
            animation-delay: 150ms;
          }
          .animation-delay-300 {
            animation-delay: 300ms;
          }
        `}</style>
      </div>
    </ErrorBoundary>
  )
} 