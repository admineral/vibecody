"use client"

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import Scene3Dv2 from './components/v2/Scene3Dv2';
import ControlPanelV2 from './components/v2/ControlPanelV2';
import { ViewMode } from './hooks/useViewMode';

// Loading component
function LoadingScreen() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-violet-500 opacity-20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Loading 3D Code Cards v2</h2>
        <p className="text-violet-300">Optimized for performance...</p>
      </div>
    </div>
  );
}

export default function ThreeDCardPageV2() {
  const [isClient, setIsClient] = useState(false);
  
  // Core state
  const [cardCount, setCardCount] = useState(50); // Start with more cards
  const [viewMode, setViewMode] = useState<ViewMode>('orbit');
  const [orbitSpeed, setOrbitSpeed] = useState(0.5);
  const [showControls, setShowControls] = useState(true);
  
  // V2 specific state
  const [quality, setQuality] = useState<'low' | 'medium' | 'high' | 'ultra'>('high');
  const [particleDensity, setParticleDensity] = useState(3000);
  const [bloomIntensity, setBloomIntensity] = useState(0.5);
  const [maxRenderDistance, setMaxRenderDistance] = useState(100);
  const [gradientIntensity, setGradientIntensity] = useState(0.8);
  const [gradientColors] = useState(['#0a0015', '#1a0033', '#2d1b69', '#6b46c1', '#9333ea']);
  const [showPerformanceStats, setShowPerformanceStats] = useState(true); // Show by default in v2

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleRegenerateFiles = () => {
    // Handled by Scene3Dv2
  };

  const handleResetView = () => {
    setViewMode('orbit');
    setOrbitSpeed(0.5);
  };

  if (!isClient) {
    return <LoadingScreen />;
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center space-x-2 text-white hover:text-violet-300 transition-colors bg-violet-900/30 backdrop-blur-sm px-4 py-2 rounded-lg border border-violet-400/20"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to DocAI</span>
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">3D Code Cards v2</h1>
            <p className="text-violet-300 text-sm mt-1">
              Optimized Performance • {quality} Quality • {cardCount} Cards
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/3d-card"
              className="flex items-center space-x-2 text-violet-300 hover:text-white transition-colors bg-violet-900/30 backdrop-blur-sm px-4 py-2 rounded-lg border border-violet-400/20"
            >
              <span>View v1</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 8, 15], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
      >
        <Suspense fallback={null}>
          {/* Main Scene */}
          <Scene3Dv2
            cardCount={cardCount}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            orbitSpeed={orbitSpeed}
            onOrbitSpeedChange={setOrbitSpeed}
            onResetView={handleResetView}
            quality={quality}
            particleDensity={particleDensity}
            bloomIntensity={bloomIntensity}
            maxRenderDistance={maxRenderDistance}
            gradientColors={gradientColors}
            gradientIntensity={gradientIntensity}
          />
          
          {/* Performance Stats */}
          {showPerformanceStats && <Stats className="stats-panel" />}
        </Suspense>
      </Canvas>

      {/* Control Panel V2 */}
      <ControlPanelV2
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
        quality={quality}
        onQualityChange={setQuality}
        particleDensity={particleDensity}
        onParticleDensityChange={setParticleDensity}
        bloomIntensity={bloomIntensity}
        onBloomIntensityChange={setBloomIntensity}
        maxRenderDistance={maxRenderDistance}
        onMaxRenderDistanceChange={setMaxRenderDistance}
        gradientIntensity={gradientIntensity}
        onGradientIntensityChange={setGradientIntensity}
        showPerformanceStats={showPerformanceStats}
        onTogglePerformanceStats={() => setShowPerformanceStats(!showPerformanceStats)}
      />

      {/* Performance Badge */}
      <div className="absolute bottom-6 left-6 z-10">
        <div className="bg-violet-900/30 backdrop-blur-md rounded-lg px-4 py-2 text-white text-sm border border-violet-400/20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="font-semibold">v2 Optimized</span>
            </div>
            <div className="text-violet-300">|</div>
            <div>Instanced Rendering</div>
            <div className="text-violet-300">|</div>
            <div>GPU Particles</div>
          </div>
        </div>
      </div>

      {/* Custom CSS for performance stats */}
      <style jsx global>{`
        .stats-panel {
          position: fixed !important;
          top: 100px !important;
          left: 20px !important;
          z-index: 20 !important;
          background: rgba(88, 28, 135, 0.3) !important;
          border: 1px solid rgba(167, 139, 250, 0.2) !important;
          backdrop-filter: blur(12px) !important;
          padding: 10px !important;
          border-radius: 8px !important;
          color: white !important;
          font-size: 12px !important;
        }
        
        .stats-panel > div {
          color: #e9d5ff !important;
        }
      `}</style>
    </div>
  );
} 