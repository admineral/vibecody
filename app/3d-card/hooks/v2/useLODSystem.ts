import { useMemo, useRef, useCallback } from 'react';
import * as THREE from 'three';

interface LODLevel {
  distance: number;
  renderMode: 'full' | 'simplified' | 'billboard' | 'point';
  value: number;
}

const LOD_LEVELS: LODLevel[] = [
  { distance: 10, renderMode: 'full', value: 0 },
  { distance: 25, renderMode: 'simplified', value: 1 },
  { distance: 50, renderMode: 'billboard', value: 2 },
  { distance: 100, renderMode: 'point', value: 3 }
];

export function useLODSystem(
  positions: Array<[number, number, number]>,
  cameraPosition: THREE.Vector3,
  quality: 'low' | 'medium' | 'high' | 'ultra'
) {
  const previousLODs = useRef<number[]>([]);
  
  // Adjust LOD distances based on quality
  const adjustedLODLevels = useMemo(() => {
    const qualityMultipliers = {
      low: 0.5,
      medium: 0.75,
      high: 1.0,
      ultra: 1.5
    };
    
    const multiplier = qualityMultipliers[quality];
    
    return LOD_LEVELS.map(level => ({
      ...level,
      distance: level.distance * multiplier
    }));
  }, [quality]);
  
  // Get LOD level for a specific position
  const getLODLevel = useCallback((position: [number, number, number]): number => {
    const pos = new THREE.Vector3(...position);
    const distance = pos.distanceTo(cameraPosition);
    
    for (let i = adjustedLODLevels.length - 1; i >= 0; i--) {
      if (distance <= adjustedLODLevels[i].distance) {
        return adjustedLODLevels[i].value;
      }
    }
    
    return adjustedLODLevels[adjustedLODLevels.length - 1].value;
  }, [cameraPosition, adjustedLODLevels]);
  
  // Update LODs for all positions
  const updateLODs = useCallback(() => {
    const updates: Array<{ index: number; level: number }> = [];
    
    positions.forEach((position, index) => {
      const newLevel = getLODLevel(position);
      const previousLevel = previousLODs.current[index] ?? -1;
      
      if (newLevel !== previousLevel) {
        updates.push({ index, level: newLevel });
        previousLODs.current[index] = newLevel;
      }
    });
    
    return updates;
  }, [positions, getLODLevel]);
  
  // Get render info for LOD level
  const getRenderInfo = useCallback((lodLevel: number) => {
    const level = adjustedLODLevels.find(l => l.value === lodLevel) || adjustedLODLevels[0];
    
    return {
      renderMode: level.renderMode,
      shouldRenderText: level.renderMode === 'full',
      shouldRenderDetails: level.renderMode === 'full' || level.renderMode === 'simplified',
      geometryScale: level.renderMode === 'point' ? 0.1 : 1.0,
      opacity: level.renderMode === 'point' ? 0.5 : 1.0
    };
  }, [adjustedLODLevels]);
  
  return {
    getLODLevel,
    updateLODs,
    getRenderInfo
  };
} 