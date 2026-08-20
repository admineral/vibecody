'use client';

import React, { useState, useEffect, useRef } from 'react';
import rough from 'roughjs';
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue, animate } from 'framer-motion';

interface Segment {
  label: string;
  value: number;
  color: string;
  fillStyle: 'hachure' | 'solid' | 'zigzag' | 'cross-hatch' | 'dots' | 'dashed' | 'zigzag-line';
}

interface Config {
  roughness: number;
  strokeWidth: number;
  bowing: number;
  hachureGap: number;
  hachureAngle: number;
  backgroundColor: string;
  strokeColor: string;
  containerFillColor: string;
  specialEffects: 'none' | 'double-border' | 'rounded-segments' | 'no-internal-borders';
}

interface AnimationConfig {
  type: 'none' | 'liquid-fill' | 'wave-fill' | 'pulse' | 'shimmer' | 'typewriter';
  speed: number;
  enabled: boolean;
  fillSpeed: number;
}

// Category configurations
const categoryConfigs = {
  minimal: {
    roughness: [0.3, 0.8],
    strokeWidth: [1, 2],
    bowing: [0.5, 1.5],
    backgrounds: ['#f8f9fa', '#ffffff', '#f1f3f4'],
    strokes: ['#6c757d', '#495057', '#343a40'],
    colors: ['#e9ecef', '#dee2e6', '#ced4da', '#adb5bd']
  },
  neon: {
    roughness: [1.5, 3.0],
    strokeWidth: [2, 4],
    bowing: [2, 4],
    backgrounds: ['#0d1117', '#161b22', '#21262d'],
    strokes: ['#f0f6fc', '#c9d1d9', '#8b949e'],
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57']
  },
  artistic: {
    roughness: [2.5, 4.0],
    strokeWidth: [3, 6],
    bowing: [3, 5],
    backgrounds: ['#fef7ed', '#f9fafb', '#f3f4f6'],
    strokes: ['#92400e', '#1f2937', '#374151'],
    colors: ['#fbbf24', '#f59e0b', '#d97706', '#b45309']
  }
};

// Default configurations
const defaultConfig: Config = {
  roughness: 2.0,
  strokeWidth: 2,
  bowing: 1.5,
  hachureGap: 8,
  hachureAngle: -45,
  backgroundColor: '#0d1117',
  strokeColor: '#f0f6fc',
  containerFillColor: '#21262d',
  specialEffects: 'none'
};

const defaultSegments: Segment[] = [
  { label: 'System', value: 20, color: '#ff6b6b', fillStyle: 'hachure' },
  { label: 'Tools', value: 15, color: '#4ecdc4', fillStyle: 'zigzag' },
  { label: 'Thinking', value: 20, color: '#45b7d1', fillStyle: 'cross-hatch' },
  { label: 'Data', value: 45, color: '#96ceb4', fillStyle: 'dots' }
];

// Animated counter component
const AnimatedCounter = ({ value, duration = 0.5 }: { value: number; duration?: number }) => {
  const springValue = useSpring(value, { duration: duration * 1000 });
  const rounded = useTransform(springValue, (latest) => Math.round(latest * 10) / 10);
  
  return <motion.span>{rounded}</motion.span>;
};

