'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import ProgressBar from './components/ProgressBar';
import TokenCounter from './components/TokenCounter';
import ConfigImporter from './components/ConfigImporter';
import { ProgressConfig } from './types';

export default function LimuX5() {
  const [config, setConfig] = useState<ProgressConfig>({
    segments: [
      { label: 'System', value: 20, color: '#ef4444' },
      { label: 'Tools', value: 15, color: '#f97316' },
      { label: 'Thinking', value: 20, color: '#eab308' },
      { label: 'Data', value: 45, color: '#22c55e' }
    ],
    roughness: 1.5,
    strokeWidth: 2,
    backgroundColor: '#f8fafc',
    strokeColor: '#1e293b',
    containerColor: '#e2e8f0'
  });

  const [tokenData, setTokenData] = useState({
    tokens: 0,
    percentage: 0
  });

  const handleTokenChange = useCallback((tokens: number, percentage: number) => {
    setTokenData({ tokens, percentage });
    
    // Automatically adjust system prompt segment based on token usage
    setConfig(prevConfig => {
      const newSegments = [...prevConfig.segments];
      
      // Calculate new system segment value based on token usage
      // As tokens increase, system segment should decrease to make room
      const baseSystemValue = 20;
      const adjustment = Math.min(percentage * 0.3, 15); // Max 15% adjustment
      const newSystemValue = Math.max(baseSystemValue - adjustment, 5); // Min 5%
      
      // Find and update system segment
      const systemIndex = newSegments.findIndex(seg => seg.label === 'System');
      if (systemIndex !== -1) {
        const oldSystemValue = newSegments[systemIndex].value;
        const difference = oldSystemValue - newSystemValue;
        
        newSegments[systemIndex].value = newSystemValue;
        
        // Distribute the difference across other segments proportionally
        const otherSegments = newSegments.filter((_, i) => i !== systemIndex);
        const totalOtherValue = otherSegments.reduce((sum, seg) => sum + seg.value, 0);
        
        if (totalOtherValue > 0) {
          otherSegments.forEach((seg, i) => {
            const segmentIndex = newSegments.findIndex(s => s === seg);
            const proportion = seg.value / totalOtherValue;
            newSegments[segmentIndex].value += difference * proportion;
          });
        }
      }
      
      return {
        ...prevConfig,
        segments: newSegments
      };
    });
  }, []);

  const handleConfigImport = useCallback((importedConfig: ProgressConfig) => {
    setConfig(importedConfig);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl font-bold text-slate-900">
            LimuX v5
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Advanced progress visualization with token-aware system prompt adjustment
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Progress Bar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Memory Allocation
              </h2>
              <ProgressBar config={config} />
              
              {/* Token Impact Indicator */}
              {tokenData.tokens > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-700">
                      System prompt automatically adjusted based on {tokenData.tokens.toLocaleString()} tokens 
                      ({tokenData.percentage.toFixed(1)}% usage)
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Config Importer */}
            <ConfigImporter onConfigImport={handleConfigImport} />
          </motion.div>

          {/* Right Column - Token Counter */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TokenCounter 
              onTokenChange={handleTokenChange}
              className="h-full"
            />
          </motion.div>
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {config.segments.map((segment, index) => (
            <div
              key={segment.label}
              className="bg-white rounded-lg border border-slate-200 p-4 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                ></div>
                <span className="font-medium text-slate-900">{segment.label}</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {segment.value.toFixed(1)}%
              </div>
              {segment.label === 'System' && tokenData.tokens > 0 && (
                <div className="text-xs text-slate-500 mt-1">
                  Auto-adjusted
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-slate-500 text-sm"
        >
          <p>
            Token-aware progress visualization • Built with Next.js, Framer Motion, and gpt-tokenizer
          </p>
        </motion.div>
      </div>
    </div>
  );
} 