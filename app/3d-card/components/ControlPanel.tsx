"use client"

import { useState } from 'react';
import { ViewMode } from '../hooks/useViewMode';

interface ControlPanelProps {
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
}

export default function ControlPanel({
  cardCount,
  onCardCountChange,
  viewMode,
  onViewModeChange,
  orbitSpeed,
  onOrbitSpeedChange,
  onRegenerateFiles,
  onResetView,
  isVisible,
  onToggleVisibility
}: ControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className="fixed top-20 right-6 z-20 bg-black/30 backdrop-blur-md text-white p-3 rounded-lg hover:bg-black/40 transition-colors"
        title="Show Controls"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed top-20 right-6 z-20 bg-black/20 backdrop-blur-md rounded-lg p-4 text-white min-w-[280px] max-w-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Controls</h3>
        <div className="flex gap-2">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => onViewModeChange(viewMode === 'orbit' ? 'free' : 'orbit')}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'orbit' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
          }`}
        >
          {viewMode === 'orbit' ? 'Orbit Mode' : 'Free Mode'}
        </button>
        <button
          onClick={onResetView}
          className="px-3 py-2 bg-gray-600 text-gray-200 rounded-md text-sm font-medium hover:bg-gray-500 transition-colors"
        >
          Reset View
        </button>
      </div>

      {/* Expandable Controls */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Card Count */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Cards: {cardCount}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={cardCount}
              onChange={(e) => onCardCountChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          {/* Orbit Speed (only show in orbit mode) */}
          {viewMode === 'orbit' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Orbit Speed: {orbitSpeed.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={orbitSpeed}
                onChange={(e) => onOrbitSpeedChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0x</span>
                <span>1.5x</span>
                <span>3x</span>
              </div>
            </div>
          )}

          {/* File Actions */}
          <div>
            <label className="block text-sm font-medium mb-2">File Actions</label>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={onRegenerateFiles}
                className="px-3 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                🔄 Regenerate Files
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <label className="block text-sm font-medium mb-2">Keyboard Shortcuts</label>
            <div className="text-xs text-gray-300 space-y-1">
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
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e293b;
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e293b;
        }

        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
          background: #374151;
        }

        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: #374151;
        }
      `}</style>
    </div>
  );
} 