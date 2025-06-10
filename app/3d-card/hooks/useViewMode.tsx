import { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';

export type ViewMode = 'orbit' | 'free';

export interface ViewModeState {
  mode: ViewMode;
  orbitSpeed: number;
  orbitRadius: number;
  orbitAngle: number;
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  isTransitioning: boolean;
}

export interface ViewModeControls {
  mode: ViewMode;
  toggleMode: () => void;
  setMode: (mode: ViewMode) => void;
  orbitSpeed: number;
  setOrbitSpeed: (speed: number) => void;
  orbitRadius: number;
  setOrbitRadius: (radius: number) => void;
  orbitAngle: number;
  setOrbitAngle: (angle: number) => void;
  rotateOrbit: (delta: number) => void;
  resetView: () => void;
  isTransitioning: boolean;
}

const DEFAULT_STATE: ViewModeState = {
  mode: 'orbit',
  orbitSpeed: 0.5,
  orbitRadius: 15,
  orbitAngle: 0,
  cameraPosition: new THREE.Vector3(0, 8, 15),
  cameraTarget: new THREE.Vector3(0, 0, 0),
  isTransitioning: false
};

export function useViewMode(): ViewModeControls {
  const [state, setState] = useState<ViewModeState>(DEFAULT_STATE);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setTransitioning = useCallback((transitioning: boolean) => {
    setState(prev => ({ ...prev, isTransitioning: transitioning }));
    
    if (transitioning) {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      transitionTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, isTransitioning: false }));
      }, 1000); // Transition duration
    }
  }, []);

  const toggleMode = useCallback(() => {
    setState(prev => {
      const newMode = prev.mode === 'orbit' ? 'free' : 'orbit';
      setTransitioning(true);
      return { ...prev, mode: newMode };
    });
  }, [setTransitioning]);

  const setMode = useCallback((mode: ViewMode) => {
    setState(prev => {
      if (prev.mode !== mode) {
        setTransitioning(true);
        return { ...prev, mode };
      }
      return prev;
    });
  }, [setTransitioning]);

  const setOrbitSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, orbitSpeed: Math.max(0, Math.min(5, speed)) }));
  }, []);

  const setOrbitRadius = useCallback((radius: number) => {
    setState(prev => ({ ...prev, orbitRadius: Math.max(5, Math.min(50, radius)) }));
  }, []);

  const setOrbitAngle = useCallback((angle: number) => {
    setState(prev => ({ ...prev, orbitAngle: angle % (Math.PI * 2) }));
  }, []);

  const rotateOrbit = useCallback((delta: number) => {
    setState(prev => ({ 
      ...prev, 
      orbitAngle: (prev.orbitAngle + delta) % (Math.PI * 2) 
    }));
  }, []);

  const resetView = useCallback(() => {
    setTransitioning(true);
    setState(DEFAULT_STATE);
  }, [setTransitioning]);

  return {
    mode: state.mode,
    toggleMode,
    setMode,
    orbitSpeed: state.orbitSpeed,
    setOrbitSpeed,
    orbitRadius: state.orbitRadius,
    setOrbitRadius,
    orbitAngle: state.orbitAngle,
    setOrbitAngle,
    rotateOrbit,
    resetView,
    isTransitioning: state.isTransitioning
  };
} 