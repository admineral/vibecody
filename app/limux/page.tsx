'use client';

import React, { useEffect, useRef } from 'react';
import rough from 'roughjs';

interface BarTheme {
  name: string;
  background: string;
  containerColor: string;
  strokeColor: string;
  strokeWidth: number;
  roughness: number;
  fillStyles: string[];
  colors: string[];
  containerFill?: string;
  bowing?: number;
  hachureGap?: number;
  hachureAngle?: number;
}

const RoughProgressBar = ({ 
  segments, 
  theme,
  width = 500,
  height = 60,
  className = ""
}: { 
  segments: Array<{
    label: string;
    percentage: number;
  }>;
  theme: BarTheme;
  width?: number;
  height?: number;
  className?: string;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const rc = rough.svg(svgRef.current);
    const svg = svgRef.current;
    svg.innerHTML = '';

    // Create background
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', String(width));
    bgRect.setAttribute('height', String(height));
    bgRect.setAttribute('fill', theme.background);
    svg.appendChild(bgRect);

    // Draw container
    const container = rc.rectangle(10, 15, width - 20, height - 30, {
      stroke: theme.strokeColor,
      strokeWidth: theme.strokeWidth,
      fill: theme.containerFill || 'transparent',
      fillStyle: theme.containerFill ? 'solid' : undefined,
      roughness: theme.roughness,
      bowing: theme.bowing || 0
    });
    svg.appendChild(container);

    // Draw segments
    let currentX = 10;
    segments.forEach((segment, index) => {
      const segmentWidth = ((width - 20) * segment.percentage) / 100;
      const fillStyle = theme.fillStyles[index % theme.fillStyles.length];
      const color = theme.colors[index % theme.colors.length];
      
      const rect = rc.rectangle(currentX, 15, segmentWidth, height - 30, {
        stroke: theme.strokeColor,
        strokeWidth: theme.strokeWidth / 2,
        fill: color,
        fillStyle: fillStyle as any,
        hachureGap: theme.hachureGap || 4,
        hachureAngle: theme.hachureAngle || -45,
        roughness: theme.roughness * 0.8,
        bowing: theme.bowing || 0
      });
      svg.appendChild(rect);

      // Add subtle text
      if (segmentWidth > 40) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', String(currentX + segmentWidth / 2));
        text.setAttribute('y', String(height / 2 + 3));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-family', 'Arial, sans-serif');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-weight', '500');
        text.setAttribute('fill', theme.strokeColor);
        text.setAttribute('opacity', '0.7');
        text.textContent = `${segment.percentage}%`;
        svg.appendChild(text);
      }

      currentX += segmentWidth;
    });

  }, [segments, theme, width, height]);

  return (
    <div className={`${className}`}>
      <h3 className="text-sm font-bold mb-2" style={{ color: theme.strokeColor }}>
        {theme.name}
      </h3>
      <svg ref={svgRef} width={width} height={height} className="w-full h-auto rounded-lg shadow-lg"></svg>
    </div>
  );
};

