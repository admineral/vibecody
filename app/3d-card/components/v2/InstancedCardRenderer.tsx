"use client"

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CodeFile } from '../../utils/codeTemplates';
import { useTextureAtlas } from '../../hooks/v2/useTextureAtlas';
import { useLODSystem } from '../../hooks/v2/useLODSystem';
import { cardVertexShader, cardFragmentShader } from '../../shaders/card.shader';

interface InstancedCardRendererProps {
  files: CodeFile[];
  positions: Array<[number, number, number]>;
  selectedIndex: number | null;
  hoveredIndex: number | null;
  onCardClick: (index: number) => void;
  onCardHover: (index: number | null) => void;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  maxRenderDistance: number;
}

const CARD_GEOMETRY_ARGS: [number, number, number] = [2, 3, 0.1];
const _ROUNDED_RADIUS = 0.12;

export default function InstancedCardRenderer({
  files,
  positions,
  selectedIndex,
  hoveredIndex,
  onCardClick,
  onCardHover,
  quality,
  maxRenderDistance = 100
}: InstancedCardRendererProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera, raycaster, pointer } = useThree();
  
  // Texture atlas for card content
  const { atlas, getUVOffset, updateCard: _updateCard } = useTextureAtlas(files, quality);
  
  // LOD system
  const { getLODLevel: _getLODLevel, updateLODs } = useLODSystem(positions, camera.position, quality);
  
  // Instance matrices and attributes
  const instanceData = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const textureOffsets: THREE.Vector2[] = [];
    const lodLevels: number[] = [];
    
    positions.forEach((pos, i) => {
      const matrix = new THREE.Matrix4();
      const rotation = (i / positions.length) * Math.PI * 2;
      
      matrix.compose(
        new THREE.Vector3(...pos),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotation, 0)),
        new THREE.Vector3(1, 1, 1)
      );
      
      matrices.push(matrix);
      colors.push(new THREE.Color(getFileTypeColor(files[i]?.type || 'javascript')));
      textureOffsets.push(getUVOffset(i));
      lodLevels.push(0);
    });
    
    return { matrices, colors, textureOffsets, lodLevels };
  }, [positions, files, getUVOffset]);
  
  // Update instance attributes
  useEffect(() => {
    if (!meshRef.current) return;
    
    instanceData.matrices.forEach((matrix, i) => {
      meshRef.current!.setMatrixAt(i, matrix);
    });
    
    // Custom attributes for shaders
    const geometry = meshRef.current.geometry;
    
    // Texture offsets
    const offsetArray = new Float32Array(instanceData.textureOffsets.length * 2);
    instanceData.textureOffsets.forEach((offset, i) => {
      offsetArray[i * 2] = offset.x;
      offsetArray[i * 2 + 1] = offset.y;
    });
    geometry.setAttribute('aTextureOffset', new THREE.InstancedBufferAttribute(offsetArray, 2));
    
    // LOD levels
    const lodArray = new Float32Array(instanceData.lodLevels);
    geometry.setAttribute('aLOD', new THREE.InstancedBufferAttribute(lodArray, 1));
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [instanceData]);
  
  // Animation and interaction frame
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Update LODs based on camera distance
    const lodUpdates = updateLODs();
    if (lodUpdates.length > 0) {
      const lodArray = new Float32Array(positions.length);
      lodUpdates.forEach(({ index, level }) => {
        lodArray[index] = level;
      });
      meshRef.current.geometry.setAttribute('aLOD', new THREE.InstancedBufferAttribute(lodArray, 1));
    }
    
    // Raycast for hover detection (throttled)
    if (state.clock.elapsedTime % 0.1 < delta) {
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObject(meshRef.current);
      
      if (intersects.length > 0) {
        const instanceId = intersects[0].instanceId;
        if (instanceId !== undefined) {
          onCardHover(instanceId);
        }
      } else {
        onCardHover(null);
      }
    }
    
    // Animate hovered/selected cards
    if (hoveredIndex !== null || selectedIndex !== null) {
      const targetIndex = hoveredIndex ?? selectedIndex;
      if (targetIndex !== null && targetIndex < positions.length) {
        const matrix = new THREE.Matrix4();
        meshRef.current.getMatrixAt(targetIndex, matrix);
        
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        matrix.decompose(position, quaternion, scale);
        
        // Smooth scale animation
        const targetScale = hoveredIndex === targetIndex ? 1.1 : selectedIndex === targetIndex ? 1.05 : 1;
        scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);
        
        matrix.compose(position, quaternion, scale);
        meshRef.current.setMatrixAt(targetIndex, matrix);
        meshRef.current.instanceMatrix.needsUpdate = true;
      }
    }
  });
  
  // Handle click events
  const handlePointerDown = (event: any) => {
    if (event.instanceId !== undefined) {
      onCardClick(event.instanceId);
    }
  };
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, files.length]}
      onPointerDown={handlePointerDown}
      frustumCulled={false}
    >
      <boxGeometry args={CARD_GEOMETRY_ARGS} />
      <shaderMaterial
        vertexShader={cardVertexShader}
        fragmentShader={cardFragmentShader}
        uniforms={{
          uTextureAtlas: { value: atlas },
          uAtlasSize: { value: new THREE.Vector2(4096, 4096) },
          uTime: { value: 0 },
          uMaxDistance: { value: maxRenderDistance }
        }}
        transparent
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

// Helper function for file type colors
function getFileTypeColor(type: string): string {
  const colors: Record<string, string> = {
    javascript: '#f7df1e',
    typescript: '#3178c6',
    css: '#1572b6',
    html: '#e34f26',
    json: '#292929',
    markdown: '#083fa1'
  };
  return colors[type] || '#666666';
} 