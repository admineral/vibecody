'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfigImporterProps, ProgressConfig } from '../types';

export default function ConfigImporter({ onConfigImport }: ConfigImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateConfig = (config: any): config is ProgressConfig => {
    if (!config || typeof config !== 'object') return false;
    
    // Check required properties
    if (!Array.isArray(config.segments)) return false;
    if (typeof config.roughness !== 'number') return false;
    if (typeof config.strokeWidth !== 'number') return false;
    if (typeof config.backgroundColor !== 'string') return false;
    if (typeof config.strokeColor !== 'string') return false;
    if (typeof config.containerColor !== 'string') return false;
    
    // Check segments
    return config.segments.every((segment: any) => 
      segment &&
      typeof segment.label === 'string' &&
      typeof segment.value === 'number' &&
      typeof segment.color === 'string'
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportText(content);
      processImport(content);
    };
    reader.readAsText(file);
  };

  const processImport = (text: string) => {
    setError('');
    setSuccess(false);

    try {
      const parsed = JSON.parse(text);
      
      // Handle both old and new config formats
      let config: ProgressConfig;
      
      if (parsed.segments && parsed.config) {
        // Old format - convert to new format
        config = {
          segments: parsed.segments.map((seg: any) => ({
            label: seg.label,
            value: seg.value,
            color: seg.color
          })),
          roughness: parsed.config.roughness || 1.5,
          strokeWidth: parsed.config.strokeWidth || 2,
          backgroundColor: parsed.config.backgroundColor || '#f8fafc',
          strokeColor: parsed.config.strokeColor || '#1e293b',
          containerColor: parsed.config.containerFillColor || parsed.config.containerColor || '#e2e8f0'
        };
      } else if (validateConfig(parsed)) {
        // New format
        config = parsed;
      } else {
        throw new Error('Invalid configuration format');
      }

      onConfigImport(config);
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setImportText('');
        setSuccess(false);
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  const handleTextImport = () => {
    if (!importText.trim()) {
      setError('Please enter configuration data');
      return;
    }
    processImport(importText);
  };

  const clearInput = () => {
    setImportText('');
    setError('');
    setSuccess(false);
  };

  const sampleConfig: ProgressConfig = {
    segments: [
      { label: 'System', value: 25, color: '#ef4444' },
      { label: 'Tools', value: 20, color: '#f97316' },
      { label: 'Thinking', value: 30, color: '#eab308' },
      { label: 'Data', value: 25, color: '#22c55e' }
    ],
    roughness: 2.0,
    strokeWidth: 3,
    backgroundColor: '#ffffff',
    strokeColor: '#374151',
    containerColor: '#f3f4f6'
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Import Configuration
        </h3>
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isOpen ? 'Close' : 'Import'}
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Upload JSON File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="text-center text-slate-400 text-sm">or</div>

            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Paste JSON Configuration
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste your JSON configuration here..."
                className="w-full h-32 p-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <motion.button
                onClick={handleTextImport}
                disabled={!importText.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Import
              </motion.button>
              <motion.button
                onClick={clearInput}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Clear
              </motion.button>
            </div>

            {/* Sample Config Button */}
            <motion.button
              onClick={() => setImportText(JSON.stringify(sampleConfig, null, 2))}
              className="w-full px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm border border-slate-200 hover:bg-slate-100 transition-colors"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Load Sample Configuration
            </motion.button>

            {/* Status Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700">
                      Configuration imported successfully!
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      {!isOpen && (
        <div className="text-sm text-slate-500">
          Import configurations from LimuX v4 or v5 JSON files
        </div>
      )}
    </div>
  );
} 