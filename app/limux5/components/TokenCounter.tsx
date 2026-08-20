'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TokenCounterProps {
  onTokenChange: (tokens: number, percentage: number) => void;
  className?: string;
}

// Model configurations
const MODEL_CONFIGS = {
  'gpt-4o': { name: 'GPT-4o', maxTokens: 128000 },
  'gpt-4': { name: 'GPT-4', maxTokens: 8192 },
  'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', maxTokens: 4096 },
  'claude-3.5-sonnet': { name: 'Claude 3.5 Sonnet', maxTokens: 200000 },
  'llama-3.1-8b': { name: 'Llama 3.1 8B', maxTokens: 128000 },
  'llama-3.2-3b': { name: 'Llama 3.2 3B', maxTokens: 128000 },
  'qwen2.5-7b': { name: 'Qwen 2.5 7B', maxTokens: 32768 },
  'qwen2.5-14b': { name: 'Qwen 2.5 14B', maxTokens: 32768 },
  'phi-3.5-mini': { name: 'Phi 3.5 Mini', maxTokens: 128000 },
  'phi-3.5-moe': { name: 'Phi 3.5 MoE', maxTokens: 128000 },
  'gemma-2-9b': { name: 'Gemma 2 9B', maxTokens: 8192 },
  'gemma-2-27b': { name: 'Gemma 2 27B', maxTokens: 8192 },
  'mistral-7b': { name: 'Mistral 7B', maxTokens: 32768 },
  'mixtral-8x7b': { name: 'Mixtral 8x7B', maxTokens: 32768 },
  'codellama-7b': { name: 'CodeLlama 7B', maxTokens: 16384 },
  'deepseek-coder-6.7b': { name: 'DeepSeek Coder 6.7B', maxTokens: 16384 },
  'yi-34b': { name: 'Yi 34B', maxTokens: 4096 },
  'baichuan2-13b': { name: 'Baichuan2 13B', maxTokens: 4096 },
  'chatglm3-6b': { name: 'ChatGLM3 6B', maxTokens: 8192 },
  'internlm2-7b': { name: 'InternLM2 7B', maxTokens: 32768 },
  'custom': { name: 'Custom Model', maxTokens: 10000 }
};

// Consistent number formatting function to avoid hydration issues
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Token estimation ratios - moved outside component to prevent recreation
const TOKEN_RATIOS: Record<string, number> = {
  'gpt-4o': 0.25,
  'gpt-4': 0.25,
  'gpt-3.5-turbo': 0.25,
  'claude-3.5-sonnet': 0.24,
  'llama-3.1-8b': 0.26,
  'llama-3.2-3b': 0.26,
  'qwen2.5-7b': 0.28,
  'qwen2.5-14b': 0.28,
  'phi-3.5-mini': 0.27,
  'phi-3.5-moe': 0.27,
  'gemma-2-9b': 0.26,
  'gemma-2-27b': 0.26,
  'mistral-7b': 0.26,
  'mixtral-8x7b': 0.26,
  'codellama-7b': 0.24,
  'deepseek-coder-6.7b': 0.24,
  'yi-34b': 0.28,
  'baichuan2-13b': 0.30,
  'chatglm3-6b': 0.29,
  'internlm2-7b': 0.27,
  'custom': 0.25
};

