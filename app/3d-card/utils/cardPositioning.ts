import * as THREE from 'three';

export interface CardPosition {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface CircleLayoutOptions {
  radius: number;
  cardCount: number;
  elevation: number;
  tilt: number;
  spacing: number;
}

export function calculateCirclePositions(options: CircleLayoutOptions): CardPosition[] {
  const { radius, cardCount, elevation, tilt, spacing } = options;
  const positions: CardPosition[] = [];
  
  if (cardCount === 0) return positions;
  
  const angleStep = (Math.PI * 2) / cardCount;
  const adjustedRadius = radius + (spacing * cardCount * 0.01);
  
  for (let i = 0; i < cardCount; i++) {
    const angle = i * angleStep;
    
    // Position cards in a circle, facing outward
    const x = Math.sin(angle) * adjustedRadius;
    const z = Math.cos(angle) * adjustedRadius;
    const y = elevation + Math.sin(i * 0.3) * 0.5; // Slight wave effect
    
    // Rotation to face outward from center
    const rotationY = angle;
    const rotationX = tilt * (Math.PI / 180); // Convert tilt to radians
    const rotationZ = 0;
    
    positions.push({
      position: [x, y, z],
      rotation: [rotationX, rotationY, rotationZ],
      scale: [1, 1, 1]
    });
  }
  
  return positions;
}

export function calculateSpiralPositions(cardCount: number, radius: number = 8): CardPosition[] {
  const positions: CardPosition[] = [];
  const spiralTurns = Math.max(2, cardCount / 8);
  
  for (let i = 0; i < cardCount; i++) {
    const t = i / cardCount;
    const angle = t * spiralTurns * Math.PI * 2;
    const currentRadius = radius * (0.3 + 0.7 * t);
    
    const x = Math.sin(angle) * currentRadius;
    const z = Math.cos(angle) * currentRadius;
    const y = (t - 0.5) * 10; // Vertical spread
    
    positions.push({
      position: [x, y, z],
      rotation: [0, angle, 0],
      scale: [1, 1, 1]
    });
  }
  
  return positions;
}

export function calculateGridPositions(cardCount: number, spacing: number = 3): CardPosition[] {
  const positions: CardPosition[] = [];
  const cols = Math.ceil(Math.sqrt(cardCount));
  const rows = Math.ceil(cardCount / cols);
  
  const offsetX = -(cols - 1) * spacing * 0.5;
  const offsetZ = -(rows - 1) * spacing * 0.5;
  
  for (let i = 0; i < cardCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    
    const x = offsetX + col * spacing;
    const z = offsetZ + row * spacing;
    const y = 0;
    
    positions.push({
      position: [x, y, z],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    });
  }
  
  return positions;
}

export function interpolatePositions(
  from: CardPosition[],
  to: CardPosition[],
  progress: number
): CardPosition[] {
  const result: CardPosition[] = [];
  const maxLength = Math.max(from.length, to.length);
  
  for (let i = 0; i < maxLength; i++) {
    const fromPos = from[i] || from[from.length - 1] || { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
    const toPos = to[i] || to[to.length - 1] || { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
    
    const position: [number, number, number] = [
      THREE.MathUtils.lerp(fromPos.position[0], toPos.position[0], progress),
      THREE.MathUtils.lerp(fromPos.position[1], toPos.position[1], progress),
      THREE.MathUtils.lerp(fromPos.position[2], toPos.position[2], progress)
    ];
    
    const rotation: [number, number, number] = [
      THREE.MathUtils.lerp(fromPos.rotation[0], toPos.rotation[0], progress),
      THREE.MathUtils.lerp(fromPos.rotation[1], toPos.rotation[1], progress),
      THREE.MathUtils.lerp(fromPos.rotation[2], toPos.rotation[2], progress)
    ];
    
    const scale: [number, number, number] = [
      THREE.MathUtils.lerp(fromPos.scale[0], toPos.scale[0], progress),
      THREE.MathUtils.lerp(fromPos.scale[1], toPos.scale[1], progress),
      THREE.MathUtils.lerp(fromPos.scale[2], toPos.scale[2], progress)
    ];
    
    result.push({ position, rotation, scale });
  }
  
  return result;
}

export function getCardAtAngle(angle: number, positions: CardPosition[]): number {
  if (positions.length === 0) return -1;
  
  const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const angleStep = (Math.PI * 2) / positions.length;
  
  return Math.round(normalizedAngle / angleStep) % positions.length;
}

export function rotatePositions(positions: CardPosition[], angle: number): CardPosition[] {
  return positions.map(pos => {
    const [x, y, z] = pos.position;
    const [rx, ry, rz] = pos.rotation;
    
    // Rotate position around Y axis
    const newX = x * Math.cos(angle) - z * Math.sin(angle);
    const newZ = x * Math.sin(angle) + z * Math.cos(angle);
    
    return {
      position: [newX, y, newZ],
      rotation: [rx, ry + angle, rz],
      scale: pos.scale
    };
  });
} 