"use client";

import React from 'react';
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
  quality: 'low' | 'medium' | 'high' | 'ultra';
  onQualityChange: (q: 'low' | 'medium' | 'high' | 'ultra') => void;
  particleDensity: number;
  onParticleDensityChange: (n: number) => void;
  bloomIntensity: number;
  onBloomIntensityChange: (n: number) => void;
  maxRenderDistance: number;
  onMaxRenderDistanceChange: (n: number) => void;
  gradientIntensity: number;
  onGradientIntensityChange: (n: number) => void;
  showPerformanceStats: boolean;
  onTogglePerformanceStats: () => void;
}

/**
 * Lightweight stub of the next-generation control panel.
 * It simply hides itself until the full feature set is implemented,
 * preventing "module not found" errors during CI builds.
 */
export default function ControlPanelV2({ isVisible, onToggleVisibility }: ControlPanelV2Props) {
  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className="fixed top-20 right-6 z-20 bg-black/30 backdrop-blur-md text-white p-3 rounded-lg hover:bg-black/40 transition-colors"
      >
        ⚙️
      </button>
    );
  }

  return (
    <div className="fixed top-20 right-6 z-20 bg-black/30 backdrop-blur-md text-white p-4 rounded-lg">
      <p className="text-sm">
        Control panel coming soon…
      </p>
      <button
        onClick={onToggleVisibility}
        className="mt-4 px-3 py-2 bg-purple-600 rounded-md text-sm hover:bg-purple-700"
      >
        Hide
      </button>
    </div>
  );
} 