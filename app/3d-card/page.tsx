"use client"

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import Scene3D from './components/Scene3D';
import ControlPanel from './components/ControlPanel';
import { ViewMode } from './hooks/useViewMode';

// Loading component
function LoadingScreen() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500 opacity-20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Loading 3D Code Cards</h2>
        <p className="text-purple-200">Preparing interactive environment...</p>
      </div>
    </div>
  );
}

// 3D Canvas Component
function ThreeDCanvas({ 
  cardCount, 
  onCardCountChange, 
  viewMode, 
  onViewModeChange, 
  orbitSpeed, 
  onOrbitSpeedChange, 
  onRegenerateFiles, 
  onResetView 
}: {
  cardCount: number;
  onCardCountChange: (count: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  orbitSpeed: number;
  onOrbitSpeedChange: (speed: number) => void;
  onRegenerateFiles: () => void;
  onResetView: () => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 8, 15], fov: 60 }}
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 2]}
      gl={{ 
        antialias: true, 
        alpha: false,
        powerPreference: "high-performance"
      }}
    >
      <Suspense fallback={null}>
        {/* Main Scene */}
        <Scene3D
          cardCount={cardCount}
          onCardCountChange={onCardCountChange}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          orbitSpeed={orbitSpeed}
          onOrbitSpeedChange={onOrbitSpeedChange}
          onRegenerateFiles={onRegenerateFiles}
          onResetView={onResetView}
        />
      </Suspense>
    </Canvas>
  );
}

export default function ThreeDCardPage() {
  const [isClient, setIsClient] = useState(false);
  const [cardCount, setCardCount] = useState(12);
  const [viewMode, setViewMode] = useState<ViewMode>('orbit');
  const [orbitSpeed, setOrbitSpeed] = useState(0.5);
  const [showControls, setShowControls] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
    
    // Hide instructions after 5 seconds
    const timer = setTimeout(() => {
      setShowInstructions(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleRegenerateFiles = () => {
    // This will be handled by the Scene3D component
  };

  const handleResetView = () => {
    setViewMode('orbit');
    setOrbitSpeed(0.5);
  };

  if (!isClient) {
    return <LoadingScreen />;
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to DocAI</span>
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">3D Code Cards</h1>
            <p className="text-purple-200 text-sm mt-1">
              Interactive code visualization • {viewMode === 'orbit' ? 'Orbit Mode' : 'Free Mode'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-right text-white text-sm">
              <div>{cardCount} Cards</div>
              <div className="text-purple-200">{orbitSpeed.toFixed(1)}x Speed</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <ThreeDCanvas
        cardCount={cardCount}
        onCardCountChange={setCardCount}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        orbitSpeed={orbitSpeed}
        onOrbitSpeedChange={setOrbitSpeed}
        onRegenerateFiles={handleRegenerateFiles}
        onResetView={handleResetView}
      />

      {/* Control Panel */}
      <ControlPanel
        cardCount={cardCount}
        onCardCountChange={setCardCount}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        orbitSpeed={orbitSpeed}
        onOrbitSpeedChange={setOrbitSpeed}
        onRegenerateFiles={handleRegenerateFiles}
        onResetView={handleResetView}
        isVisible={showControls}
        onToggleVisibility={() => setShowControls(!showControls)}
      />

      {/* Instructions Overlay */}
      {showInstructions && (
        <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-black/80 backdrop-blur-md rounded-xl p-8 max-w-md mx-4 text-white">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Welcome to 3D Code Cards</h2>
              <p className="text-gray-300">Interactive code visualization in 3D space</p>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-purple-300 mb-2">Navigation</h3>
                  <div className="space-y-1 text-gray-300">
                    <div>← → Arrow keys: Rotate</div>
                    <div>↑ ↓ Arrow keys: Speed</div>
                    <div>Space: Toggle mode</div>
                    <div>ESC: Reset view</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-purple-300 mb-2">Interaction</h3>
                  <div className="space-y-1 text-gray-300">
                    <div>1-9: Select card</div>
                    <div>Mouse: Hover cards</div>
                    <div>Click: Select card</div>
                    <div>Controls: Top right</div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-600 pt-4">
                <h3 className="font-semibold text-purple-300 mb-2">View Modes</h3>
                <div className="space-y-1 text-gray-300">
                  <div><strong>Orbit Mode:</strong> Automatic camera orbit around cards</div>
                  <div><strong>Free Mode:</strong> Manual camera control with mouse</div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowInstructions(false)}
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Start Exploring
            </button>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="absolute bottom-6 left-6 z-10">
        <div className="bg-black/20 backdrop-blur-md rounded-lg px-4 py-2 text-white text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${viewMode === 'orbit' ? 'bg-green-400' : 'bg-blue-400'}`}></div>
              <span>{viewMode === 'orbit' ? 'Orbit Mode' : 'Free Mode'}</span>
            </div>
            <div className="text-gray-300">|</div>
            <div>{cardCount} Cards</div>
            {viewMode === 'orbit' && (
              <>
                <div className="text-gray-300">|</div>
                <div>{orbitSpeed.toFixed(1)}x Speed</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Performance indicator */}
      <div className="absolute bottom-6 right-6 z-10">
        <div className="bg-black/20 backdrop-blur-md rounded-lg px-3 py-2 text-white text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span>60 FPS</span>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 