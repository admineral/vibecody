'use client';

import React, { useState, useEffect, useRef } from 'react';
import rough from 'roughjs';

interface BarConfig {
  background: string;
  strokeColor: string;
  strokeWidth: number;
  roughness: number;
  fillStyle: string;
  color: string;
  hachureGap: number;
  hachureAngle: number;
  bowing: number;
  containerFill?: string;
  special?: string;
}

interface CategoryConfig {
  name: string;
  backgroundColors: string[];
  strokeColors: string[];
  strokeWidths: number[];
  roughnessRange: [number, number];
  fillStyles: string[];
  colorPalettes: string[][];
  hachureGaps: number[];
  hachureAngles: number[];
  bowingRange: [number, number];
  containerFills?: string[];
  specials?: (string | undefined)[];
}

const categories: Record<string, CategoryConfig> = {
  minimal: {
    name: "Minimal",
    backgroundColors: ["#ffffff", "#fafafa", "#f5f5f5", "#f8f9fa", "#fefefe"],
    strokeColors: ["#e0e0e0", "#666666", "#343a40", "#9e9e9e", "#64748b"],
    strokeWidths: [0.5, 1, 1.5, 2],
    roughnessRange: [0.3, 0.8],
    fillStyles: ["solid", "hachure", "dots"],
    colorPalettes: [
      ["#f0f0f0", "#e8e8e8", "#e0e0e0", "#d8d8d8"],
      ["#4a90e2", "#7ed321", "#f5a623", "#d0021b"],
      ["#e1f5fe", "#b3e5fc", "#81d4fa", "#4fc3f7"],
      ["#f3f4f6", "#e5e7eb", "#d1d5db", "#9ca3af"]
    ],
    hachureGaps: [6, 8, 10, 12],
    hachureAngles: [-45, 0, 45],
    bowingRange: [0, 0.5],
    containerFills: ["transparent", "#ffffff", "#f9fafb"]
  },
  neon: {
    name: "Neon",
    backgroundColors: ["#0a0a0a", "#000814", "#1a0033", "#0d0d0d", "#1a1a2e"],
    strokeColors: ["#ff00ff", "#00ffff", "#ffaa00", "#00ff00", "#f39c12"],
    strokeWidths: [2, 2.5, 3, 3.5],
    roughnessRange: [1.2, 2.0],
    fillStyles: ["hachure", "cross-hatch", "dots", "zigzag", "zigzag-line"],
    colorPalettes: [
      ["#ff00ff", "#ff0080", "#ff0040", "#ff0000"],
      ["#001d3d", "#003566", "#006ba0", "#0099ff"],
      ["#ff006e", "#ff4757", "#ff6348", "#ff9ff3"],
      ["#003300", "#006600", "#009900", "#00ff00"],
      ["#e056fd", "#686de0", "#30336b", "#130f40"]
    ],
    hachureGaps: [2, 3, 4, 5],
    hachureAngles: [-60, -45, 45, 60, 90],
    bowingRange: [1, 2],
    containerFills: ["#1a0d1a", "#001233", "#2d0052", "#16213e", "#0a0a0a"]
  },
  pastel: {
    name: "Pastel",
    backgroundColors: ["#fff5f5", "#f0fdf4", "#faf5ff", "#fef3c7", "#f0f9ff"],
    strokeColors: ["#ff6b6b", "#22c55e", "#a855f7", "#f59e0b", "#0ea5e9"],
    strokeWidths: [1.5, 2, 2.5],
    roughnessRange: [0.5, 0.9],
    fillStyles: ["dots", "zigzag", "hachure", "cross-hatch", "solid"],
    colorPalettes: [
      ["#ffe0e0", "#ffc0cb", "#ffb6c1", "#ffa0a0"],
      ["#bbf7d0", "#86efac", "#4ade80", "#22c55e"],
      ["#e9d5ff", "#d8b4fe", "#c084fc", "#a855f7"],
      ["#fed7aa", "#fdba74", "#fb923c", "#f97316"],
      ["#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8"]
    ],
    hachureGaps: [5, 6, 7, 8],
    hachureAngles: [-30, 0, 30, 45],
    bowingRange: [0.5, 1.5],
    containerFills: ["transparent", "#ffffff", "#fffbf0"]
  },
  monochrome: {
    name: "Monochrome",
    backgroundColors: ["#ffffff", "#000000", "#f5f5f5", "#2b2b2b", "#fafafa"],
    strokeColors: ["#000000", "#ffffff", "#424242", "#e0e0e0", "#6b7280"],
    strokeWidths: [1, 2, 3, 4, 5],
    roughnessRange: [0.8, 2.5],
    fillStyles: ["hachure", "cross-hatch", "dots", "zigzag", "solid"],
    colorPalettes: [
      ["#000000", "#333333", "#666666", "#999999"],
      ["#ffffff", "#cccccc", "#999999", "#666666"],
      ["#e0e0e0", "#bdbdbd", "#9e9e9e", "#757575"],
      ["#4a4a4a", "#5a5a5a", "#6a6a6a", "#7a7a7a"],
      ["#f3f4f6", "#e5e7eb", "#d1d5db", "#9ca3af"]
    ],
    hachureGaps: [3, 4, 5, 6, 7],
    hachureAngles: [0, 45, 90, -45],
    bowingRange: [0, 1.5],
    containerFills: ["transparent", "#1a1a1a", "#f0f0f0"]
  },
  nature: {
    name: "Nature",
    backgroundColors: ["#f3f4f6", "#eff6ff", "#fefce8", "#fef3c7", "#f9fafb"],
    strokeColors: ["#065f46", "#1e40af", "#92400e", "#78350f", "#374151"],
    strokeWidths: [2, 2.5, 3, 3.5],
    roughnessRange: [1.5, 3.0],
    fillStyles: ["hachure", "cross-hatch", "dots", "zigzag", "solid"],
    colorPalettes: [
      ["#6ee7b7", "#34d399", "#10b981", "#059669"],
      ["#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8"],
      ["#fbbf24", "#f59e0b", "#d97706", "#b45309"],
      ["#fde68a", "#fcd34d", "#fbbf24", "#f59e0b"],
      ["#9ca3af", "#6b7280", "#4b5563", "#374151"]
    ],
    hachureGaps: [4, 5, 6, 7],
    hachureAngles: [-45, 0, 45, 60, 75],
    bowingRange: [1, 3],
    containerFills: ["transparent", "#f9fafb", "#fffbeb"]
  },
  retro: {
    name: "Retro",
    backgroundColors: ["#2d1b69", "#f4e4c1", "#4a148c", "#0f172a", "#fdf6e3"],
    strokeColors: ["#ff6ec7", "#5d4037", "#ffd600", "#22d3ee", "#704214"],
    strokeWidths: [1.5, 2, 3, 4],
    roughnessRange: [0.8, 2.8],
    fillStyles: ["solid", "zigzag", "cross-hatch", "dots", "hachure"],
    colorPalettes: [
      ["#ff6ec7", "#ff9472", "#ffd93d", "#6bcf7f"],
      ["#8d6e63", "#795548", "#6d4c41", "#5d4037"],
      ["#e91e63", "#9c27b0", "#3f51b5", "#00bcd4"],
      ["#0891b2", "#0e7490", "#155e75", "#164e63"],
      ["#d2b48c", "#bc9a6a", "#a0826d", "#8b7355"]
    ],
    hachureGaps: [2, 4, 6, 8],
    hachureAngles: [-60, -30, 30, 60, 75],
    bowingRange: [1, 2.5],
    containerFills: ["#1a0f3d", "#311b92", "transparent"],
    specials: ["double-border", undefined, undefined]
  },
  corporate: {
    name: "Corporate",
    backgroundColors: ["#f8fafc", "#ffffff", "#f0fdf4", "#fef2f2", "#111827"],
    strokeColors: ["#1e293b", "#64748b", "#15803d", "#991b1b", "#60a5fa"],
    strokeWidths: [1, 1.5, 1.8, 2],
    roughnessRange: [0.4, 0.8],
    fillStyles: ["solid", "hachure", "dots", "cross-hatch"],
    colorPalettes: [
      ["#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"],
      ["#cbd5e1", "#94a3b8", "#64748b", "#475569"],
      ["#86efac", "#4ade80", "#22c55e", "#16a34a"],
      ["#fca5a5", "#f87171", "#ef4444", "#dc2626"],
      ["#1e3a8a", "#1e40af", "#2563eb", "#3b82f6"]
    ],
    hachureGaps: [6, 8, 10],
    hachureAngles: [-45, 0, 45],
    bowingRange: [0, 0.5],
    containerFills: ["transparent", "#f9fafb", "#1f2937"]
  },
  artistic: {
    name: "Artistic",
    backgroundColors: ["#fffbeb", "#fafaf9", "#fef3c7", "#18181b", "#fefefe"],
    strokeColors: ["#78350f", "#18181b", "#7c2d12", "#f0abfc", "#6366f1"],
    strokeWidths: [2, 3, 4, 5, 6],
    roughnessRange: [2.5, 4.0],
    fillStyles: ["hachure", "cross-hatch", "zigzag", "dots", "zigzag-line"],
    colorPalettes: [
      ["#fbbf24", "#f59e0b", "#d97706", "#b45309"],
      ["#71717a", "#52525b", "#3f3f46", "#27272a"],
      ["#dc2626", "#ea580c", "#f59e0b", "#84cc16"],
      ["#e879f9", "#c084fc", "#a78bfa", "#818cf8"],
      ["#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1"]
    ],
    hachureGaps: [3, 5, 7, 10],
    hachureAngles: [-60, -30, 0, 30, 60],
    bowingRange: [2, 5],
    containerFills: ["transparent", "#09090b"],
    specials: ["rounded-segments", "no-internal-borders", undefined]
  },
  tech: {
    name: "Tech",
    backgroundColors: ["#030712", "#020617", "#1e1b4b", "#134e4a", "#0a0a0a"],
    strokeColors: ["#14f195", "#22d3ee", "#c084fc", "#5eead4", "#fbbf24"],
    strokeWidths: [1.5, 2, 2.5, 3],
    roughnessRange: [0.8, 1.8],
    fillStyles: ["hachure", "zigzag-line", "cross-hatch", "dots", "solid"],
    colorPalettes: [
      ["#064e3b", "#047857", "#10b981", "#14f195"],
      ["#0c4a6e", "#075985", "#0369a1", "#0284c7"],
      ["#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6"],
      ["#115e59", "#0f766e", "#0d9488", "#14b8a6"],
      ["#713f12", "#92400e", "#b45309", "#d97706"]
    ],
    hachureGaps: [2, 3, 4, 5],
    hachureAngles: [0, 45, 90, -45],
    bowingRange: [0.5, 1.5],
    containerFills: ["#0a0a0a", "#0f172a", "#171717"],
    specials: ["double-border", undefined]
  },
  seasonal: {
    name: "Seasonal",
    backgroundColors: ["#fef1f2", "#fffbeb", "#fefce8", "#f0f9ff", "#faf5ff"],
    strokeColors: ["#be123c", "#d97706", "#854d0e", "#0369a1", "#7c3aed"],
    strokeWidths: [2, 2.5, 3],
    roughnessRange: [1.0, 2.0],
    fillStyles: ["dots", "zigzag", "hachure", "cross-hatch", "solid", "zigzag-line"],
    colorPalettes: [
      ["#fda4af", "#fb7185", "#f43f5e", "#e11d48"],
      ["#fed7aa", "#fdba74", "#fb923c", "#f97316"],
      ["#ca8a04", "#a16207", "#854d0e", "#713f12"],
      ["#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8"],
      ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6"]
    ],
    hachureGaps: [5, 6, 7, 8],
    hachureAngles: [-45, 0, 45],
    bowingRange: [1, 2],
    containerFills: ["transparent", "#ffffff"],
    specials: ["rounded-segments", undefined]
  }
};

