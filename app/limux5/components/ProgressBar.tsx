'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import rough from 'roughjs';
import { ProgressBarProps } from '../types';

export default function ProgressBar({ config }: ProgressBarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Create rough canvas
    const rc = rough.canvas(canvas);

    // Draw container background
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Calculate dimensions
    const padding = 20;
    const barWidth = rect.width - (padding * 2);
    const barHeight = 60;
    const barX = padding;
    const barY = (rect.height - barHeight) / 2;

    // Draw container
    rc.rectangle(barX, barY, barWidth, barHeight, {
      stroke: config.strokeColor,
      strokeWidth: config.strokeWidth,
      roughness: config.roughness,
      fill: config.containerColor,
      fillStyle: 'solid'
    });

    // Draw segments
    let currentX = barX;
    const total = config.segments.reduce((sum, seg) => sum + seg.value, 0);

    config.segments.forEach((segment) => {
      const segmentWidth = (segment.value / total) * barWidth;
      
      if (segmentWidth > 2) { // Only draw if segment is visible
        rc.rectangle(currentX, barY, segmentWidth, barHeight, {
          stroke: config.strokeColor,
          strokeWidth: config.strokeWidth,
          roughness: config.roughness,
          fill: segment.color,
          fillStyle: 'solid'
        });
      }
      
      currentX += segmentWidth;
    });

  }, [config]);

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-32 border border-gray-200 rounded-lg bg-white"
          style={{ width: '100%', height: '128px' }}
        />
      </motion.div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {config.segments.map((segment, index) => (
          <motion.div
            key={`${segment.label}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2 text-sm"
          >
            <div
              className="w-3 h-3 rounded-sm border"
              style={{ 
                backgroundColor: segment.color,
                borderColor: config.strokeColor
              }}
            />
            <span className="text-gray-700 font-medium">
              {segment.label}
            </span>
            <span className="text-gray-500 ml-auto">
              {segment.value.toFixed(1)}%
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 