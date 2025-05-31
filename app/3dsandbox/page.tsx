"use client"

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamic import for 3D components to prevent SSR issues
const Sandbox3DScene = dynamic(() => import('../components/3dsandbox/Sandbox3DScene'), {
  ssr: false,
  loading: () => <LoadingScreen />,
})

// Loading screen component
function LoadingScreen() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500 opacity-20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Loading 3D Sandbox</h2>
        <p className="text-blue-200">Preparing interactive environment...</p>
      </div>
    </div>
  )
}

export default function ThreeDSandboxPage() {
  const [showControls, setShowControls] = useState(true)

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <Link 
            href="/"
            className="flex items-center space-x-2 text-white hover:text-blue-300 transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">3D Code Sandbox</h1>
            <p className="text-blue-200 text-sm mt-1">
              Interactive code editing in 3D space
            </p>
          </div>
          
          <div className="w-32">
            {/* Empty div for layout balance */}
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <Sandbox3DScene />

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
            <div className="text-sm space-y-1 text-blue-100">
              <div><strong>Mouse:</strong> Rotate view</div>
              <div><strong>Scroll:</strong> Zoom in/out</div>
              <div><strong>Click card:</strong> Focus on editor</div>
            </div>
          </div>
        </div>
      )}

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
} 