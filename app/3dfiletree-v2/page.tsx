"use client"

import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamic import to prevent SSR issues with Three.js
const FileTreeV2Scene = dynamic(() => import('../components/3dfiletree-v2/FileTreeV2Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gradient-to-b from-sky-400 via-sky-300 to-sky-100 flex items-center justify-center">
      <div className="text-slate-800 text-center">
        <div className="text-4xl mb-4">☁️</div>
        <p className="text-xl font-medium">Loading Aerial View...</p>
      </div>
    </div>
  ),
})

export default function FileTreeV2Page() {
  return (
    <div className="w-full h-screen bg-gradient-to-b from-sky-400 via-sky-300 to-sky-100 relative overflow-hidden">
      {/* 3D Scene - moved before overlays to ensure it's not blocked */}
      <div className="absolute inset-0">
        <FileTreeV2Scene />
      </div>

      {/* Header - with pointer-events-none on container, pointer-events-auto on interactive elements */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 pointer-events-none">
        <div className="flex items-center justify-between">
          <Link 
            href="/"
            className="text-slate-800 hover:text-blue-600 transition-colors flex items-center gap-2 pointer-events-auto bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
          
          <h1 className="text-2xl font-bold text-slate-800 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
            3D File Tree <span className="text-blue-600">V2</span>
          </h1>
          
          <div className="w-20"></div>
        </div>
      </div>

      {/* Controls Info - with pointer-events-none */}
      <div className="absolute bottom-6 left-6 text-slate-700 text-sm pointer-events-none bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
        <p>🖱️ Drag to rotate • Scroll to zoom • Click nodes to select</p>
      </div>
    </div>
  )
} 