export default function LimuxPage() {
  const segments = [
    { label: "System", percentage: 20 },
    { label: "Tools", percentage: 15 },
    { label: "Thinking", percentage: 20 },
    { label: "Data", percentage: 45 }
  ];

  const themes: BarTheme[] = [
    {
      name: "Midnight Neon",
      background: "#0a0a0a",
      containerColor: "#1a1a1a",
      strokeColor: "#00ffff",
      strokeWidth: 2,
      roughness: 1.2,
      fillStyles: ['hachure', 'cross-hatch', 'dots', 'zigzag'],
      colors: ['#ff006e', '#3a86ff', '#06ffa5', '#ffbe0b'],
      containerFill: '#0a0a0a',
      hachureGap: 3
    },
    {
      name: "Soft Pastel Dream",
      background: "#fef6e4",
      containerColor: "#ffffff",
      strokeColor: "#8b5cf6",
      strokeWidth: 3,
      roughness: 0.8,
      fillStyles: ['dots', 'dashed', 'zigzag-line', 'hachure'],
      colors: ['#fbbf24', '#f472b6', '#a78bfa', '#60a5fa'],
      containerFill: '#ffffff',
      bowing: 1,
      hachureGap: 6
    },
    {
      name: "Bold Monochrome",
      background: "#ffffff",
      containerColor: "#000000",
      strokeColor: "#000000",
      strokeWidth: 5,
      roughness: 2.5,
      fillStyles: ['hachure', 'hachure', 'hachure', 'hachure'],
      colors: ['#000000', '#333333', '#666666', '#999999'],
      hachureGap: 4,
      hachureAngle: 45
    },
    {
      name: "Ocean Depths",
      background: "#001e3c",
      containerColor: "#0a4481",
      strokeColor: "#90caf9",
      strokeWidth: 2,
      roughness: 1.5,
      fillStyles: ['zigzag', 'cross-hatch', 'dots', 'solid'],
      colors: ['#0077c2', '#00acc1', '#00897b', '#00695c'],
      containerFill: '#071a2f',
      hachureGap: 5
    },
    {
      name: "Sunset Gradient",
      background: "#1a0033",
      containerColor: "#330066",
      strokeColor: "#ff6b6b",
      strokeWidth: 3,
      roughness: 1.8,
      fillStyles: ['cross-hatch', 'zigzag', 'dots', 'hachure'],
      colors: ['#ff006e', '#ff4757', '#ff6348', '#ff9ff3'],
      containerFill: '#2d0052',
      bowing: 2
    },
    {
      name: "Minimalist Light",
      background: "#fafafa",
      containerColor: "#e0e0e0",
      strokeColor: "#424242",
      strokeWidth: 1,
      roughness: 0.5,
      fillStyles: ['solid', 'solid', 'solid', 'solid'],
      colors: ['#e3f2fd', '#e8f5e9', '#fff3e0', '#fce4ec'],
      hachureGap: 8
    },
    {
      name: "Cyberpunk Glitch",
      background: "#0d0d0d",
      containerColor: "#1a0033",
      strokeColor: "#ff00ff",
      strokeWidth: 4,
      roughness: 3.0,
      fillStyles: ['zigzag-line', 'cross-hatch', 'dashed', 'hachure'],
      colors: ['#ff00ff', '#00ffff', '#ffff00', '#ff0080'],
      containerFill: '#1a001a',
      bowing: 3,
      hachureGap: 2
    },
    {
      name: "Forest Moss",
      background: "#f1f8e9",
      containerColor: "#dcedc8",
      strokeColor: "#33691e",
      strokeWidth: 2,
      roughness: 1.3,
      fillStyles: ['dots', 'hachure', 'cross-hatch', 'zigzag'],
      colors: ['#689f38', '#558b2f', '#33691e', '#1b5e20'],
      containerFill: '#e8f5e9',
      hachureAngle: 60
    },
    {
      name: "Vintage Sketch",
      background: "#f5f5dc",
      containerColor: "#d2b48c",
      strokeColor: "#8b4513",
      strokeWidth: 3,
      roughness: 2.8,
      fillStyles: ['hachure', 'cross-hatch', 'hachure', 'cross-hatch'],
      colors: ['#8b4513', '#a0522d', '#cd853f', '#daa520'],
      bowing: 4,
      hachureGap: 7,
      hachureAngle: -60
    },
    {
      name: "Arctic Aurora",
      background: "#0a0e27",
      containerColor: "#1e3a5f",
      strokeColor: "#64ffda",
      strokeWidth: 2,
      roughness: 1.0,
      fillStyles: ['solid', 'dots', 'zigzag', 'cross-hatch'],
      colors: ['#64ffda', '#48d1cc', '#40e0d0', '#00ced1'],
      containerFill: '#0f172a',
      hachureGap: 4
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-white">
            Progress Bar Design Showcase
          </h1>
          <p className="text-gray-300 text-lg">
            10 Creative Hand-Drawn Progress Bars with Rough.js
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {themes.map((theme, index) => (
            <div 
              key={index} 
              className="p-6 rounded-xl transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: theme.background }}
            >
              <RoughProgressBar
                segments={segments}
                theme={theme}
                width={500}
                height={60}
              />
              <div className="mt-3 flex justify-between text-xs" style={{ color: theme.strokeColor }}>
                <span className="opacity-60">Roughness: {theme.roughness}</span>
                <span className="opacity-60">Stroke: {theme.strokeWidth}px</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white/10 backdrop-blur-lg p-8 rounded-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Design Elements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-300">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-white">Themes</h3>
              <ul className="space-y-1 text-sm">
                <li>• Dark themes (Midnight, Cyberpunk, Ocean)</li>
                <li>• Light themes (Pastel, Minimalist, Vintage)</li>
                <li>• Nature inspired (Forest, Arctic)</li>
                <li>• High contrast (Monochrome)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-white">Roughness Levels</h3>
              <ul className="space-y-1 text-sm">
                <li>• 0.5 - Ultra smooth</li>
                <li>• 1.0-1.5 - Subtle hand-drawn</li>
                <li>• 2.0-2.5 - Clearly sketched</li>
                <li>• 3.0 - Maximum roughness</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-white">Fill Patterns</h3>
              <ul className="space-y-1 text-sm">
                <li>• Hachure (classic lines)</li>
                <li>• Cross-hatch (crossed lines)</li>
                <li>• Dots (stippled effect)</li>
                <li>• Zigzag (wavy patterns)</li>
                <li>• Solid (filled shapes)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 