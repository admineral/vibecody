import { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { CodeFile } from '../../utils/codeTemplates';

/**
 * Temporary stub for the texture-atlas hook used by the v2 renderer.
 * It returns a blank 4K texture and no-op helpers so the application can
 * compile in production while the real GPU atlas pipeline is under
 * active development.
 */
export function useTextureAtlas(
  _files: CodeFile[],
  _quality: 'low' | 'medium' | 'high' | 'ultra'
) {
  // A single transparent pixel scaled up – avoids WebGL warnings.
  const atlas = useMemo(() => {
    const data = new Uint8Array([0, 0, 0, 0]);
    const texture = new THREE.DataTexture(data, 1, 1);
    texture.needsUpdate = true;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }, []);

  // Always return the origin – real implementation will offset per card
  const getUVOffset = useCallback((_index: number) => new THREE.Vector2(0, 0), []);

  // Placeholder – will eventually re-render the canvas onto the atlas
  const updateCard = useCallback((_index: number, _file?: CodeFile) => {
    /* no-op */
  }, []);

  return { atlas, getUVOffset, updateCard } as const;
} 