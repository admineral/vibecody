"use client"

import { useState } from 'react';
import { ViewMode } from '../../hooks/useViewMode';

interface ControlPanelV2Props {
  cardCount: number;
  onCardCountChange: (count: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  orbitSpeed: number;
  onOrbitSpeedChange: (speed: number) => void;
  onRegenerateFiles: () => void;
  onResetView: () => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
  
  // V2 specific props
  quality: 'low' | 'medium' | 'high' | 'ultra';
  onQualityChange: (quality: 'low' | 'medium' | 'high' | 'ultra') => void;
  particleDensity: number;
  onParticleDensityChange: (density: number) => void;
  bloomIntensity: number;
  onBloomIntensityChange: (intensity: number) => void;
  maxRenderDistance: number;
  onMaxRenderDistanceChange: (distance: number) => void;
  gradientIntensity: number;
  onGradientIntensityChange: (intensity: number) => void;
  showPerformanceStats: boolean;
  onTogglePerformanceStats: () => void;
}

export default function ControlPanelV2({
  cardCount,
  onCardCountChange,
  viewMode,
  onViewModeChange,
  orbitSpeed,
  onOrbitSpeedChange,
  onRegenerateFiles,
  onResetView,
  isVisible,
  onToggleVisibility,
  quality,
  onQualityChange,
  particleDensity,
  onParticleDensityChange,
  bloomIntensity,
  onBloomIntensityChange,
  maxRenderDistance,
  onMaxRenderDistanceChange,
  gradientIntensity,
  onGradientIntensityChange,
  showPerformanceStats,
  onTogglePerformanceStats
}: ControlPanelV2Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'controls' | 'performance' | 'visual'>('controls');

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className="fixed top-20 right-6 z-20 bg-violet-900/30 backdrop-blur-md text-white p-3 rounded-lg hover:bg-violet-900/40 transition-colors border border-violet-400/20"
        title="Show Controls"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed top-20 right-6 z-20 bg-violet-900/20 backdrop-blur-md rounded-lg p-4 text-white min-w-[320px] max-w-[380px] border border-violet-400/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-violet-100">Controls v2</h3>
        <div className="flex gap-2">
          <button
            onClick={onTogglePerformanceStats}
            className={`text-sm px-2 py-1 rounded transition-colors ${
              showPerformanceStats 
                ? 'bg-green-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            title="Toggle Performance Stats"
          >
            📊
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <svg 
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={onToggleVisibility}
            className="text-gray-400 hover:text-white transition-colors"
            title="Hide Controls"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quality Preset */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-violet-200">Quality Preset</label>
        <div className="grid grid-cols-4 gap-1">
          {(['low', 'medium', 'high', 'ultra'] as const).map((q) => (
            <button
              key={q}
              onClick={() => onQualityChange(q)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                quality === q 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-violet-900/30 text-violet-300 hover:bg-violet-800/30'
              }`}
            >
              {q.charAt(0).toUpperCase() + q.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => onViewModeChange(viewMode === 'orbit' ? 'free' : 'orbit')}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'orbit' 
              ? 'bg-violet-600 text-white' 
              : 'bg-violet-900/30 text-violet-200 hover:bg-violet-800/30'
          }`}
        >
          {viewMode === 'orbit' ? 'Orbit Mode' : 'Free Mode'}
        </button>
        <button
          onClick={onResetView}
          className="px-3 py-2 bg-violet-900/30 text-violet-200 rounded-md text-sm font-medium hover:bg-violet-800/30 transition-colors"
        >
          Reset View
        </button>
      </div>

      {/* Expandable Controls */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex bg-violet-900/30 rounded-lg p-1">
            {[
              { id: 'controls' as const, label: 'Controls', icon: '🎮' },
              { id: 'performance' as const, label: 'Performance', icon: '⚡' },
              { id: 'visual' as const, label: 'Visual', icon: '🎨' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-violet-600 text-white'
                    : 'text-violet-300 hover:bg-violet-800/30'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Controls Tab */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              {/* Card Count */}
              <div>
                <label className="block text-sm font-medium mb-2 text-violet-200">
                  Cards: {cardCount}
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={cardCount}
                  onChange={(e) => onCardCountChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-violet-900/30 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-violet-400 mt-1">
                  <span>0</span>
                  <span>100</span>
                  <span>200</span>
                </div>
              </div>

              {/* Orbit Speed */}
              {viewMode === 'orbit' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-violet-200">
                    Orbit Speed: {orbitSpeed.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={orbitSpeed}
                    onChange={(e) => onOrbitSpeedChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-violet-900/30 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-violet-400 mt-1">
                    <span>0x</span>
                    <span>1.5x</span>
                    <span>3x</span>
                  </div>
                </div>
              )}

              {/* File Actions */}
              <div>
                <button
                  onClick={onRegenerateFiles}
                  className="w-full px-3 py-2 bg-violet-600 text-white rounded-md text-sm font-medium hover:bg-violet-700 transition-colors"
                >
                  🔄 Regenerate Files
                </button>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              {/* Max Render Distance */}
              <div>
                <label className="block text-sm font-medium mb-2 text-violet-200">
                  Render Distance: {maxRenderDistance}m
                </label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={maxRenderDistance}
                  onChange={(e) => onMaxRenderDistanceChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-violet-900/30 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-violet-400 mt-1">
                  <span>50m</span>
                  <span>175m</span>
                  <span>300m</span>
                </div>
              </div>

              {/* Particle Density */}
              <div>
                <label className="block text-sm font-medium mb-2 text-violet-200">
                  Particles: {particleDensity}
                </label>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="500"
                  value={particleDensity}
                  onChange={(e) => onParticleDensityChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-violet-900/30 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-violet-400 mt-1">
                  <span>500</span>
                  <span>5K</span>
                  <span>10K</span>
                </div>
              </div>
            </div>
          )}

          {/* Visual Tab */}
          {activeTab === 'visual' && (
            <div className="space-y-4">
              {/* Bloom Intensity */}
              <div>
                <label className="block text-sm font-medium mb-2 text-violet-200">
                  Bloom: {(bloomIntensity * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={bloomIntensity}
                  onChange={(e) => onBloomIntensityChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-violet-900/30 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-violet-400 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                  <span>200%</span>
                </div>
              </div>

              {/* Gradient Intensity */}
              <div>
                <label className="block text-sm font-medium mb-2 text-violet-200">
                  Background: {(gradientIntensity * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={gradientIntensity}
                  onChange={(e) => onGradientIntensityChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-violet-900/30 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-violet-400 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts */}
          <div>
            <label className="block text-sm font-medium mb-2 text-violet-200">Keyboard Shortcuts</label>
            <div className="text-xs text-violet-300 space-y-1">
              <div className="flex justify-between">
                <span>Arrow Keys:</span>
                <span>Navigate/Rotate</span>
              </div>
              <div className="flex justify-between">
                <span>Space:</span>
                <span>Toggle View Mode</span>
              </div>
              <div className="flex justify-between">
                <span>1-9:</span>
                <span>Select Card</span>
              </div>
              <div className="flex justify-between">
                <span>ESC:</span>
                <span>Reset View</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for sliders */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #2d1b69;
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #2d1b69;
        }

        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
          background: rgba(88, 28, 135, 0.3);
        }

        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: rgba(88, 28, 135, 0.3);
        }
      `}</style>
    </div>
  );
} 