// Animated progress bar component with liquid animations
const AnimatedProgressBar = ({ 
  segments, 
  config, 
  animationConfig,
  width = 600, 
  height = 80 
}: { 
  segments: Segment[]; 
  config: Config; 
  animationConfig: AnimationConfig;
  width?: number; 
  height?: number; 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationProgress = useMotionValue(0);
  const [animatedSegments, setAnimatedSegments] = useState(segments);
  const [displaySegments, setDisplaySegments] = useState(segments);
  const previousSegmentsRef = useRef(segments);

  // Fill animation when segment values change
  useEffect(() => {
    const hasValuesChanged = segments.some((seg, index) => {
      const prevSeg = previousSegmentsRef.current[index];
      return !prevSeg || seg.value !== prevSeg.value;
    });

    if (hasValuesChanged) {
      // Animate from current display values to new target values
      const startValues = displaySegments.map(seg => seg.value);
      const targetValues = segments.map(seg => seg.value);
      
      const fillDuration = (2.5 - animationConfig.fillSpeed) * 800 + 200; // 200ms to 2200ms range
      
      animate(0, 1, {
        duration: fillDuration / 1000,
        ease: "easeOut",
        onUpdate: (progress) => {
          const newSegments = segments.map((seg, index) => {
            const startValue = startValues[index] || 0;
            const targetValue = targetValues[index];
            const currentValue = startValue + (targetValue - startValue) * progress;
            
            return {
              ...seg,
              value: currentValue
            };
          });
          setDisplaySegments(newSegments);
        },
        onComplete: () => {
          setDisplaySegments(segments);
        }
      });
    } else {
      // No value changes, just update other properties immediately
      setDisplaySegments(segments);
    }

    previousSegmentsRef.current = segments;
  }, [segments, animationConfig.fillSpeed]);

  // Loop animations (existing functionality)
  useEffect(() => {
    if (!animationConfig.enabled || animationConfig.type === 'none') {
      setAnimatedSegments(displaySegments);
      return;
    }

    let animationId: number;

    const runAnimation = () => {
      // Fix speed calculation - higher speed = faster animation
      const duration = (6 - animationConfig.speed) * 800; // More responsive speed control

      switch (animationConfig.type) {
        case 'liquid-fill':
          // Smooth liquid filling animation
          animate(animationProgress, [0, 1], {
            duration: duration / 1000,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            onUpdate: (progress) => {
              const newSegments = displaySegments.map(seg => ({
                ...seg,
                value: seg.value * (0.1 + 0.9 * progress) // Prevent complete disappearance
              }));
              setAnimatedSegments(newSegments);
            }
          });
          break;

        case 'wave-fill':
          // Wave-like filling with sine wave
          const startTime = Date.now();
          const updateWave = () => {
            const elapsed = (Date.now() - startTime) / duration;
            const waveProgress = (Math.sin(elapsed * Math.PI * 2) + 1) / 2;
            
            const newSegments = displaySegments.map((seg, index) => ({
              ...seg,
              value: seg.value * (0.2 + 0.8 * waveProgress) * (1 + Math.sin(elapsed * Math.PI * 4 + index) * 0.15)
            }));
            setAnimatedSegments(newSegments);
            
            animationId = requestAnimationFrame(updateWave);
          };
          updateWave();
          break;

        case 'typewriter':
          // Segments fill one by one
          animate(animationProgress, [0, 1], {
            duration: duration / 1000,
            ease: "linear",
            repeat: Infinity,
            onUpdate: (progress) => {
              const totalSegments = displaySegments.length;
              const currentSegment = Math.floor(progress * totalSegments);
              const segmentProgress = (progress * totalSegments) % 1;
              
              const newSegments = displaySegments.map((seg, index) => {
                if (index < currentSegment) return seg;
                if (index === currentSegment) return { ...seg, value: seg.value * segmentProgress };
                return { ...seg, value: 0 };
              });
              setAnimatedSegments(newSegments);
            }
          });
          break;

        case 'pulse':
          // Pulsing effect
          animate(animationProgress, [0, 1], {
            duration: duration / 1500,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            onUpdate: (progress) => {
              const scale = 0.7 + 0.6 * progress;
              const newSegments = displaySegments.map(seg => ({
                ...seg,
                value: seg.value * scale
              }));
              setAnimatedSegments(newSegments);
            }
          });
          break;

        case 'shimmer':
          // Shimmer effect with color changes
          const shimmerStart = Date.now();
          const updateShimmer = () => {
            const elapsed = (Date.now() - shimmerStart) / (duration / 3);
            const shimmerProgress = (Math.sin(elapsed * Math.PI * 2) + 1) / 2;
            
            const newSegments = displaySegments.map((seg, index) => {
              // Convert hex to HSL for better color manipulation
              const r = parseInt(seg.color.slice(1, 3), 16);
              const g = parseInt(seg.color.slice(3, 5), 16);
              const b = parseInt(seg.color.slice(5, 7), 16);
              
              // Simple hue shift
              const hueShift = Math.sin(elapsed + index) * 30;
              const newColor = `hsl(${(r + g + b) / 3 + hueShift}, 70%, ${50 + shimmerProgress * 20}%)`;
              
              return {
                ...seg,
                color: newColor
              };
            });
            setAnimatedSegments(newSegments);
            
            animationId = requestAnimationFrame(updateShimmer);
          };
          updateShimmer();
          break;
      }
    };

    runAnimation();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      animationProgress.stop();
    };
  }, [displaySegments, animationConfig, animationProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up rough.js
    const rc = rough.canvas(canvas);
    
    // Use animatedSegments for rendering (either from loop animations or fill animations)
    const segmentsToRender = animationConfig.enabled && animationConfig.type !== 'none' ? animatedSegments : displaySegments;
    
    // Calculate positions with animation-friendly values
    const totalValue = segmentsToRender.reduce((sum, seg) => sum + seg.value, 0);
    if (totalValue === 0) return;
    
    const barWidth = width - 40;
    const barHeight = height - 40;
    const startX = 20;
    const startY = 20;
    
    let currentX = startX;
    
    // Draw container
    rc.rectangle(startX, startY, barWidth, barHeight, {
      stroke: config.strokeColor,
      strokeWidth: config.strokeWidth,
      roughness: config.roughness,
      bowing: config.bowing,
      fill: config.containerFillColor,
      fillStyle: 'solid'
    });
    
    // Draw segments with smooth transitions
    segmentsToRender.forEach((segment, index) => {
      const segmentWidth = (segment.value / totalValue) * barWidth;
      
      if (segmentWidth > 0) {
        // Add animation-specific effects
        let effectiveColor = segment.color;
        let effectiveRoughness = config.roughness;
        
        if (animationConfig.enabled && animationConfig.type === 'shimmer') {
          effectiveRoughness = config.roughness * (0.5 + Math.random() * 0.5);
        }
        
        rc.rectangle(currentX, startY, segmentWidth, barHeight, {
          fill: effectiveColor,
          fillStyle: segment.fillStyle,
          stroke: config.specialEffects === 'no-internal-borders' && index > 0 ? 'transparent' : config.strokeColor,
          strokeWidth: config.strokeWidth,
          roughness: effectiveRoughness,
          bowing: config.bowing,
          hachureGap: config.hachureGap,
          hachureAngle: config.hachureAngle
        });
        
        // Add special effects
        if (config.specialEffects === 'double-border') {
          rc.rectangle(currentX + 2, startY + 2, segmentWidth - 4, barHeight - 4, {
            stroke: effectiveColor,
            strokeWidth: 1,
            roughness: config.roughness * 0.5,
            fill: 'transparent'
          });
        }
        
        currentX += segmentWidth;
      }
    });
  }, [animatedSegments, displaySegments, config, width, height, animationConfig]);

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg shadow-sm"
      />
      
      {/* Animation indicator */}
      {animationConfig.enabled && animationConfig.type !== 'none' && (
        <motion.div
          className="absolute top-2 right-2 bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {animationConfig.type.replace('-', ' ')}
        </motion.div>
      )}
    </motion.div>
  );
};