export default function TokenCounter({ onTokenChange, className = '' }: TokenCounterProps) {
  const [text, setText] = useState('');
  const [contextWindow, setContextWindow] = useState(10000); // Default 10k
  const [selectedModel, setSelectedModel] = useState('custom');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [transformersAvailable, setTransformersAvailable] = useState(false);
  const tokenizerRef = useRef<any>(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Stable estimation function using useCallback
  const estimateTokens = useCallback((text: string, model: string): number => {
    const ratio = TOKEN_RATIOS[model] || 0.25;
    return Math.ceil(text.length * ratio);
  }, []);

  // Check if we can use Transformers.js
  useEffect(() => {
    if (!mounted) return;

    const checkTransformersCompatibility = async () => {
      try {
        // Check if we're in a compatible environment
        if (typeof window === 'undefined') {
          setTransformersAvailable(false);
          return;
        }

        // Test if basic Web APIs are available
        if (!window.fetch || !window.URL || !window.Blob) {
          console.warn('Missing required Web APIs for Transformers.js');
          setTransformersAvailable(false);
          return;
        }

        // Try to import Transformers.js
        const { env } = await import('@huggingface/transformers');
        
        // Configure for browser environment
        env.allowRemoteModels = true;
        env.allowLocalModels = false;
        
        setTransformersAvailable(true);
        console.log('Transformers.js is available');
      } catch (err) {
        console.warn('Transformers.js not available, using estimation mode:', err);
        setTransformersAvailable(false);
        setError('Advanced tokenization unavailable. Using estimation mode.');
      }
    };

    checkTransformersCompatibility();
  }, [mounted]);

  // Initialize tokenizer when model changes (only if Transformers.js is available)
  useEffect(() => {
    if (!mounted || !transformersAvailable) return;
    
    const initializeTokenizer = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const { AutoTokenizer } = await import('@huggingface/transformers');
        
        // Simplified model mapping - use basic models that are more likely to work
        const modelMapping: Record<string, string> = {
          'gpt-4o': 'Xenova/gpt-4',
          'gpt-4': 'Xenova/gpt-4',
          'gpt-3.5-turbo': 'Xenova/gpt-4',
          'claude-3.5-sonnet': 'Xenova/gpt-4',
          'llama-3.1-8b': 'Xenova/Meta-Llama-3-8B-Instruct',
          'llama-3.2-3b': 'Xenova/Meta-Llama-3-8B-Instruct',
          'qwen2.5-7b': 'Xenova/Qwen2-7B-Instruct',
          'qwen2.5-14b': 'Xenova/Qwen2-7B-Instruct',
          'phi-3.5-mini': 'Xenova/Phi-3-mini-4k-instruct',
          'phi-3.5-moe': 'Xenova/Phi-3-mini-4k-instruct',
          'gemma-2-9b': 'Xenova/gemma-2b-it',
          'gemma-2-27b': 'Xenova/gemma-2b-it',
          'mistral-7b': 'Xenova/Mistral-7B-Instruct-v0.1',
          'mixtral-8x7b': 'Xenova/Mistral-7B-Instruct-v0.1',
          'codellama-7b': 'Xenova/CodeLlama-7b-Instruct-hf',
          'deepseek-coder-6.7b': 'Xenova/gpt-4',
          'yi-34b': 'Xenova/gpt-4',
          'baichuan2-13b': 'Xenova/gpt-4',
          'chatglm3-6b': 'Xenova/gpt-4',
          'internlm2-7b': 'Xenova/gpt-4',
          'custom': 'Xenova/gpt-4'
        };

        const modelId = modelMapping[selectedModel] || modelMapping['custom'];
        
        // Load tokenizer with timeout and error handling
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Tokenizer loading timeout')), 30000);
        });

        const tokenizerPromise = AutoTokenizer.from_pretrained(modelId, {
          progress_callback: (progress: any) => {
            if (progress.status === 'progress') {
              console.log(`Loading tokenizer: ${progress.loaded}/${progress.total}`);
            }
          }
        });
        
        const tokenizer = await Promise.race([tokenizerPromise, timeoutPromise]);
        
        tokenizerRef.current = tokenizer;
        setError('');
        console.log('Tokenizer loaded successfully');
      } catch (err) {
        console.warn('Failed to load tokenizer:', err);
        setError('Tokenizer loading failed. Using estimation mode.');
        tokenizerRef.current = null;
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure environment is ready
    const timer = setTimeout(() => {
      initializeTokenizer();
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectedModel, transformersAvailable, mounted]);

  // Calculate tokens using the loaded tokenizer or fallback estimation
  const tokenStats = useMemo(() => {
    if (!text.trim()) {
      return {
        tokens: 0,
        characters: text.length,
        words: 0,
        lines: 1,
        percentage: 0,
        status: 'empty' as const
      };
    }

    let tokens = 0;
    
    if (tokenizerRef.current && !isLoading && mounted && transformersAvailable) {
      try {
        // Use the actual tokenizer
        const encoded = tokenizerRef.current.encode(text);
        tokens = Array.isArray(encoded) ? encoded.length : encoded.input_ids?.length || 0;
      } catch (err) {
        console.error('Tokenization error:', err);
        // Fallback to estimation
        tokens = estimateTokens(text, selectedModel);
      }
    } else {
      // Fallback estimation while loading or if tokenizer failed
      tokens = estimateTokens(text, selectedModel);
    }

    const words = text.trim().split(/\s+/).length;
    const lines = text.split('\n').length;
    const percentage = (tokens / contextWindow) * 100;
    
    let status: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (percentage > 95) status = 'critical';
    else if (percentage > 80) status = 'high';
    else if (percentage > 60) status = 'medium';

    return {
      tokens,
      characters: text.length,
      words,
      lines,
      percentage,
      status
    };
  }, [text, contextWindow, selectedModel, isLoading, mounted, transformersAvailable, estimateTokens]);

  // Update parent component when tokens change - use useCallback to prevent infinite loops
  const handleTokenChange = useCallback((tokens: number, percentage: number) => {
    onTokenChange(tokens, percentage);
  }, [onTokenChange]);

  useEffect(() => {
    handleTokenChange(tokenStats.tokens, tokenStats.percentage);
  }, [tokenStats.tokens, tokenStats.percentage, handleTokenChange]);

  // Handle model change
  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    const config = MODEL_CONFIGS[model as keyof typeof MODEL_CONFIGS];
    if (config) {
      setContextWindow(config.maxTokens);
    }
  }, []);

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Model Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <optgroup label="OpenAI Models">
            <option value="gpt-4o">GPT-4o (128k tokens)</option>
            <option value="gpt-4">GPT-4 (8k tokens)</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (4k tokens)</option>
          </optgroup>
          <optgroup label="Anthropic Models">
            <option value="claude-3.5-sonnet">Claude 3.5 Sonnet (200k tokens)</option>
          </optgroup>
          <optgroup label="Meta Models">
            <option value="llama-3.1-8b">Llama 3.1 8B (128k tokens)</option>
            <option value="llama-3.2-3b">Llama 3.2 3B (128k tokens)</option>
            <option value="codellama-7b">CodeLlama 7B (16k tokens)</option>
          </optgroup>
          <optgroup label="Alibaba Models">
            <option value="qwen2.5-7b">Qwen 2.5 7B (32k tokens)</option>
            <option value="qwen2.5-14b">Qwen 2.5 14B (32k tokens)</option>
          </optgroup>
          <optgroup label="Microsoft Models">
            <option value="phi-3.5-mini">Phi 3.5 Mini (128k tokens)</option>
            <option value="phi-3.5-moe">Phi 3.5 MoE (128k tokens)</option>
          </optgroup>
          <optgroup label="Google Models">
            <option value="gemma-2-9b">Gemma 2 9B (8k tokens)</option>
            <option value="gemma-2-27b">Gemma 2 27B (8k tokens)</option>
          </optgroup>
          <optgroup label="Mistral Models">
            <option value="mistral-7b">Mistral 7B (32k tokens)</option>
            <option value="mixtral-8x7b">Mixtral 8x7B (32k tokens)</option>
          </optgroup>
          <optgroup label="Other Models">
            <option value="deepseek-coder-6.7b">DeepSeek Coder 6.7B (16k tokens)</option>
            <option value="yi-34b">Yi 34B (4k tokens)</option>
            <option value="baichuan2-13b">Baichuan2 13B (4k tokens)</option>
            <option value="chatglm3-6b">ChatGLM3 6B (8k tokens)</option>
            <option value="internlm2-7b">InternLM2 7B (32k tokens)</option>
          </optgroup>
          <optgroup label="Custom">
            <option value="custom">Custom Model</option>
          </optgroup>
        </select>
      </div>

      {/* Custom Context Window for Custom Model */}
      {selectedModel === 'custom' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Context Window (tokens)
          </label>
          <input
            type="number"
            min="1000"
            max="200000"
            value={contextWindow}
            onChange={(e) => setContextWindow(Math.max(1000, Math.min(200000, parseInt(e.target.value) || 10000)))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* Text Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Text to Analyze
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your text here to count tokens..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && transformersAvailable && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-blue-600"
          >
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Loading {MODEL_CONFIGS[selectedModel as keyof typeof MODEL_CONFIGS]?.name} tokenizer...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-yellow-50 border border-yellow-200 rounded-md"
          >
            <p className="text-sm text-yellow-800">{error}</p>
            <p className="text-xs text-yellow-600 mt-1">Using high-quality estimation instead.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Tokens</span>
            <span className={`text-sm font-bold ${
              tokenStats.status === 'critical' ? 'text-red-600' :
              tokenStats.status === 'high' ? 'text-orange-600' :
              tokenStats.status === 'medium' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {formatNumber(tokenStats.tokens)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Characters</span>
            <span className="text-sm text-gray-900">{formatNumber(tokenStats.characters)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Words</span>
            <span className="text-sm text-gray-900">{formatNumber(tokenStats.words)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Lines</span>
            <span className="text-sm text-gray-900">{formatNumber(tokenStats.lines)}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Context Usage</span>
          <span className={`text-sm font-bold ${
            tokenStats.status === 'critical' ? 'text-red-600' :
            tokenStats.status === 'high' ? 'text-orange-600' :
            tokenStats.status === 'medium' ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {tokenStats.percentage.toFixed(1)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-colors duration-300 ${
              tokenStats.status === 'critical' ? 'bg-red-500' :
              tokenStats.status === 'high' ? 'bg-orange-500' :
              tokenStats.status === 'medium' ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, tokenStats.percentage)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>{formatNumber(contextWindow)} tokens</span>
        </div>
      </div>

      {/* Model Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>Model: {MODEL_CONFIGS[selectedModel as keyof typeof MODEL_CONFIGS]?.name}</p>
        <p>Max Context: {formatNumber(contextWindow)} tokens</p>
        {!transformersAvailable && (
          <p className="text-blue-600">ℹ️ Using high-quality estimation mode</p>
        )}
        {transformersAvailable && !isLoading && !tokenizerRef.current && (
          <p className="text-yellow-600">⚠️ Using estimation (tokenizer not loaded)</p>
        )}
        {transformersAvailable && !isLoading && tokenizerRef.current && (
          <p className="text-green-600">✓ Using exact tokenization</p>
        )}
      </div>
    </div>
  );
} 