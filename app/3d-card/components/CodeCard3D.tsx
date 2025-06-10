"use client"

import { useRef, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { easing } from 'maath';
import * as THREE from 'three';
import { CodeFile } from '../utils/codeTemplates';

interface CodeCard3DProps {
  file: CodeFile;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isSelected: boolean;
  isHovered: boolean;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}

const typeColors = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  css: '#1572b6',
  html: '#e34f26',
  json: '#000000',
  markdown: '#083fa1'
};

const typeIcons = {
  javascript: 'JS',
  typescript: 'TS',
  css: 'CSS',
  html: 'HTML',
  json: 'JSON',
  markdown: 'MD'
};

export default function CodeCard3D({
  file,
  position,
  rotation,
  scale,
  isSelected,
  isHovered,
  onPointerOver,
  onPointerOut,
  onClick
}: CodeCard3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cardRef = useRef<THREE.Mesh>(null);
  const frameRef = useRef<THREE.Mesh>(null);

  const typeColor = typeColors[file.type];
  const typeIcon = typeIcons[file.type];

  // Truncate content for display
  const displayContent = useMemo(() => {
    const lines = file.content.split('\n');
    const maxLines = 15;
    const truncatedLines = lines.slice(0, maxLines);
    if (lines.length > maxLines) {
      truncatedLines.push('...');
    }
    return truncatedLines.join('\n');
  }, [file.content]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Smooth position, rotation, and scale transitions
      easing.damp3(groupRef.current.position, position, 0.3, delta);
      easing.dampE(groupRef.current.rotation, rotation, 0.3, delta);
      easing.damp3(groupRef.current.scale, scale, 0.3, delta);
    }

    if (cardRef.current) {
      // Hover and selection effects
      const targetY = isHovered ? 0.1 : isSelected ? 0.05 : 0;
      const targetScale = isHovered ? 1.05 : isSelected ? 1.02 : 1;
      
      easing.damp3(cardRef.current.position, [0, targetY, 0], 0.2, delta);
      easing.damp3(cardRef.current.scale, [targetScale, targetScale, targetScale], 0.2, delta);
    }

    if (frameRef.current) {
      // Frame glow effect
      const material = frameRef.current.material as THREE.MeshStandardMaterial;
      const targetEmissive = isHovered ? 0.3 : isSelected ? 0.1 : 0;
      easing.damp(material, 'emissiveIntensity', targetEmissive, 0.2, delta);
    }
  });

  return (
    <group ref={groupRef}>
      {/* iPhone-style frame */}
      <RoundedBox
        ref={frameRef}
        args={[2.2, 3.2, 0.15]}
        radius={0.15}
        smoothness={8}
      >
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.8}
          roughness={0.2}
          emissive={typeColor}
          emissiveIntensity={0}
        />
      </RoundedBox>

      {/* Main card body */}
      <RoundedBox
        ref={cardRef}
        args={[2, 3, 0.1]}
        radius={0.12}
        smoothness={8}
        position={[0, 0, 0.08]}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.1}
          roughness={0.3}
        />
      </RoundedBox>

      {/* Screen content */}
      <Html
        transform
        occlude
        position={[0, 0, 0.14]}
        style={{
          width: '180px',
          height: '270px',
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '12px',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
            fontSize: '8px',
            lineHeight: '1.2',
            color: '#e2e8f0',
            border: `1px solid ${typeColor}20`,
            boxShadow: isHovered 
              ? `0 0 20px ${typeColor}40` 
              : isSelected 
                ? `0 0 10px ${typeColor}30`
                : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
              paddingBottom: '4px',
              borderBottom: `1px solid ${typeColor}30`
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '3px',
                  background: typeColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '6px',
                  fontWeight: 'bold',
                  color: file.type === 'json' ? 'white' : 'black'
                }}
              >
                {typeIcon}
              </div>
              <span
                style={{
                  fontSize: '7px',
                  fontWeight: '600',
                  color: '#f1f5f9',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100px'
                }}
              >
                {file.name}
              </span>
            </div>
            <div
              style={{
                fontSize: '6px',
                color: '#64748b'
              }}
            >
              {Math.round(file.size / 1024)}KB
            </div>
          </div>

          {/* Code content */}
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <pre
              style={{
                margin: 0,
                padding: 0,
                fontSize: '6px',
                lineHeight: '1.3',
                color: '#cbd5e1',
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {displayContent}
            </pre>
            
            {/* Fade out effect at bottom */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '20px',
                background: 'linear-gradient(transparent, #0f172a)',
                pointerEvents: 'none'
              }}
            />
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: '4px',
              paddingTop: '4px',
              borderTop: `1px solid ${typeColor}20`,
              fontSize: '5px',
              color: '#64748b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>{file.type.toUpperCase()}</span>
            <span>
              {file.lastModified.toLocaleDateString()}
            </span>
          </div>
        </div>
      </Html>

      {/* Subtle glow effect */}
      {(isHovered || isSelected) && (
        <pointLight
          position={[0, 0, 1]}
          intensity={isHovered ? 0.5 : 0.3}
          color={typeColor}
          distance={3}
          decay={2}
        />
      )}
    </group>
  );
} 