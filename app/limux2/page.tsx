'use client';

import React, { useEffect, useRef } from 'react';
import rough from 'roughjs';

interface BarTheme {
  id: number;
  name: string;
  category: string;
  background: string;
  strokeColor: string;
  strokeWidth: number;
  roughness: number;
  fillStyles: string[];
  colors: string[];
  containerFill?: string;
  bowing?: number;
  hachureGap?: number;
  hachureAngle?: number;
  height?: number;
  width?: number;
  special?: string;
}

const RoughProgressBar = ({ 
  segments, 
  theme,
  className = ""
}: { 
  segments: Array<{
    label: string;
    percentage: number;
  }>;
  theme: BarTheme;
  className?: string;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const width = theme.width || 400;
  const height = theme.height || 50;

  useEffect(() => {
    if (!svgRef.current) return;

    const rc = rough.svg(svgRef.current);
    const svg = svgRef.current;
    svg.innerHTML = '';

    // Background
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', String(width));
    bgRect.setAttribute('height', String(height));
    bgRect.setAttribute('fill', theme.background);
    bgRect.setAttribute('rx', '8');
    svg.appendChild(bgRect);

    const padding = 10;
    const barHeight = height - (padding * 2);
    const barWidth = width - (padding * 2);

    // Special effects
    if (theme.special === 'double-border') {
      // Outer border
      const outerBorder = rc.rectangle(padding - 5, padding - 5, barWidth + 10, barHeight + 10, {
        stroke: theme.strokeColor,
        strokeWidth: 1,
        fill: 'transparent',
        roughness: theme.roughness * 0.5
      });
      svg.appendChild(outerBorder);
    }

    // Container
    const container = rc.rectangle(padding, padding, barWidth, barHeight, {
      stroke: theme.strokeColor,
      strokeWidth: theme.strokeWidth,
      fill: theme.containerFill || 'transparent',
      fillStyle: theme.containerFill ? 'solid' : undefined,
      roughness: theme.roughness,
      bowing: theme.bowing || 0
    });
    svg.appendChild(container);

    // Segments
    let currentX = padding;
    segments.forEach((segment, index) => {
      const segmentWidth = (barWidth * segment.percentage) / 100;
      const fillStyle = theme.fillStyles[index % theme.fillStyles.length];
      const color = theme.colors[index % theme.colors.length];
      
      if (theme.special === 'rounded-segments' && index > 0) {
        currentX += 3; // Small gap between segments
      }

      const rect = rc.rectangle(currentX, padding, segmentWidth - (theme.special === 'rounded-segments' ? 3 : 0), barHeight, {
        stroke: theme.special === 'no-internal-borders' ? 'transparent' : theme.strokeColor,
        strokeWidth: theme.strokeWidth * 0.5,
        fill: color,
        fillStyle: fillStyle as any,
        hachureGap: theme.hachureGap || 4,
        hachureAngle: theme.hachureAngle || -45,
        roughness: theme.roughness * 0.8,
        bowing: theme.bowing || 0
      });
      svg.appendChild(rect);

      currentX += segmentWidth;
    });

    // Title
    const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleText.setAttribute('x', String(width / 2));
    titleText.setAttribute('y', String(height - 3));
    titleText.setAttribute('text-anchor', 'middle');
    titleText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    titleText.setAttribute('font-size', '9');
    titleText.setAttribute('fill', theme.strokeColor);
    titleText.setAttribute('opacity', '0.6');
    titleText.textContent = `${theme.id}. ${theme.name}`;
    svg.appendChild(titleText);

  }, [segments, theme]);

  return (
    <div className={`${className} group cursor-pointer transition-all duration-300 hover:scale-105`}>
      <svg ref={svgRef} width={theme.width || 400} height={(theme.height || 50) + 10} className="w-full h-auto"></svg>
    </div>
  );
};

export default function Limux2Page() {
  const segments = [
    { label: "System", percentage: 20 },
    { label: "Tools", percentage: 15 },
    { label: "Thinking", percentage: 20 },
    { label: "Data", percentage: 45 }
  ];

  // 50 unique themes
  const themes: BarTheme[] = [
    // Minimal Series (1-5)
    {
      id: 1,
      name: "Ultra Clean",
      category: "Minimal",
      background: "#ffffff",
      strokeColor: "#e0e0e0",
      strokeWidth: 1,
      roughness: 0.3,
      fillStyles: ['solid', 'solid', 'solid', 'solid'],
      colors: ['#f0f0f0', '#e8e8e8', '#e0e0e0', '#d8d8d8'],
      width: 350,
      height: 40
    },
    {
      id: 2,
      name: "Subtle Sketch",
      category: "Minimal",
      background: "#fafafa",
      strokeColor: "#666666",
      strokeWidth: 1,
      roughness: 0.5,
      fillStyles: ['hachure', 'hachure', 'hachure', 'hachure'],
      colors: ['#4a90e2', '#7ed321', '#f5a623', '#d0021b'],
      hachureGap: 8,
      width: 400,
      height: 45
    },
    {
      id: 3,
      name: "Thin Lines",
      category: "Minimal",
      background: "#f8f9fa",
      strokeColor: "#343a40",
      strokeWidth: 0.5,
      roughness: 0.8,
      fillStyles: ['dots', 'dots', 'dots', 'dots'],
      colors: ['#6c757d', '#495057', '#343a40', '#212529'],
      hachureGap: 6,
      width: 450,
      height: 35
    },
    {
      id: 4,
      name: "Mono Minimal",
      category: "Minimal",
      background: "#ffffff",
      strokeColor: "#000000",
      strokeWidth: 1.5,
      roughness: 0.4,
      fillStyles: ['cross-hatch', 'cross-hatch', 'cross-hatch', 'cross-hatch'],
      colors: ['#000000', '#000000', '#000000', '#000000'],
      hachureGap: 10,
      hachureAngle: 45,
      width: 380,
      height: 50
    },
    {
      id: 5,
      name: "Soft Touch",
      category: "Minimal",
      background: "#f5f5f5",
      strokeColor: "#9e9e9e",
      strokeWidth: 2,
      roughness: 0.6,
      fillStyles: ['zigzag', 'zigzag', 'zigzag', 'zigzag'],
      colors: ['#e1f5fe', '#b3e5fc', '#81d4fa', '#4fc3f7'],
      bowing: 0.5,
      width: 420,
      height: 48
    },

    // Neon Series (6-10)
    {
      id: 6,
      name: "Cyber Pink",
      category: "Neon",
      background: "#0a0a0a",
      strokeColor: "#ff00ff",
      strokeWidth: 2,
      roughness: 1.2,
      fillStyles: ['hachure', 'cross-hatch', 'dots', 'zigzag'],
      colors: ['#ff00ff', '#ff0080', '#ff0040', '#ff0000'],
      containerFill: '#1a0d1a',
      hachureGap: 3,
      width: 400,
      height: 55
    },
    {
      id: 7,
      name: "Electric Blue",
      category: "Neon",
      background: "#000814",
      strokeColor: "#00ffff",
      strokeWidth: 3,
      roughness: 1.5,
      fillStyles: ['zigzag-line', 'cross-hatch', 'hachure', 'dots'],
      colors: ['#001d3d', '#003566', '#006ba0', '#0099ff'],
      containerFill: '#001233',
      bowing: 1,
      width: 450,
      height: 60
    },
    {
      id: 8,
      name: "Neon Sunset",
      category: "Neon",
      background: "#1a0033",
      strokeColor: "#ffaa00",
      strokeWidth: 2.5,
      roughness: 1.8,
      fillStyles: ['cross-hatch', 'zigzag', 'dots', 'hachure'],
      colors: ['#ff006e', '#ff4757', '#ff6348', '#ff9ff3'],
      containerFill: '#2d0052',
      hachureAngle: -60,
      width: 380,
      height: 52
    },
    {
      id: 9,
      name: "Matrix Green",
      category: "Neon",
      background: "#0d0d0d",
      strokeColor: "#00ff00",
      strokeWidth: 2,
      roughness: 2.0,
      fillStyles: ['hachure', 'hachure', 'hachure', 'hachure'],
      colors: ['#003300', '#006600', '#009900', '#00ff00'],
      hachureGap: 4,
      hachureAngle: 90,
      width: 420,
      height: 50
    },
    {
      id: 10,
      name: "Vapor Wave",
      category: "Neon",
      background: "#1a1a2e",
      strokeColor: "#f39c12",
      strokeWidth: 3,
      roughness: 1.3,
      fillStyles: ['solid', 'zigzag', 'cross-hatch', 'dots'],
      colors: ['#e056fd', '#686de0', '#30336b', '#130f40'],
      containerFill: '#16213e',
      bowing: 2,
      width: 440,
      height: 58
    },

    // Pastel Series (11-15)
    {
      id: 11,
      name: "Cotton Candy",
      category: "Pastel",
      background: "#fff5f5",
      strokeColor: "#ff6b6b",
      strokeWidth: 2,
      roughness: 0.8,
      fillStyles: ['dots', 'zigzag', 'hachure', 'cross-hatch'],
      colors: ['#ffe0e0', '#ffc0cb', '#ffb6c1', '#ffa0a0'],
      hachureGap: 6,
      width: 400,
      height: 45
    },
    {
      id: 12,
      name: "Mint Dream",
      category: "Pastel",
      background: "#f0fdf4",
      strokeColor: "#22c55e",
      strokeWidth: 1.5,
      roughness: 0.6,
      fillStyles: ['hachure', 'dots', 'zigzag-line', 'solid'],
      colors: ['#bbf7d0', '#86efac', '#4ade80', '#22c55e'],
      bowing: 1,
      width: 420,
      height: 48
    },
    {
      id: 13,
      name: "Lavender Mist",
      category: "Pastel",
      background: "#faf5ff",
      strokeColor: "#a855f7",
      strokeWidth: 2.5,
      roughness: 0.9,
      fillStyles: ['cross-hatch', 'dots', 'hachure', 'zigzag'],
      colors: ['#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7'],
      hachureAngle: 30,
      width: 380,
      height: 50
    },
    {
      id: 14,
      name: "Peach Blossom",
      category: "Pastel",
      background: "#fef3c7",
      strokeColor: "#f59e0b",
      strokeWidth: 2,
      roughness: 0.7,
      fillStyles: ['zigzag', 'hachure', 'dots', 'cross-hatch'],
      colors: ['#fed7aa', '#fdba74', '#fb923c', '#f97316'],
      hachureGap: 5,
      width: 450,
      height: 46
    },
    {
      id: 15,
      name: "Sky Blue",
      category: "Pastel",
      background: "#f0f9ff",
      strokeColor: "#0ea5e9",
      strokeWidth: 1.8,
      roughness: 0.5,
      fillStyles: ['solid', 'dots', 'zigzag', 'hachure'],
      colors: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8'],
      containerFill: '#ffffff',
      width: 410,
      height: 44
    },

    // Monochrome Series (16-20)
    {
      id: 16,
      name: "Pure Black",
      category: "Monochrome",
      background: "#ffffff",
      strokeColor: "#000000",
      strokeWidth: 4,
      roughness: 2.5,
      fillStyles: ['hachure', 'hachure', 'hachure', 'hachure'],
      colors: ['#000000', '#333333', '#666666', '#999999'],
      hachureGap: 3,
      hachureAngle: 45,
      width: 400,
      height: 60
    },
    {
      id: 17,
      name: "Inverted",
      category: "Monochrome",
      background: "#000000",
      strokeColor: "#ffffff",
      strokeWidth: 3,
      roughness: 1.8,
      fillStyles: ['cross-hatch', 'zigzag', 'dots', 'hachure'],
      colors: ['#ffffff', '#cccccc', '#999999', '#666666'],
      containerFill: '#1a1a1a',
      width: 420,
      height: 55
    },
    {
      id: 18,
      name: "Gray Scale",
      category: "Monochrome",
      background: "#f5f5f5",
      strokeColor: "#424242",
      strokeWidth: 2,
      roughness: 1.2,
      fillStyles: ['solid', 'solid', 'solid', 'solid'],
      colors: ['#e0e0e0', '#bdbdbd', '#9e9e9e', '#757575'],
      width: 380,
      height: 48
    },
    {
      id: 19,
      name: "Charcoal",
      category: "Monochrome",
      background: "#2b2b2b",
      strokeColor: "#e0e0e0",
      strokeWidth: 2.5,
      roughness: 2.0,
      fillStyles: ['zigzag-line', 'cross-hatch', 'hachure', 'dots'],
      colors: ['#4a4a4a', '#5a5a5a', '#6a6a6a', '#7a7a7a'],
      containerFill: '#1a1a1a',
      bowing: 1.5,
      width: 440,
      height: 52
    },
    {
      id: 20,
      name: "Silver Lining",
      category: "Monochrome",
      background: "#fafafa",
      strokeColor: "#6b7280",
      strokeWidth: 1,
      roughness: 0.8,
      fillStyles: ['dots', 'hachure', 'cross-hatch', 'zigzag'],
      colors: ['#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af'],
      hachureGap: 7,
      width: 400,
      height: 45
    },

    // Nature Series (21-25)
    {
      id: 21,
      name: "Forest Canopy",
      category: "Nature",
      background: "#f3f4f6",
      strokeColor: "#065f46",
      strokeWidth: 2.5,
      roughness: 1.5,
      fillStyles: ['hachure', 'cross-hatch', 'dots', 'zigzag'],
      colors: ['#6ee7b7', '#34d399', '#10b981', '#059669'],
      hachureAngle: 60,
      width: 420,
      height: 54
    },
    {
      id: 22,
      name: "Ocean Waves",
      category: "Nature",
      background: "#eff6ff",
      strokeColor: "#1e40af",
      strokeWidth: 3,
      roughness: 2.2,
      fillStyles: ['zigzag', 'zigzag-line', 'hachure', 'cross-hatch'],
      colors: ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'],
      bowing: 3,
      width: 450,
      height: 58
    },
    {
      id: 23,
      name: "Autumn Leaves",
      category: "Nature",
      background: "#fefce8",
      strokeColor: "#92400e",
      strokeWidth: 2,
      roughness: 1.8,
      fillStyles: ['cross-hatch', 'hachure', 'dots', 'zigzag'],
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#b45309'],
      hachureGap: 5,
      width: 400,
      height: 50
    },
    {
      id: 24,
      name: "Desert Sand",
      category: "Nature",
      background: "#fef3c7",
      strokeColor: "#78350f",
      strokeWidth: 2.5,
      roughness: 2.5,
      fillStyles: ['dots', 'hachure', 'cross-hatch', 'solid'],
      colors: ['#fde68a', '#fcd34d', '#fbbf24', '#f59e0b'],
      bowing: 2,
      width: 380,
      height: 48
    },
    {
      id: 25,
      name: "Mountain Stone",
      category: "Nature",
      background: "#f9fafb",
      strokeColor: "#374151",
      strokeWidth: 3.5,
      roughness: 3.0,
      fillStyles: ['hachure', 'hachure', 'hachure', 'hachure'],
      colors: ['#9ca3af', '#6b7280', '#4b5563', '#374151'],
      hachureGap: 4,
      hachureAngle: -45,
      width: 430,
      height: 56
    },

    // Retro Series (26-30)
    {
      id: 26,
      name: "80s Arcade",
      category: "Retro",
      background: "#2d1b69",
      strokeColor: "#ff6ec7",
      strokeWidth: 3,
      roughness: 1.5,
      fillStyles: ['solid', 'zigzag', 'cross-hatch', 'dots'],
      colors: ['#ff6ec7', '#ff9472', '#ffd93d', '#6bcf7f'],
      containerFill: '#1a0f3d',
      bowing: 1,
      width: 440,
      height: 60
    },
    {
      id: 27,
      name: "Vintage Paper",
      category: "Retro",
      background: "#f4e4c1",
      strokeColor: "#5d4037",
      strokeWidth: 2,
      roughness: 2.8,
      fillStyles: ['hachure', 'cross-hatch', 'hachure', 'cross-hatch'],
      colors: ['#8d6e63', '#795548', '#6d4c41', '#5d4037'],
      hachureGap: 6,
      hachureAngle: 75,
      width: 400,
      height: 52
    },
    {
      id: 28,
      name: "Disco Fever",
      category: "Retro",
      background: "#4a148c",
      strokeColor: "#ffd600",
      strokeWidth: 4,
      roughness: 2.0,
      fillStyles: ['zigzag-line', 'dots', 'cross-hatch', 'hachure'],
      colors: ['#e91e63', '#9c27b0', '#3f51b5', '#00bcd4'],
      containerFill: '#311b92',
      special: 'double-border',
      width: 460,
      height: 64
    },
    {
      id: 29,
      name: "Old Terminal",
      category: "Retro",
      background: "#0f172a",
      strokeColor: "#22d3ee",
      strokeWidth: 1.5,
      roughness: 0.8,
      fillStyles: ['solid', 'solid', 'solid', 'solid'],
      colors: ['#0891b2', '#0e7490', '#155e75', '#164e63'],
      hachureGap: 2,
      width: 420,
      height: 46
    },
    {
      id: 30,
      name: "Sepia Tone",
      category: "Retro",
      background: "#fdf6e3",
      strokeColor: "#704214",
      strokeWidth: 2.5,
      roughness: 2.2,
      fillStyles: ['hachure', 'dots', 'cross-hatch', 'zigzag'],
      colors: ['#d2b48c', '#bc9a6a', '#a0826d', '#8b7355'],
      bowing: 1.5,
      width: 390,
      height: 50
    },

    // Corporate Series (31-35)
    {
      id: 31,
      name: "Business Blue",
      category: "Corporate",
      background: "#f8fafc",
      strokeColor: "#1e293b",
      strokeWidth: 1,
      roughness: 0.4,
      fillStyles: ['solid', 'solid', 'solid', 'solid'],
      colors: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'],
      width: 440,
      height: 42
    },
    {
      id: 32,
      name: "Professional Gray",
      category: "Corporate",
      background: "#ffffff",
      strokeColor: "#64748b",
      strokeWidth: 1.5,
      roughness: 0.6,
      fillStyles: ['hachure', 'hachure', 'hachure', 'hachure'],
      colors: ['#cbd5e1', '#94a3b8', '#64748b', '#475569'],
      hachureGap: 8,
      hachureAngle: 0,
      width: 400,
      height: 45
    },
    {
      id: 33,
      name: "Excel Green",
      category: "Corporate",
      background: "#f0fdf4",
      strokeColor: "#15803d",
      strokeWidth: 2,
      roughness: 0.5,
      fillStyles: ['dots', 'solid', 'hachure', 'cross-hatch'],
      colors: ['#86efac', '#4ade80', '#22c55e', '#16a34a'],
      width: 420,
      height: 48
    },
    {
      id: 34,
      name: "Report Red",
      category: "Corporate",
      background: "#fef2f2",
      strokeColor: "#991b1b",
      strokeWidth: 1.8,
      roughness: 0.7,
      fillStyles: ['cross-hatch', 'hachure', 'solid', 'dots'],
      colors: ['#fca5a5', '#f87171', '#ef4444', '#dc2626'],
      hachureGap: 6,
      width: 380,
      height: 44
    },
    {
      id: 35,
      name: "Dashboard Dark",
      category: "Corporate",
      background: "#111827",
      strokeColor: "#60a5fa",
      strokeWidth: 2,
      roughness: 0.8,
      fillStyles: ['solid', 'hachure', 'dots', 'cross-hatch'],
      colors: ['#1e3a8a', '#1e40af', '#2563eb', '#3b82f6'],
      containerFill: '#1f2937',
      width: 450,
      height: 50
    },

    // Artistic Series (36-40)
    {
      id: 36,
      name: "Wild Brush",
      category: "Artistic",
      background: "#fffbeb",
      strokeColor: "#78350f",
      strokeWidth: 5,
      roughness: 4.0,
      fillStyles: ['hachure', 'cross-hatch', 'zigzag', 'dots'],
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#b45309'],
      bowing: 5,
      hachureGap: 3,
      width: 420,
      height: 65
    },
    {
      id: 37,
      name: "Sketch Book",
      category: "Artistic",
      background: "#fafaf9",
      strokeColor: "#18181b",
      strokeWidth: 3,
      roughness: 3.5,
      fillStyles: ['cross-hatch', 'hachure', 'cross-hatch', 'hachure'],
      colors: ['#71717a', '#52525b', '#3f3f46', '#27272a'],
      hachureAngle: -30,
      bowing: 3,
      width: 400,
      height: 58
    },
    {
      id: 38,
      name: "Paint Splash",
      category: "Artistic",
      background: "#fef3c7",
      strokeColor: "#7c2d12",
      strokeWidth: 4,
      roughness: 3.8,
      fillStyles: ['zigzag-line', 'dots', 'hachure', 'cross-hatch'],
      colors: ['#dc2626', '#ea580c', '#f59e0b', '#84cc16'],
      special: 'rounded-segments',
      bowing: 4,
      width: 460,
      height: 62
    },
    {
      id: 39,
      name: "Graffiti",
      category: "Artistic",
      background: "#18181b",
      strokeColor: "#f0abfc",
      strokeWidth: 6,
      roughness: 3.5,
      fillStyles: ['solid', 'zigzag', 'cross-hatch', 'dots'],
      colors: ['#e879f9', '#c084fc', '#a78bfa', '#818cf8'],
      containerFill: '#09090b',
      bowing: 2,
      width: 440,
      height: 68
    },
    {
      id: 40,
      name: "Watercolor",
      category: "Artistic",
      background: "#fefefe",
      strokeColor: "#6366f1",
      strokeWidth: 2,
      roughness: 2.5,
      fillStyles: ['dots', 'dots', 'dots', 'dots'],
      colors: ['#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1'],
      hachureGap: 10,
      special: 'no-internal-borders',
      width: 420,
      height: 55
    },

    // Tech Series (41-45)
    {
      id: 41,
      name: "Cyber Grid",
      category: "Tech",
      background: "#030712",
      strokeColor: "#14f195",
      strokeWidth: 2,
      roughness: 1.0,
      fillStyles: ['hachure', 'hachure', 'hachure', 'hachure'],
      colors: ['#064e3b', '#047857', '#10b981', '#14f195'],
      hachureGap: 2,
      hachureAngle: 90,
      containerFill: '#0a0a0a',
      width: 450,
      height: 48
    },
    {
      id: 42,
      name: "Digital Rain",
      category: "Tech",
      background: "#020617",
      strokeColor: "#22d3ee",
      strokeWidth: 1.5,
      roughness: 1.2,
      fillStyles: ['zigzag-line', 'cross-hatch', 'dots', 'hachure'],
      colors: ['#0c4a6e', '#075985', '#0369a1', '#0284c7'],
      containerFill: '#0f172a',
      width: 430,
      height: 46
    },
    {
      id: 43,
      name: "Hologram",
      category: "Tech",
      background: "#1e1b4b",
      strokeColor: "#c084fc",
      strokeWidth: 3,
      roughness: 1.5,
      fillStyles: ['solid', 'zigzag', 'cross-hatch', 'dots'],
      colors: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'],
      bowing: 1,
      special: 'double-border',
      width: 470,
      height: 54
    },
    {
      id: 44,
      name: "Circuit Board",
      category: "Tech",
      background: "#134e4a",
      strokeColor: "#5eead4",
      strokeWidth: 2.5,
      roughness: 0.8,
      fillStyles: ['dots', 'hachure', 'solid', 'cross-hatch'],
      colors: ['#115e59', '#0f766e', '#0d9488', '#14b8a6'],
      hachureGap: 4,
      width: 410,
      height: 50
    },
    {
      id: 45,
      name: "Quantum",
      category: "Tech",
      background: "#0a0a0a",
      strokeColor: "#fbbf24",
      strokeWidth: 2,
      roughness: 1.8,
      fillStyles: ['cross-hatch', 'zigzag-line', 'hachure', 'dots'],
      colors: ['#713f12', '#92400e', '#b45309', '#d97706'],
      containerFill: '#171717',
      hachureAngle: 45,
      width: 440,
      height: 52
    },

    // Seasonal Series (46-50)
    {
      id: 46,
      name: "Spring Bloom",
      category: "Seasonal",
      background: "#fef1f2",
      strokeColor: "#be123c",
      strokeWidth: 2,
      roughness: 1.2,
      fillStyles: ['dots', 'zigzag', 'hachure', 'cross-hatch'],
      colors: ['#fda4af', '#fb7185', '#f43f5e', '#e11d48'],
      hachureGap: 5,
      width: 420,
      height: 48
    },
    {
      id: 47,
      name: "Summer Sun",
      category: "Seasonal",
      background: "#fffbeb",
      strokeColor: "#d97706",
      strokeWidth: 3,
      roughness: 1.5,
      fillStyles: ['solid', 'zigzag-line', 'dots', 'hachure'],
      colors: ['#fed7aa', '#fdba74', '#fb923c', '#f97316'],
      bowing: 1.5,
      width: 440,
      height: 54
    },
    {
      id: 48,
      name: "Autumn Harvest",
      category: "Seasonal",
      background: "#fefce8",
      strokeColor: "#854d0e",
      strokeWidth: 2.5,
      roughness: 2.0,
      fillStyles: ['hachure', 'cross-hatch', 'zigzag', 'dots'],
      colors: ['#ca8a04', '#a16207', '#854d0e', '#713f12'],
      hachureAngle: -45,
      width: 400,
      height: 50
    },
    {
      id: 49,
      name: "Winter Frost",
      category: "Seasonal",
      background: "#f0f9ff",
      strokeColor: "#0369a1",
      strokeWidth: 2,
      roughness: 1.0,
      fillStyles: ['dots', 'solid', 'hachure', 'cross-hatch'],
      colors: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8'],
      containerFill: '#ffffff',
      hachureGap: 8,
      width: 430,
      height: 46
    },
    {
      id: 50,
      name: "Rainbow Pride",
      category: "Seasonal",
      background: "#faf5ff",
      strokeColor: "#7c3aed",
      strokeWidth: 3,
      roughness: 1.8,
      fillStyles: ['solid', 'zigzag', 'cross-hatch', 'dots'],
      colors: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'],
      bowing: 2,
      special: 'rounded-segments',
      width: 460,
      height: 56
    }
  ];

  // Group themes by category
  const themesByCategory = themes.reduce((acc, theme) => {
    if (!acc[theme.category]) acc[theme.category] = [];
    acc[theme.category].push(theme);
    return acc;
  }, {} as Record<string, BarTheme[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            50 Progress Bar Designs
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl max-w-3xl mx-auto">
            A comprehensive showcase of hand-drawn progress bars using Rough.js, 
            demonstrating various styles, themes, and creative possibilities.
          </p>
        </div>

        <div className="space-y-12">
          {Object.entries(themesByCategory).map(([category, categoryThemes]) => (
            <div key={category}>
              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
                {category} Collection
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryThemes.map((theme) => (
                  <div
                    key={theme.id}
                    className="p-4 rounded-xl transition-all duration-300"
                    style={{ backgroundColor: theme.background }}
                  >
                    <RoughProgressBar
                      segments={segments}
                      theme={theme}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">
            Design System Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="bg-white/20 dark:bg-gray-700/30 p-4 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">50</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Designs</div>
            </div>
            <div className="bg-white/20 dark:bg-gray-700/30 p-4 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">10</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Categories</div>
            </div>
            <div className="bg-white/20 dark:bg-gray-700/30 p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">8</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Fill Patterns</div>
            </div>
            <div className="bg-white/20 dark:bg-gray-700/30 p-4 rounded-lg">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">0.3-4.0</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Roughness Range</div>
            </div>
            <div className="bg-white/20 dark:bg-gray-700/30 p-4 rounded-lg">
              <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">0.5-6px</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Stroke Widths</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 