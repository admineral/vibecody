import { useMemo, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { CodeFile } from '../../utils/codeTemplates';

const ATLAS_CONFIGS: Record<string, { atlasSize: number; cardSize: number; padding: number }> = {
  low: { atlasSize: 1024, cardSize: 64, padding: 2 },
  medium: { atlasSize: 2048, cardSize: 128, padding: 4 },
  high: { atlasSize: 4096, cardSize: 256, padding: 8 },
  ultra: { atlasSize: 8192, cardSize: 512, padding: 16 }
};

export function useTextureAtlas(
  files: CodeFile[],
  quality: 'low' | 'medium' | 'high' | 'ultra'
) {
  const config = ATLAS_CONFIGS[quality];
  const atlasRef = useRef<THREE.Texture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // Calculate grid dimensions
  const gridDimensions = useMemo(() => {
    const cardsPerRow = Math.floor(config.atlasSize / (config.cardSize + config.padding));
    const totalRows = Math.ceil(files.length / cardsPerRow);
    return { cardsPerRow, totalRows };
  }, [files.length, config]);
  
  // Create texture atlas
  const atlas = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    // Create or reuse canvas
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = config.atlasSize;
      canvasRef.current.height = config.atlasSize;
      ctxRef.current = canvasRef.current.getContext('2d');
    }
    
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    
    if (!ctx) return null;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, config.atlasSize, config.atlasSize);
    
    // Render each file card
    files.forEach((file, index) => {
      const col = index % gridDimensions.cardsPerRow;
      const row = Math.floor(index / gridDimensions.cardsPerRow);
      
      const x = col * (config.cardSize + config.padding) + config.padding;
      const y = row * (config.cardSize + config.padding) + config.padding;
      
      renderFileCard(ctx, file, x, y, config.cardSize);
    });
    
    // Create or update texture
    if (!atlasRef.current) {
      atlasRef.current = new THREE.CanvasTexture(canvas);
      atlasRef.current.generateMipmaps = false;
      atlasRef.current.minFilter = THREE.LinearFilter;
      atlasRef.current.magFilter = THREE.LinearFilter;
      atlasRef.current.wrapS = THREE.ClampToEdgeWrapping;
      atlasRef.current.wrapT = THREE.ClampToEdgeWrapping;
    } else {
      atlasRef.current.needsUpdate = true;
    }
    
    return atlasRef.current;
  }, [files, config, gridDimensions]);
  
  // Get UV offset for a specific card
  const getUVOffset = useCallback((index: number): THREE.Vector2 => {
    const col = index % gridDimensions.cardsPerRow;
    const row = Math.floor(index / gridDimensions.cardsPerRow);
    
    const u = col / gridDimensions.cardsPerRow;
    const v = row / Math.max(gridDimensions.totalRows, 1);
    
    return new THREE.Vector2(u, v);
  }, [gridDimensions]);
  
  // Update specific card in atlas
  const updateCard = useCallback((index: number, file: CodeFile) => {
    if (!canvasRef.current || !ctxRef.current) return;
    
    const col = index % gridDimensions.cardsPerRow;
    const row = Math.floor(index / gridDimensions.cardsPerRow);
    
    const x = col * (config.cardSize + config.padding) + config.padding;
    const y = row * (config.cardSize + config.padding) + config.padding;
    
    const ctx = ctxRef.current;
    
    // Clear the card area
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, config.cardSize, config.cardSize);
    
    // Render the updated card
    renderFileCard(ctx, file, x, y, config.cardSize);
    
    // Update texture
    if (atlasRef.current) {
      atlasRef.current.needsUpdate = true;
    }
  }, [config, gridDimensions]);
  
  return {
    atlas,
    getUVOffset,
    updateCard
  };
}

// Helper function to render a file card on canvas
function renderFileCard(
  ctx: CanvasRenderingContext2D,
  file: CodeFile,
  x: number,
  y: number,
  size: number
) {
  const padding = size * 0.1;
  const innerSize = size - padding * 2;
  
  // Background
  ctx.fillStyle = getFileTypeColor(file.type);
  ctx.fillRect(x + padding, y + padding, innerSize, innerSize);
  
  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + padding, y + padding, innerSize, innerSize);
  
  // File icon area
  const iconSize = innerSize * 0.3;
  const iconX = x + padding + (innerSize - iconSize) / 2;
  const iconY = y + padding + innerSize * 0.15;
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(iconX, iconY, iconSize, iconSize);
  
  // File name
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.max(8, size * 0.08)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const textY = y + padding + innerSize * 0.7;
  const maxWidth = innerSize * 0.9;
  
  // Truncate filename if too long
  let displayName = file.name;
  if (ctx.measureText(displayName).width > maxWidth) {
    while (ctx.measureText(displayName + '...').width > maxWidth && displayName.length > 3) {
      displayName = displayName.slice(0, -1);
    }
    displayName += '...';
  }
  
  ctx.fillText(displayName, x + size / 2, textY);
  
  // File type indicator
  ctx.fillStyle = '#cccccc';
  ctx.font = `${Math.max(6, size * 0.06)}px monospace`;
  ctx.fillText(file.type.toUpperCase(), x + size / 2, y + padding + innerSize * 0.85);
}

// Helper function for file type colors
function getFileTypeColor(type: string): string {
  const colors: Record<string, string> = {
    javascript: '#f7df1e',
    typescript: '#3178c6',
    css: '#1572b6',
    html: '#e34f26',
    json: '#292929',
    markdown: '#083fa1',
    python: '#3776ab',
    java: '#ed8b00',
    cpp: '#00599c',
    rust: '#000000'
  };
  return colors[type] || '#666666';
} 