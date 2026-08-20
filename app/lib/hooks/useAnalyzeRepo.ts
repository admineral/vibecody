"use client";

import { useCallback, useState } from 'react';
import { useComponentData } from '../context/ComponentDataContext';
import { ComponentMetadata } from '../types';

export const DEFAULT_REPO_URL = 'https://github.com/admineral/OpenAI-Assistant-API-Chat';

export interface GitHubFile {
  path: string;
  type: 'blob' | 'tree';
  url: string;
}

export type StatusKind = 'info' | 'success' | 'error';

export interface StatusMessage {
  kind: StatusKind;
  text: string;
}

interface AnalyzeEvent {
  type: 'status' | 'files' | 'component' | 'progress' | 'complete' | 'error';
  message?: string;
  allFiles?: GitHubFile[];
  component?: ComponentMetadata;
  current?: number;
  total?: number;
  file?: string;
  components?: ComponentMetadata[];
  analyzedFiles?: number;
  totalFiles?: number;
  fromCache?: boolean;
  error?: string;
}

/**
 * Streams `/api/analyze-repo` SSE events into the shared component context
 * and exposes analysis progress as a status message.
 */
export function useAnalyzeRepo() {
  const { updateComponents } = useComponentData();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [allFiles, setAllFiles] = useState<GitHubFile[]>([]);

  const analyzeRepository = useCallback(async (repoUrl: string) => {
    const urlToAnalyze = repoUrl.trim() || DEFAULT_REPO_URL;

    setIsAnalyzing(true);
    setStatus({ kind: 'info', text: 'Analyzing repository...' });

    const collected: ComponentMetadata[] = [];

    const handleEvent = (data: AnalyzeEvent) => {
      switch (data.type) {
        case 'status':
          setStatus({ kind: 'info', text: data.message ?? '' });
          break;
        case 'files':
          setAllFiles(data.allFiles || []);
          break;
        case 'component':
          if (data.component) {
            collected.push(data.component);
            updateComponents([...collected]);
            setStatus({ kind: 'info', text: `Analyzing... Found ${collected.length} components` });
          }
          break;
        case 'progress':
          setStatus({ kind: 'info', text: `Analyzing file ${data.current}/${data.total}: ${data.file}` });
          break;
        case 'complete':
          updateComponents(data.components ?? []);
          setStatus({
            kind: 'success',
            text: `Successfully analyzed ${data.analyzedFiles} components from ${data.totalFiles} files${data.fromCache ? ' (from cache)' : ''}`,
          });
          break;
        case 'error':
          setStatus({ kind: 'error', text: `Error: ${data.error}` });
          break;
      }
    };

    const processLine = (line: string) => {
      if (!line.startsWith('data: ')) return;
      try {
        handleEvent(JSON.parse(line.slice(6)));
      } catch (e) {
        console.error('Failed to parse SSE data:', e);
      }
    };

    try {
      const response = await fetch('/api/analyze-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: urlToAnalyze }),
      });

      if (!response.ok) {
        const error = await response.json();
        setStatus({ kind: 'error', text: `Error: ${error.error || 'Failed to analyze repository'}` });
        return;
      }

      // Clear existing data when starting a new analysis
      updateComponents([]);
      setAllFiles([]);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let eolIndex;
        while ((eolIndex = buffer.indexOf('\n')) >= 0) {
          processLine(buffer.slice(0, eolIndex).trim());
          buffer = buffer.slice(eolIndex + 1);
        }
      }

      // Flush any trailing data left in the buffer after the stream ends
      if (buffer.trim()) {
        processLine(buffer.trim());
      }
    } catch (error) {
      setStatus({ kind: 'error', text: `Error: ${(error as Error).message}` });
    } finally {
      setIsAnalyzing(false);
    }
  }, [updateComponents]);

  return { analyzeRepository, isAnalyzing, status, setStatus, allFiles };
}
