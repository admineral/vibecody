"use client"

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

import InstancedCardRenderer from './InstancedCardRenderer';
import OptimizedBackground from './OptimizedBackground';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import { useViewMode, ViewMode } from '../../hooks/useViewMode';
import { useMockData } from '../../hooks/useMockData';
import { calculateCirclePositions } from '../../utils/cardPositioning';

interface Scene3Dv2Props {
  cardCount: number;
  onCardCountChange: (count: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  orbitSpeed: number;
  onOrbitSpeedChange: (speed: number) => void;
  onRegenerateFiles: () => void;
  onResetView: () => void;
  // v2 specific props
  quality: 'low' | 'medium' | 'high' | 'ultra';
  particleDensity: number;
  bloomIntensity: number;
  maxRenderDistance: number;
  gradientColors: string[];
  gradientIntensity: number;
}

export default function Scene3Dv2({
  cardCount,
  onCardCountChange,
  viewMode,
  onViewModeChange,
  orbitSpeed,
  onOrbitSpeedChange,
  onRegenerateFiles,
  onResetView,
  quality = 'high',
  particleDensity = 2000,
  bloomIntensity = 0.5,
  maxRenderDistance = 100,
  gradientColors = ['#0a0015', '#1a0033', '#2d1b69', '#6b46c1', '#9333ea'],
  gradientIntensity = 0.8
}: Scene3Dv2Props) {
  const groupRef = useRef<THREE.Group>(null);
  const orbitControlsRef = useRef<any>(null);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [circleRotation, setCircleRotation] = useState(0);
  const [userInteracting, setUserInteracting] = useState(false);
  const [currentQuality, setCurrentQuality] = useState(quality);

  // Performance monitoring
  const [dpr, setDpr] = useState(1.5);

  // Hooks
  const mockData = useMockData(cardCount);
  const viewModeControls = useViewMode();

  // Sync external controls
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

  // Calculate optimized card positions
  const cardPositions = React.useMemo(() => {
    return calculateCirclePositions({
      radius: 8,
      cardCount: mockData.files.length,
      elevation: 0,
      tilt: 15,
      spacing: 1
    }).map(pos => pos.position);
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

  // Animation frame
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Orbit mode rotation
      if (viewMode === 'orbit' && orbitSpeed > 0) {
        const autoRotation = delta * orbitSpeed * 0.5;
        setCircleRotation(prev => prev + autoRotation);
      }

      // Apply circle rotation with smooth easing
      const targetRotation = circleRotation;
      groupRef.current.rotation.y += (targetRotation - groupRef.current.rotation.y) * 0.1;
    }

    // Camera orbit animation (only when not user interacting)
    if (viewMode === 'orbit' && orbitSpeed > 0 && !userInteracting) {
      const radius = 15;
      const height = 8;
      const time = state.clock.elapsedTime * 0.1;
      
      const targetX = Math.sin(time) * radius;
      const targetZ = Math.cos(time) * radius;
      const targetY = height + Math.sin(time * 0.5) * 2; // Gentle vertical movement
      
      state.camera.position.x += (targetX - state.camera.position.x) * 0.02;
      state.camera.position.y += (targetY - state.camera.position.y) * 0.02;
      state.camera.position.z += (targetZ - state.camera.position.z) * 0.02;
      
      state.camera.lookAt(0, 0, 0);
    }
  });

  // Handle card interactions
  const handleCardClick = (index: number) => {
    setSelectedCardIndex(index);
    mockData.setSelectedFileId(mockData.files[index].id);
  };

  const handleCardHover = (index: number | null) => {
    setHoveredCardIndex(index);
  };

  // Handle file regeneration
  const handleRegenerateFiles = () => {
    mockData.regenerateFiles();
    onRegenerateFiles();
  };

  return (
    <>
      {/* Performance monitoring */}
      <PerformanceMonitor
        onIncline={() => setDpr(Math.min(2, dpr + 0.1))}
        onDecline={() => setDpr(Math.max(0.5, dpr - 0.1))}
        flipflops={3}
        onFallback={() => setCurrentQuality('low')}
      />

      {/* Orbit Controls */}
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
          setTimeout(() => setUserInteracting(false), 2000);
        }}
      />

      {/* Optimized Background */}
      <OptimizedBackground
        particleCount={particleDensity}
        particleSize={0.5}
        gradientColors={gradientColors}
        gradientIntensity={gradientIntensity}
      />

      {/* Instanced Card Renderer */}
      <group ref={groupRef}>
        <InstancedCardRenderer
          files={mockData.files}
          positions={cardPositions}
          selectedIndex={selectedCardIndex}
          hoveredIndex={hoveredCardIndex}
          onCardClick={handleCardClick}
          onCardHover={handleCardHover}
          quality={currentQuality}
          maxRenderDistance={maxRenderDistance}
        />
      </group>

      {/* Optimized Lighting */}
      <ambientLight intensity={0.8} color="#e6e6fa" />
      <directionalLight position={[10, 10, 5]} intensity={0.5} color="#ffffff" />
      <pointLight position={[0, 15, 0]} intensity={0.3} color="#da70d6" />

      {/* Post-processing effects */}
      {bloomIntensity > 0 && currentQuality !== 'low' && (
        <EffectComposer>
          <Bloom
            intensity={bloomIntensity}
            luminanceThreshold={0.8}
            luminanceSmoothing={0.9}
            radius={0.8}
          />
        </EffectComposer>
      )}
    </>
  );
} 