"use client";

import { useState, useEffect, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeViewerProps {
  filename: string;
  content?: string; // Content from ComponentMetadata
  repoUrl?: string; // Fallback for fetching if content not available
}

export default function CodeViewer({ filename, content: providedContent, repoUrl }: CodeViewerProps) {
  const [code, setCode] = useState<string>(providedContent || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract the language from the filename
  const language = useMemo(() => {
    if (filename.endsWith('.tsx') || filename.endsWith('.jsx')) {
      return 'tsx';
    } else if (filename.endsWith('.ts') || filename.endsWith('.js')) {
      return 'typescript';
    } else if (filename.endsWith('.css')) {
      return 'css';
    } else if (filename.endsWith('.scss')) {
      return 'scss';
    } else if (filename.endsWith('.json')) {
      return 'json';
    } else if (filename.endsWith('.md')) {
      return 'markdown';
    } else if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
      return 'yaml';
    } else {
      return 'javascript';
    }
  }, [filename]);

  // Fetch file content only if not provided
  useEffect(() => {
    // If content is already provided, use it
    if (providedContent) {
      setCode(providedContent);
      return;
    }

    // If no content provided and no repo URL, show message
    if (!repoUrl || !filename) {
      setCode('// No file content available');
      return;
    }

    // Fallback: fetch from GitHub API if content not stored
    const fetchCode = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/file-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repoUrl,
            filePath: filename,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch file content');
        }

        const data = await response.json();
        setCode(data.content);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setCode(`// Error loading file: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCode();
  }, [filename, repoUrl, providedContent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-md">
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-sm text-gray-600">Loading code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800">Failed to load code</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="-mx-4 -my-2">
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-gray-300 font-mono">{filename}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400 uppercase">{language}</span>
          <span className="text-xs text-gray-400">
            {code.split('\n').length} lines
          </span>
          {providedContent && (
            <span className="text-xs text-green-400">● cached</span>
          )}
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.875rem',
          lineHeight: 1.5,
          maxHeight: '70vh',
          overflow: 'auto',
        }}
        showLineNumbers={true}
        wrapLines={true}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
} 