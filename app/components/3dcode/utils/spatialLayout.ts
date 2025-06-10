import { Vector3 } from 'three'
import { ComponentMetadata, ComponentType } from '../../../lib/types'

// Layer heights for different component types
const LAYER_HEIGHTS = {
  [ComponentType.PAGE]: 10,
  [ComponentType.LAYOUT]: 8,
  [ComponentType.COMPONENT]: 6,
  [ComponentType.HOOK]: 4,
  [ComponentType.CONTEXT]: 2,
  [ComponentType.UTILITY]: 0,
}

// Calculate 3D positions for all files based on relationships
export function calculateFilePositions(components: ComponentMetadata[]): Record<string, Vector3> {
  const positions: Record<string, Vector3> = {}
  
  // Group components by type
  const componentsByType = groupFilesByType(components)
  
  // Position each type in its layer
  Object.entries(componentsByType).forEach(([type, comps]) => {
    const componentType = type as ComponentType
    const layerHeight = LAYER_HEIGHTS[componentType]
    
    // Use force-directed layout within each layer
    const layerPositions = calculateLayerPositions(comps, layerHeight)
    
    Object.assign(positions, layerPositions)
  })
  
  // Apply gravitational clustering based on relationships
  applyGravitationalClustering(components, positions)
  
  return positions
}

// Group files by component type
function groupFilesByType(components: ComponentMetadata[]): Record<ComponentType, ComponentMetadata[]> {
  const groups: Record<ComponentType, ComponentMetadata[]> = {
    [ComponentType.PAGE]: [],
    [ComponentType.LAYOUT]: [],
    [ComponentType.COMPONENT]: [],
    [ComponentType.HOOK]: [],
    [ComponentType.CONTEXT]: [],
    [ComponentType.UTILITY]: [],
  }
  
  components.forEach(comp => {
    groups[comp.type].push(comp)
  })
  
  return groups
}

// Calculate positions within a layer using force-directed layout
function calculateLayerPositions(
  components: ComponentMetadata[], 
  layerHeight: number
): Record<string, Vector3> {
  const positions: Record<string, Vector3> = {}
  const count = components.length
  
  if (count === 0) return positions
  
  // For single component, place at center
  if (count === 1) {
    positions[components[0].file] = new Vector3(0, layerHeight, 0)
    return positions
  }
  
  // Distribute components in a circle or spiral
  if (count <= 8) {
    // Circle layout for small groups
    const radius = Math.max(5, count * 1.5)
    components.forEach((comp, i) => {
      const angle = (i / count) * Math.PI * 2
      positions[comp.file] = new Vector3(
        Math.cos(angle) * radius,
        layerHeight,
        Math.sin(angle) * radius
      )
    })
  } else {
    // Spiral layout for larger groups
    const spiralRadius = 8
    const spiralRate = 2
    components.forEach((comp, i) => {
      const angle = i * 0.5
      const radius = spiralRadius + (i * spiralRate * 0.1)
      positions[comp.file] = new Vector3(
        Math.cos(angle) * radius,
        layerHeight,
        Math.sin(angle) * radius
      )
    })
  }
  
  return positions
}

// Apply gravitational clustering to bring related files closer
function applyGravitationalClustering(
  components: ComponentMetadata[],
  positions: Record<string, Vector3>
): void {
  const iterations = 10
  const attractionStrength = 0.2
  const repulsionStrength = 5
  
  for (let iter = 0; iter < iterations; iter++) {
    const forces: Record<string, Vector3> = {}
    
    // Initialize forces
    components.forEach(comp => {
      forces[comp.file] = new Vector3(0, 0, 0)
    })
    
    // Calculate attraction forces between connected components
    components.forEach(comp => {
      const pos1 = positions[comp.file]
      if (!pos1) return
      
      // Attraction to used components
      comp.uses?.forEach(usedName => {
        const usedComp = components.find(c => c.name === usedName)
        if (usedComp && positions[usedComp.file]) {
          const pos2 = positions[usedComp.file]
          const diff = pos2.clone().sub(pos1)
          const distance = diff.length()
          
          if (distance > 0) {
            const force = diff.normalize().multiplyScalar(
              attractionStrength * Math.log(1 + distance)
            )
            forces[comp.file].add(force)
            forces[usedComp.file].sub(force)
          }
        }
      })
    })
    
    // Calculate repulsion forces between all components in same layer
    const componentsByType = groupFilesByType(components)
    Object.values(componentsByType).forEach(layerComps => {
      for (let i = 0; i < layerComps.length; i++) {
        for (let j = i + 1; j < layerComps.length; j++) {
          const comp1 = layerComps[i]
          const comp2 = layerComps[j]
          const pos1 = positions[comp1.file]
          const pos2 = positions[comp2.file]
          
          if (pos1 && pos2) {
            const diff = pos1.clone().sub(pos2)
            const distance = diff.length()
            
            if (distance > 0 && distance < 10) {
              const force = diff.normalize().multiplyScalar(
                repulsionStrength / (distance * distance)
              )
              forces[comp1.file].add(force)
              forces[comp2.file].sub(force)
            }
          }
        }
      }
    })
    
    // Apply forces with damping
    const damping = 0.1
    components.forEach(comp => {
      const pos = positions[comp.file]
      const force = forces[comp.file]
      if (pos && force) {
        // Only move in x-z plane, preserve y (layer height)
        const currentY = pos.y
        pos.add(force.multiplyScalar(damping))
        pos.y = currentY // Restore layer height
      }
    })
  }
}

// Group files by architectural layer
export function groupFilesByLayer(components: ComponentMetadata[]): Record<string, ComponentMetadata[]> {
  return {
    frontend: components.filter(c => 
      c.type === ComponentType.PAGE || 
      c.type === ComponentType.COMPONENT ||
      c.type === ComponentType.LAYOUT
    ),
    logic: components.filter(c => 
      c.type === ComponentType.HOOK ||
      c.type === ComponentType.CONTEXT
    ),
    infrastructure: components.filter(c => 
      c.type === ComponentType.UTILITY
    ),
  }
} 