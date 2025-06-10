"use client"

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { easing } from 'maath';
import * as THREE from 'three';
import CodeCard3D from './CodeCard3D';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { useViewMode, ViewMode } from '../hooks/useViewMode';
import { useMockData } from '../hooks/useMockData';
import { calculateCirclePositions } from '../utils/cardPositioning';

interface Scene3DProps {
  cardCount: number;
  onCardCountChange: (count: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  orbitSpeed: number;
  onOrbitSpeedChange: (speed: number) => void;
  onRegenerateFiles: () => void;
  onResetView: () => void;
}

export default function Scene3D({
  cardCount,
  viewMode,
  onViewModeChange,
  orbitSpeed,
  onOrbitSpeedChange,
  onResetView
}: Scene3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const orbitControlsRef = useRef<React.ElementRef<typeof OrbitControls>>(null);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [circleRotation, setCircleRotation] = useState(0);
  const [userInteracting, setUserInteracting] = useState(false);
  const andromedaRef = useRef<THREE.Group>(null);
  const starFieldRef = useRef<THREE.Points>(null);

  // Hooks
  const mockData = useMockData(cardCount);
  const viewModeControls = useViewMode();

  // Sync external controls with internal state
  useEffect(() => {
    if (mockData.cardCount !== cardCount) {
      mockData.setCardCount(cardCount);
    }
  }, [cardCount, mockData]);

  useEffect(() => {
    if (viewModeControls.mode !== viewMode) {
      viewModeControls.setMode(viewMode);
    }
  }, [viewMode, viewModeControls]);

  useEffect(() => {
    if (viewModeControls.orbitSpeed !== orbitSpeed) {
      viewModeControls.setOrbitSpeed(orbitSpeed);
    }
  }, [orbitSpeed, viewModeControls]);

  // Calculate card positions
  const cardPositions = useMemo(() => {
    return calculateCirclePositions({
      radius: 8,
      cardCount: mockData.files.length,
      elevation: 0,
      tilt: 15,
      spacing: 1
    });
  }, [mockData.files.length]);

  // Keyboard controls
  useKeyboardControls({
    onArrowLeft: () => {
      setCircleRotation(prev => prev - 0.2);
      setUserInteracting(true);
      setTimeout(() => setUserInteracting(false), 2000);
    },
    onArrowRight: () => {
      setCircleRotation(prev => prev + 0.2);
      setUserInteracting(true);
      setTimeout(() => setUserInteracting(false), 2000);
    },
    onArrowUp: () => {
      if (viewMode === 'orbit') {
        const newSpeed = Math.min(3, viewModeControls.orbitSpeed + 0.1);
        viewModeControls.setOrbitSpeed(newSpeed);
        onOrbitSpeedChange(newSpeed);
      }
    },
    onArrowDown: () => {
      if (viewMode === 'orbit') {
        const newSpeed = Math.max(0, viewModeControls.orbitSpeed - 0.1);
        viewModeControls.setOrbitSpeed(newSpeed);
        onOrbitSpeedChange(newSpeed);
      }
    },
    onSpace: () => {
      const newMode = viewMode === 'orbit' ? 'free' : 'orbit';
      onViewModeChange(newMode);
    },
    onEscape: () => {
      onResetView();
      setSelectedCardIndex(null);
      setHoveredCardIndex(null);
      setCircleRotation(0);
      setUserInteracting(false);
    },
    onNumber: (index) => {
      if (index < mockData.files.length) {
        setSelectedCardIndex(index);
        mockData.setSelectedFileId(mockData.files[index].id);
      }
    }
  });

  // Create 3D starfield
  const starField = useMemo(() => {
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      // Create stars in a large sphere around us
      const radius = 200 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Violet-tinted star colors
      const brightness = 0.3 + Math.random() * 0.7;
      colors[i * 3] = brightness * (0.8 + Math.random() * 0.2); // Red
      colors[i * 3 + 1] = brightness * (0.6 + Math.random() * 0.4); // Green  
      colors[i * 3 + 2] = brightness; // Blue (full for violet tint)

      sizes[i] = Math.random() * 3 + 1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return geometry;
  }, []);

  // Animation frame
  useFrame((state, delta) => {
    // Animate Andromeda galaxy
    if (andromedaRef.current) {
      andromedaRef.current.rotation.z += delta * 0.02;
      // Gentle floating motion
      andromedaRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.1) * 2;
    }

    // Animate starfield - gentle drift
    if (starFieldRef.current) {
      starFieldRef.current.rotation.y += delta * 0.005;
      starFieldRef.current.rotation.x += delta * 0.002;
    }

    if (groupRef.current) {
      // Orbit mode rotation (only rotate the cards, not the camera)
      if (viewMode === 'orbit' && orbitSpeed > 0) {
        const autoRotation = delta * orbitSpeed * 0.5;
        setCircleRotation(prev => prev + autoRotation);
      }

      // Apply circle rotation
      groupRef.current.rotation.y = circleRotation;
    }

    // In orbit mode, apply automatic camera movement only when user isn't interacting
    if (viewMode === 'orbit' && orbitSpeed > 0 && !userInteracting) {
      const radius = 15;
      const height = 8;
      const targetX = Math.sin(state.clock.elapsedTime * 0.1) * radius;
      const targetZ = Math.cos(state.clock.elapsedTime * 0.1) * radius;
      
      easing.damp3(
        state.camera.position,
        [targetX, height, targetZ],
        0.3,
        delta
      );
      
      state.camera.lookAt(0, 0, 0);
    }
  });

