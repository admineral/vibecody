export const cardVertexShader = `
  attribute vec2 aTextureOffset;
  attribute float aLOD;
  
  varying vec2 vUv;
  varying vec2 vTextureOffset;
  varying float vLOD;
  varying float vDistance;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vTextureOffset = aTextureOffset;
    vLOD = aLOD;
    
    // Calculate world position
    vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // Calculate view position
    vec4 mvPosition = modelViewMatrix * worldPosition;
    vDistance = length(mvPosition.xyz);
    
    // Apply LOD-based scaling
    vec3 scaledPosition = position;
    if (vLOD > 2.0) {
      // Point mode - make very small
      scaledPosition *= 0.1;
    } else if (vLOD > 1.0) {
      // Billboard mode - flatten
      scaledPosition.z *= 0.5;
    }
    
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(scaledPosition, 1.0);
  }
`;

export const cardFragmentShader = `
  uniform sampler2D uTextureAtlas;
  uniform vec2 uAtlasSize;
  uniform float uTime;
  uniform float uMaxDistance;
  
  varying vec2 vUv;
  varying vec2 vTextureOffset;
  varying float vLOD;
  varying float vDistance;
  varying vec3 vWorldPosition;
  
  // Calculate UV coordinates within the atlas
  vec2 getAtlasUV() {
    vec2 cardSize = vec2(512.0, 768.0) / uAtlasSize;
    vec2 atlasUV = vTextureOffset + vUv * cardSize;
    return atlasUV;
  }
  
  void main() {
    // Skip rendering if too far
    if (vDistance > uMaxDistance) {
      discard;
    }
    
    vec4 color;
    
    if (vLOD < 1.0) {
      // Full quality - sample from texture atlas
      vec2 atlasUV = getAtlasUV();
      color = texture2D(uTextureAtlas, atlasUV);
      
      // Add subtle animation on edges
      float edgeFactor = smoothstep(0.0, 0.02, vUv.x) * 
                        smoothstep(1.0, 0.98, vUv.x) * 
                        smoothstep(0.0, 0.02, vUv.y) * 
                        smoothstep(1.0, 0.98, vUv.y);
      
      color.rgb *= 0.9 + 0.1 * edgeFactor;
      
    } else if (vLOD < 2.0) {
      // Simplified - basic color based on position
      vec2 atlasUV = getAtlasUV();
      color = texture2D(uTextureAtlas, atlasUV);
      color.rgb *= 0.7; // Darker for distance
      
    } else if (vLOD < 3.0) {
      // Billboard - very simple
      color = vec4(0.5, 0.4, 0.6, 1.0);
      
    } else {
      // Point - just a dot
      float dist = distance(vUv, vec2(0.5));
      if (dist > 0.5) discard;
      color = vec4(0.8, 0.7, 0.9, 1.0 - dist);
    }
    
    // Distance fog
    float fogFactor = smoothstep(uMaxDistance * 0.5, uMaxDistance, vDistance);
    color.rgb = mix(color.rgb, vec3(0.04, 0.0, 0.1), fogFactor);
    
    // Fade out based on distance
    float fadeFactor = smoothstep(uMaxDistance * 0.8, uMaxDistance, vDistance);
    color.a *= (1.0 - fadeFactor);
    
    gl_FragColor = color;
  }
`; 