export default function LimuxAnimatedEditor() {
  const [segments, setSegments] = useState<Segment[]>(defaultSegments);
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [animationConfig, setAnimationConfig] = useState<AnimationConfig>({
    type: 'none',
    speed: 2.5,
    enabled: false,
    fillSpeed: 1.0
  });

  // Track user modifications
  const [userModifications, setUserModifications] = useState<{
    config: Partial<Config>;
    segments: Partial<Segment>[];
  }>({
    config: {},
    segments: []
  });

  const totalPercentage = segments.reduce((sum, seg) => sum + seg.value, 0);
  const isNearHundred = Math.abs(totalPercentage - 100) < 1;

  const addSegment = () => {
    const newSegment: Segment = {
      label: `Segment ${segments.length + 1}`,
      value: 10,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      fillStyle: 'hachure'
    };
    setSegments([...segments, newSegment]);
  };

  const removeSegment = (index: number) => {
    if (segments.length > 1) {
      setSegments(segments.filter((_, i) => i !== index));
    }
  };

  const updateSegment = (index: number, field: keyof Segment, value: any) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setSegments(newSegments);
    
    // Track user modifications
    const newUserSegments = [...userModifications.segments];
    newUserSegments[index] = { ...newUserSegments[index], [field]: value };
    setUserModifications(prev => ({ ...prev, segments: newUserSegments }));
  };

  const updateConfig = (field: keyof Config, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    
    // Track user modifications
    setUserModifications(prev => ({
      ...prev,
      config: { ...prev.config, [field]: value }
    }));
  };

  const normalizePercentages = () => {
    const total = segments.reduce((sum, seg) => sum + seg.value, 0);
    if (total === 0) return;
    
    const normalizedSegments = segments.map(seg => ({
      ...seg,
      value: Math.round((seg.value / total) * 100)
    }));
    setSegments(normalizedSegments);
  };

  const loadPreset = (category: keyof typeof categoryConfigs) => {
    const preset = categoryConfigs[category];
    
    // Apply preset but preserve user modifications
    const newConfig = {
      roughness: userModifications.config.roughness ?? (preset.roughness[0] + Math.random() * (preset.roughness[1] - preset.roughness[0])),
      strokeWidth: userModifications.config.strokeWidth ?? (preset.strokeWidth[0] + Math.random() * (preset.strokeWidth[1] - preset.strokeWidth[0])),
      bowing: userModifications.config.bowing ?? (preset.bowing[0] + Math.random() * (preset.bowing[1] - preset.bowing[0])),
      backgroundColor: userModifications.config.backgroundColor ?? preset.backgrounds[Math.floor(Math.random() * preset.backgrounds.length)],
      strokeColor: userModifications.config.strokeColor ?? preset.strokes[Math.floor(Math.random() * preset.strokes.length)],
      containerFillColor: userModifications.config.containerFillColor ?? preset.backgrounds[Math.floor(Math.random() * preset.backgrounds.length)],
      hachureGap: userModifications.config.hachureGap ?? config.hachureGap,
      hachureAngle: userModifications.config.hachureAngle ?? config.hachureAngle,
      specialEffects: userModifications.config.specialEffects ?? config.specialEffects
    };
    
    setConfig(newConfig);
  };

  const resetToDefaults = () => {
    setConfig(defaultConfig);
    setSegments(defaultSegments);
    setAnimationConfig({
      type: 'none',
      speed: 2.5,
      enabled: false,
      fillSpeed: 1.0
    });
    setUserModifications({
      config: {},
      segments: []
    });
  };

  const exportConfig = () => {
    const exportData = {
      segments,
      config,
      animationConfig,
      metadata: {
        totalSegments: segments.length,
        totalPercentage,
        exportDate: new Date().toISOString()
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'animated-progress-bar-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: config.backgroundColor }}>
      <motion.div 
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 
          className="text-4xl font-bold text-center mb-8"
          style={{ color: config.strokeColor }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          🎨 Animated Progress Bar Editor
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Bar Display */}
          <motion.div 
            className="lg:col-span-2"
            layout
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl font-semibold mb-4" style={{ color: config.strokeColor }}>
                Live Preview
              </h2>
              
              <div className="flex flex-col items-center space-y-6">
                <AnimatedProgressBar 
                  segments={segments} 
                  config={config} 
                  animationConfig={animationConfig}
                />
                
                {/* Animation Controls */}
                <motion.div 
                  className="w-full bg-white/5 rounded-lg p-4"
                  layout
                >
                  <h3 className="text-lg font-semibold mb-3" style={{ color: config.strokeColor }}>
                    🎬 Animation Controls
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: config.strokeColor }}>
                        Animation Type
                      </label>
                      <motion.select
                        value={animationConfig.type}
                        onChange={(e) => setAnimationConfig(prev => ({ 
                          ...prev, 
                          type: e.target.value as any,
                          enabled: e.target.value !== 'none'
                        }))}
                        className="w-full px-3 py-2 bg-white/20 rounded-lg border border-white/30"
                        style={{ color: config.strokeColor }}
                        whileFocus={{ scale: 1.02 }}
                      >
                        <option value="none">None</option>
                        <option value="liquid-fill">Liquid Fill</option>
                        <option value="wave-fill">Wave Fill</option>
                        <option value="typewriter">Typewriter</option>
                        <option value="pulse">Pulse</option>
                        <option value="shimmer">Shimmer</option>
                      </motion.select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: config.strokeColor }}>
                        Loop Speed: <AnimatedCounter value={animationConfig.speed} />
                      </label>
                      <motion.input
                        type="range"
                        min="1"
                        max="5"
                        step="0.5"
                        value={animationConfig.speed}
                        onChange={(e) => setAnimationConfig(prev => ({ 
                          ...prev, 
                          speed: parseFloat(e.target.value) 
                        }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        whileFocus={{ scale: 1.05 }}
                        disabled={animationConfig.type === 'none'}
                      />
                      <div className="flex justify-between text-xs mt-1" style={{ color: config.strokeColor }}>
                        <span>Slow</span>
                        <span>Fast</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: config.strokeColor }}>
                        Fill Speed: <AnimatedCounter value={animationConfig.fillSpeed} />
                      </label>
                      <motion.input
                        type="range"
                        min="0.5"
                        max="2.5"
                        step="0.1"
                        value={animationConfig.fillSpeed}
                        onChange={(e) => setAnimationConfig(prev => ({ 
                          ...prev, 
                          fillSpeed: parseFloat(e.target.value) 
                        }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                        whileFocus={{ scale: 1.05 }}
                      />
                      <div className="flex justify-between text-xs mt-1" style={{ color: config.strokeColor }}>
                        <span>Slow</span>
                        <span>Fast</span>
                      </div>
                    </div>
                    
                    <div className="flex items-end">
                      <motion.button
                        onClick={() => setAnimationConfig(prev => ({ 
                          ...prev, 
                          enabled: !prev.enabled 
                        }))}
                        className={`w-full px-4 py-2 rounded-lg font-medium ${
                          animationConfig.enabled 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={animationConfig.type === 'none'}
                      >
                        {animationConfig.enabled ? '⏸️ Pause' : '▶️ Play'}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
                
                {/* Segment Labels */}
                <motion.div 
                  className="flex flex-wrap justify-center gap-4"
                  layout
                >
                  <AnimatePresence mode="popLayout">
                    {segments.map((segment, index) => (
                      <motion.div
                        key={`${segment.label}-${index}`}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-2"
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.3)' }}
                      >
                        <motion.div
                          className="w-4 h-4 rounded-full border-2"
                          style={{ 
                            backgroundColor: segment.color,
                            borderColor: config.strokeColor
                          }}
                          whileHover={{ scale: 1.2 }}
                          transition={{ duration: 0.2 }}
                        />
                        <span style={{ color: config.strokeColor }} className="text-sm font-medium">
                          {segment.label}: <AnimatedCounter value={segment.value} />%
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>

                {/* Total Percentage Indicator */}
                <motion.div 
                  className={`text-lg font-bold px-4 py-2 rounded-lg ${
                    isNearHundred ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                  animate={{ 
                    scale: isNearHundred ? [1, 1.1, 1] : 1,
                    backgroundColor: isNearHundred ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  Total: <AnimatedCounter value={totalPercentage} />%
                </motion.div>
              </div>

              {/* Configuration Summary */}
              <motion.div 
                className="mt-6 p-4 bg-white/5 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-lg font-semibold mb-2" style={{ color: config.strokeColor }}>
                  Configuration
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Segments:</span>
                    <div className="font-mono" style={{ color: config.strokeColor }}>
                      <AnimatedCounter value={segments.length} />
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Roughness:</span>
                    <div className="font-mono" style={{ color: config.strokeColor }}>
                      <AnimatedCounter value={config.roughness} />
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Animation:</span>
                    <div className="font-mono" style={{ color: config.strokeColor }}>
                      {animationConfig.type}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Speed:</span>
                    <div className="font-mono" style={{ color: config.strokeColor }}>
                      <AnimatedCounter value={animationConfig.speed} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Controls Panel */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {/* Quick Presets */}
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: config.strokeColor }}>
                🎯 Quick Presets
              </h3>
              <div className="space-y-2">
                {Object.keys(categoryConfigs).map((category) => (
                  <motion.button
                    key={category}
                    onClick={() => loadPreset(category as keyof typeof categoryConfigs)}
                    className="w-full px-4 py-2 bg-white/20 rounded-lg text-left capitalize transition-colors"
                    style={{ color: config.strokeColor }}
                    whileHover={{ 
                      scale: 1.02,
                      backgroundColor: 'rgba(255,255,255,0.3)' 
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.1 }}
                  >
                    {category}
                  </motion.button>
                ))}
                
                <motion.button
                  onClick={resetToDefaults}
                  className="w-full px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg font-medium mt-2"
                  whileHover={{ 
                    scale: 1.02,
                    backgroundColor: 'rgba(245, 158, 11, 0.3)' 
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                >
                  🔄 Reset to Defaults
                </motion.button>
              </div>
            </motion.div>

            {/* Style Controls */}
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              layout
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: config.strokeColor }}>
                ⚙️ Style Controls
              </h3>
              
              <div className="space-y-4">
                {/* Roughness */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: config.strokeColor }}>
                    Roughness: <AnimatedCounter value={config.roughness} />
                  </label>
                  <motion.input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={config.roughness}
                    onChange={(e) => updateConfig('roughness', parseFloat(e.target.value))}
                    className="w-full"
                    whileFocus={{ scale: 1.05 }}
                    transition={{ duration: 0.1 }}
                  />
                </div>

                {/* Stroke Width */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: config.strokeColor }}>
                    Stroke Width: <AnimatedCounter value={config.strokeWidth} />px
                  </label>
                  <motion.input
                    type="range"
                    min="0.5"
                    max="8"
                    step="0.5"
                    value={config.strokeWidth}
                    onChange={(e) => updateConfig('strokeWidth', parseFloat(e.target.value))}
                    className="w-full"
                    whileFocus={{ scale: 1.05 }}
                  />
                </div>

                {/* Bowing */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: config.strokeColor }}>
                    Bowing: <AnimatedCounter value={config.bowing} />
                  </label>
                  <motion.input
                    type="range"
                    min="0"
                    max="6"
                    step="0.1"
                    value={config.bowing}
                    onChange={(e) => updateConfig('bowing', parseFloat(e.target.value))}
                    className="w-full"
                    whileFocus={{ scale: 1.05 }}
                  />
                </div>

                {/* Hachure Gap */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: config.strokeColor }}>
                    Hachure Gap: <AnimatedCounter value={config.hachureGap} />px
                  </label>
                  <motion.input
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={config.hachureGap}
                    onChange={(e) => updateConfig('hachureGap', parseInt(e.target.value))}
                    className="w-full"
                    whileFocus={{ scale: 1.05 }}
                  />
                </div>

                {/* Hachure Angle */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: config.strokeColor }}>
                    Hachure Angle: <AnimatedCounter value={config.hachureAngle} />°
                  </label>
                  <motion.input
                    type="range"
                    min="-90"
                    max="90"
                    step="5"
                    value={config.hachureAngle}
                    onChange={(e) => updateConfig('hachureAngle', parseInt(e.target.value))}
                    className="w-full"
                    whileFocus={{ scale: 1.05 }}
                  />
                </div>

                {/* Special Effects */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: config.strokeColor }}>
                    Special Effects
                  </label>
                  <motion.select
                    value={config.specialEffects}
                    onChange={(e) => updateConfig('specialEffects', e.target.value as any)}
                    className="w-full px-3 py-2 bg-white/20 rounded-lg border border-white/30"
                    style={{ color: config.strokeColor }}
                    whileFocus={{ scale: 1.02 }}
                  >
                    <option value="none">None</option>
                    <option value="double-border">Double Border</option>
                    <option value="rounded-segments">Rounded Segments</option>
                    <option value="no-internal-borders">No Internal Borders</option>
                  </motion.select>
                </div>
              </div>
            </motion.div>

            {/* Color Controls */}
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              layout
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: config.strokeColor }}>
                🎨 Colors
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: config.strokeColor }}>
                    Background Color
                  </label>
                  <motion.input
                    type="color"
                    value={config.backgroundColor}
                    onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                    className="w-full h-10 rounded-lg border border-white/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: config.strokeColor }}>
                    Stroke Color
                  </label>
                  <motion.input
                    type="color"
                    value={config.strokeColor}
                    onChange={(e) => updateConfig('strokeColor', e.target.value)}
                    className="w-full h-10 rounded-lg border border-white/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: config.strokeColor }}>
                    Container Fill
                  </label>
                  <motion.input
                    type="color"
                    value={config.containerFillColor}
                    onChange={(e) => updateConfig('containerFillColor', e.target.value)}
                    className="w-full h-10 rounded-lg border border-white/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Segment Management */}
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              layout
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold" style={{ color: config.strokeColor }}>
                  📊 Segments
                </h3>
                <div className="flex space-x-2">
                  <motion.button
                    onClick={addSegment}
                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm"
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(34, 197, 94, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    + Add
                  </motion.button>
                  <motion.button
                    onClick={normalizePercentages}
                    className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm"
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Normalize
                  </motion.button>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {segments.map((segment, index) => (
                    <motion.div
                      key={`segment-${index}`}
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="p-4 bg-white/5 rounded-lg border border-white/10"
                      layout
                    >
                      <div className="space-y-4">
                        {/* Label and Remove Button */}
                        <div className="flex justify-between items-start">
                          <motion.input
                            type="text"
                            value={segment.label}
                            onChange={(e) => updateSegment(index, 'label', e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 rounded border border-white/20 text-sm font-medium"
                            style={{ color: config.strokeColor }}
                            whileFocus={{ scale: 1.02 }}
                            placeholder={`Segment ${index + 1}`}
                          />
                          {segments.length > 1 && (
                            <motion.button
                              onClick={() => removeSegment(index)}
                              className="ml-3 px-3 py-2 bg-red-500/20 text-red-400 rounded text-sm font-medium"
                              whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.3)' }}
                              whileTap={{ scale: 0.9 }}
                            >
                              Remove
                            </motion.button>
                          )}
                        </div>

                        {/* Value Slider - The main feature that was missing! */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium" style={{ color: config.strokeColor }}>
                              Value
                            </label>
                            <span className="text-sm font-mono px-2 py-1 bg-white/10 rounded" style={{ color: config.strokeColor }}>
                              <AnimatedCounter value={segment.value} />%
                            </span>
                          </div>
                          
                          {/* The nice slider that was removed */}
                          <motion.input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={segment.value}
                            onChange={(e) => updateSegment(index, 'value', parseInt(e.target.value))}
                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            style={{
                              background: `linear-gradient(to right, ${segment.color} 0%, ${segment.color} ${segment.value}%, #374151 ${segment.value}%, #374151 100%)`
                            }}
                            whileFocus={{ scale: 1.02 }}
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.1 }}
                          />
                          
                          {/* Number input for precise control */}
                          <motion.input
                            type="number"
                            min="0"
                            max="100"
                            value={segment.value}
                            onChange={(e) => updateSegment(index, 'value', parseInt(e.target.value) || 0)}
                            className="w-full mt-2 px-3 py-2 bg-white/10 rounded border border-white/20 text-sm text-center font-mono"
                            style={{ color: config.strokeColor }}
                            whileFocus={{ scale: 1.02 }}
                            placeholder="0-100"
                          />
                        </div>

                        {/* Color and Fill Style */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: config.strokeColor }}>
                              Color
                            </label>
                            <motion.input
                              type="color"
                              value={segment.color}
                              onChange={(e) => updateSegment(index, 'color', e.target.value)}
                              className="w-full h-10 rounded border border-white/20 cursor-pointer"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: config.strokeColor }}>
                              Fill Style
                            </label>
                            <motion.select
                              value={segment.fillStyle}
                              onChange={(e) => updateSegment(index, 'fillStyle', e.target.value)}
                              className="w-full px-3 py-2 bg-white/10 rounded border border-white/20 text-sm"
                              style={{ color: config.strokeColor }}
                              whileFocus={{ scale: 1.02 }}
                            >
                              <option value="hachure">Hachure</option>
                              <option value="solid">Solid</option>
                              <option value="zigzag">Zigzag</option>
                              <option value="cross-hatch">Cross Hatch</option>
                              <option value="dots">Dots</option>
                              <option value="dashed">Dashed</option>
                              <option value="zigzag-line">Zigzag Line</option>
                            </motion.select>
                          </div>
                        </div>

                        {/* Segment Preview */}
                        <motion.div 
                          className="h-4 rounded border border-white/20 overflow-hidden"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div 
                            className="h-full transition-all duration-300"
                            style={{ 
                              width: `${segment.value}%`,
                              backgroundColor: segment.color,
                              opacity: 0.8
                            }}
                          />
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Export */}
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: config.strokeColor }}>
                💾 Export
              </h3>
              <motion.button
                onClick={exportConfig}
                className="w-full px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg font-medium"
                whileHover={{ 
                  scale: 1.02,
                  backgroundColor: 'rgba(59, 130, 246, 0.3)' 
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
              >
                📥 Export Configuration
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 