const getRandomFromArray = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInRange = (min: number, max: number): number => Math.random() * (max - min) + min;

const generateRandomBar = (category: CategoryConfig): BarConfig => {
  const palette = getRandomFromArray(category.colorPalettes);
  const fillStyles = Array(4).fill(null).map(() => getRandomFromArray(category.fillStyles));
  
  return {
    background: getRandomFromArray(category.backgroundColors),
    strokeColor: getRandomFromArray(category.strokeColors),
    strokeWidth: getRandomFromArray(category.strokeWidths),
    roughness: getRandomInRange(...category.roughnessRange),
    fillStyle: fillStyles.join(','),
    color: palette.join(','),
    hachureGap: getRandomFromArray(category.hachureGaps),
    hachureAngle: getRandomFromArray(category.hachureAngles),
    bowing: getRandomInRange(...category.bowingRange),
    containerFill: category.containerFills ? getRandomFromArray(category.containerFills) : undefined,
    special: category.specials ? getRandomFromArray(category.specials) : undefined
  };
};

const RoughProgressBar = ({ 
  segments, 
  config,
  index
}: { 
  segments: Array<{
    label: string;
    percentage: number;
  }>;
  config: BarConfig;
  index: number;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const width = 380;
  const height = 50;

  useEffect(() => {
    if (!svgRef.current) return;

    const rc = rough.svg(svgRef.current);
    const svg = svgRef.current;
    svg.innerHTML = '';

    // Background
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', String(width));
    bgRect.setAttribute('height', String(height));
    bgRect.setAttribute('fill', config.background);
    bgRect.setAttribute('rx', '6');
    svg.appendChild(bgRect);

    const padding = 10;
    const barHeight = height - (padding * 2);
    const barWidth = width - (padding * 2);

    // Special effects
    if (config.special === 'double-border') {
      const outerBorder = rc.rectangle(padding - 5, padding - 5, barWidth + 10, barHeight + 10, {
        stroke: config.strokeColor,
        strokeWidth: 1,
        fill: 'transparent',
        roughness: config.roughness * 0.5
      });
      svg.appendChild(outerBorder);
    }

    // Container
    const container = rc.rectangle(padding, padding, barWidth, barHeight, {
      stroke: config.strokeColor,
      strokeWidth: config.strokeWidth,
      fill: config.containerFill || 'transparent',
      fillStyle: config.containerFill ? 'solid' : undefined,
      roughness: config.roughness,
      bowing: config.bowing
    });
    svg.appendChild(container);

    // Parse arrays from comma-separated strings
    const fillStyles = config.fillStyle.split(',');
    const colors = config.color.split(',');

    // Segments
    let currentX = padding;
    segments.forEach((segment, idx) => {
      const segmentWidth = (barWidth * segment.percentage) / 100;
      const fillStyle = fillStyles[idx % fillStyles.length];
      const color = colors[idx % colors.length];
      
      if (config.special === 'rounded-segments' && idx > 0) {
        currentX += 3;
      }

      const rect = rc.rectangle(
        currentX, 
        padding, 
        segmentWidth - (config.special === 'rounded-segments' ? 3 : 0), 
        barHeight, 
        {
          stroke: config.special === 'no-internal-borders' ? 'transparent' : config.strokeColor,
          strokeWidth: config.strokeWidth * 0.5,
          fill: color,
          fillStyle: fillStyle as any,
          hachureGap: config.hachureGap,
          hachureAngle: config.hachureAngle,
          roughness: config.roughness * 0.8,
          bowing: config.bowing
        }
      );
      svg.appendChild(rect);

      currentX += segmentWidth;
    });

    // Index label
    const indexText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    indexText.setAttribute('x', '5');
    indexText.setAttribute('y', String(height - 2));
    indexText.setAttribute('font-family', 'system-ui');
    indexText.setAttribute('font-size', '9');
    indexText.setAttribute('fill', config.strokeColor);
    indexText.setAttribute('opacity', '0.5');
    indexText.textContent = `#${index + 1}`;
    svg.appendChild(indexText);

  }, [segments, config, index]);

  return (
    <div className="group cursor-pointer transition-all duration-300 hover:scale-105">
      <svg ref={svgRef} width={width} height={height} className="w-full h-auto rounded-lg shadow-lg"></svg>
    </div>
  );
};

export default function Limux3Page() {
  const [selectedCategory, setSelectedCategory] = useState<string>('minimal');
  const [generatedBars, setGeneratedBars] = useState<BarConfig[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const segments = [
    { label: "System", percentage: 20 },
    { label: "Tools", percentage: 15 },
    { label: "Thinking", percentage: 20 },
    { label: "Data", percentage: 45 }
  ];

  const generateBars = () => {
    setIsGenerating(true);
    const category = categories[selectedCategory];
    const newBars: BarConfig[] = [];
    
    for (let i = 0; i < 10; i++) {
      newBars.push(generateRandomBar(category));
    }
    
    setTimeout(() => {
      setGeneratedBars(newBars);
      setIsGenerating(false);
    }, 300);
  };

  // Generate initial bars
  useEffect(() => {
    generateBars();
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Random Progress Bar Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Select a category and generate 10 unique hand-drawn progress bars with random variations
          </p>
        </div>

        {/* Category Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Select Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(categories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedCategory === key
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="text-center mb-8">
          <button
            onClick={generateBars}
            disabled={isGenerating}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
              isGenerating
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl hover:scale-105 active:scale-95'
            }`}
          >
            {isGenerating ? 'Generating...' : 'Generate New Set'}
          </button>
        </div>

        {/* Generated Bars */}
        <div className={`transition-all duration-500 ${isGenerating ? 'opacity-50' : 'opacity-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generatedBars.map((config, index) => (
              <div
                key={index}
                className="p-4 rounded-xl transition-all duration-300"
                style={{ backgroundColor: config.background }}
              >
                <RoughProgressBar
                  segments={segments}
                  config={config}
                  index={index}
                />
                <div className="mt-2 text-xs opacity-60" style={{ color: config.strokeColor }}>
                  <div className="flex justify-between">
                    <span>Roughness: {config.roughness.toFixed(2)}</span>
                    <span>Stroke: {config.strokeWidth}px</span>
                    <span>Bowing: {config.bowing.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-12 bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">
            Current Category: {categories[selectedCategory].name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div>
              <strong>Roughness:</strong><br/>
              {categories[selectedCategory].roughnessRange[0].toFixed(1)} - {categories[selectedCategory].roughnessRange[1].toFixed(1)}
            </div>
            <div>
              <strong>Stroke Widths:</strong><br/>
              {Math.min(...categories[selectedCategory].strokeWidths)}px - {Math.max(...categories[selectedCategory].strokeWidths)}px
            </div>
            <div>
              <strong>Fill Styles:</strong><br/>
              {categories[selectedCategory].fillStyles.length} variations
            </div>
            <div>
              <strong>Color Palettes:</strong><br/>
              {categories[selectedCategory].colorPalettes.length} options
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 