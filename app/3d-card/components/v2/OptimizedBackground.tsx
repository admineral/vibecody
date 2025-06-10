"use client"

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface OptimizedBackgroundProps {
  particleCount: number;
  particleSize: number;
  gradientColors: string[];
  gradientIntensity: number;
}

export default function OptimizedBackground({
  particleCount = 2000,
  particleSize = 0.5,
  gradientColors = ['#0a0015', '#1a0033', '#2d1b69', '#6b46c1', '#9333ea'],
  gradientIntensity = 0.8
}: OptimizedBackgroundProps) {
  const particlesRef = useRef<THREE.Points>(null);

  // GPU Particle System
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Distribute particles in a sphere
      const radius = 50 + Math.random() * 150;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Light violet colors
      const brightness = 0.7 + Math.random() * 0.3;
      colors[i * 3] = brightness * 0.9;     // R
      colors[i * 3 + 1] = brightness * 0.8; // G
      colors[i * 3 + 2] = brightness;       // B
      
      // Varied sizes
      sizes[i] = particleSize * (0.5 + Math.random() * 1.5);
      
      // Random velocities for drift
      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    return geometry;
  }, [particleCount, particleSize]);
  
  // Particle shader material
  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 velocity;
        varying vec3 vColor;
        uniform float uTime;
        uniform float uPixelRatio;
        
        void main() {
          vColor = color;
          vec3 pos = position + velocity * uTime * 20.0;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
          float strength = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
          
          gl_FragColor = vec4(vColor, strength * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });
  }, []);
  
  // Gradient background mesh
  const gradientMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor1: { value: new THREE.Color(gradientColors[0]) },
        uColor2: { value: new THREE.Color(gradientColors[1]) },
        uColor3: { value: new THREE.Color(gradientColors[2]) },
        uColor4: { value: new THREE.Color(gradientColors[3]) },
        uColor5: { value: new THREE.Color(gradientColors[4]) },
        uIntensity: { value: gradientIntensity }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform vec3 uColor4;
        uniform vec3 uColor5;
        uniform float uIntensity;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vec2(0.5, 0.5);
          float dist = distance(vUv, center);
          
          vec3 color = uColor1;
          color = mix(color, uColor2, smoothstep(0.0, 0.3, dist));
          color = mix(color, uColor3, smoothstep(0.3, 0.5, dist));
          color = mix(color, uColor4, smoothstep(0.5, 0.7, dist));
          color = mix(color, uColor5, smoothstep(0.7, 1.4, dist));
          
          gl_FragColor = vec4(color * uIntensity, 1.0);
        }
      `,
      side: THREE.BackSide
    });
  }, [gradientColors, gradientIntensity]);
  
  // Animation
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.0002;
      particlesRef.current.rotation.x += 0.0001;
      
      // Update time uniform
      (particlesRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime;
    }
  });
  
  return (
    <>
      {/* Gradient Background */}
      <mesh scale={[300, 300, 300]}>
        <sphereGeometry args={[1, 32, 32]} />
        <primitive object={gradientMaterial} />
      </mesh>
      
      {/* GPU Particles */}
      <points ref={particlesRef} geometry={particles}>
        <primitive object={particleMaterial} />
      </points>
      
      {/* Subtle fog for depth */}
      <fog attach="fog" args={['#1a0033', 50, 200]} />
    </>
  );
} 