  // Event handlers
  const handleCardPointerOver = (index: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredCardIndex(index);
  };

  const handleCardPointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredCardIndex(null);
  };

  const handleCardClick = (index: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setSelectedCardIndex(index);
    mockData.setSelectedFileId(mockData.files[index].id);
  };

  return (
    <>
      {/* Orbit Controls (active in both modes) */}
      <OrbitControls
        ref={orbitControlsRef}
        enablePan={viewMode === 'free'}
        enableZoom={true}
        enableRotate={true}
        maxDistance={50}
        minDistance={5}
        autoRotate={false}
        target={[0, 0, 0]}
        enableDamping={true}
        dampingFactor={0.05}
        onStart={() => setUserInteracting(true)}
        onEnd={() => {
          // Delay before resuming auto-rotation
          setTimeout(() => setUserInteracting(false), 2000);
        }}
      />

      {/* Main card group */}
      <group ref={groupRef}>
        {mockData.files.map((file, index) => {
          const position = cardPositions[index];
          if (!position) return null;

          return (
            <CodeCard3D
              key={file.id}
              file={file}
              position={position.position}
              rotation={position.rotation}
              scale={position.scale}
              isSelected={selectedCardIndex === index}
              isHovered={hoveredCardIndex === index}
              onPointerOver={handleCardPointerOver(index)}
              onPointerOut={handleCardPointerOut}
              onClick={handleCardClick(index)}
            />
          );
        })}
      </group>

      {/* 3D Starfield */}
      <points ref={starFieldRef} geometry={starField}>
        <pointsMaterial
          size={2}
          sizeAttenuation={true}
          vertexColors={true}
          transparent={true}
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Andromeda Galaxy in the distance */}
      <group ref={andromedaRef} position={[-80, 20, -150]} rotation={[0.3, 0.5, 0]}>
        {/* Galaxy core */}
        <mesh>
          <sphereGeometry args={[8, 32, 32]} />
          <meshStandardMaterial 
            color="#ff6b9d" 
            transparent 
            opacity={0.6}
            emissive="#ff6b9d"
            emissiveIntensity={0.3}
          />
        </mesh>
        
        {/* Galaxy spiral arms */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
            <torusGeometry args={[12 + i * 4, 1.5, 8, 32]} />
            <meshStandardMaterial 
              color={i === 0 ? "#9d4edd" : i === 1 ? "#c77dff" : "#e0aaff"} 
              transparent 
              opacity={0.4 - i * 0.1}
              emissive={i === 0 ? "#9d4edd" : i === 1 ? "#c77dff" : "#e0aaff"}
              emissiveIntensity={0.2}
            />
          </mesh>
        ))}
        
        {/* Outer glow */}
        <mesh>
          <sphereGeometry args={[25, 32, 32]} />
          <meshStandardMaterial 
            color="#240046" 
            transparent 
            opacity={0.1}
            emissive="#240046"
            emissiveIntensity={0.1}
          />
        </mesh>
      </group>

      {/* Nebula clouds scattered around */}
      {[
        { pos: [50, 30, -80] as [number, number, number], color: "#8b5cf6", size: 15 },
        { pos: [-60, -20, -100] as [number, number, number], color: "#a855f7", size: 12 },
        { pos: [30, -40, -120] as [number, number, number], color: "#c084fc", size: 18 },
        { pos: [-40, 50, -90] as [number, number, number], color: "#ddd6fe", size: 10 },
      ].map((nebula, i) => (
        <mesh key={i} position={nebula.pos}>
          <sphereGeometry args={[nebula.size, 16, 16]} />
          <meshStandardMaterial 
            color={nebula.color}
            transparent 
            opacity={0.15}
            emissive={nebula.color}
            emissiveIntensity={0.1}
          />
        </mesh>
      ))}

      {/* Enhanced Lighting for brighter scene */}
      <ambientLight intensity={0.6} color="#e6e6fa" />
      <directionalLight position={[10, 10, 5]} intensity={1.0} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={0.6} color="#8b5cf6" />
      <pointLight position={[0, 15, 0]} intensity={0.8} color="#da70d6" />
      <pointLight position={[15, 0, 15]} intensity={0.5} color="#9370db" />
      <pointLight position={[-15, 0, -15]} intensity={0.5} color="#6a5acd" />
      
      {/* Environment lighting with violet tones */}
      <hemisphereLight
        args={["#dda0dd", "#4b0082", 0.4]}
      />

      {/* Deep space fog */}
      <fog attach="fog" args={['#0a0015', 100, 500]} />
    </>
  );
}