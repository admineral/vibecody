import { useState, useCallback, useMemo } from 'react';
import { CodeFile, generateMockFiles, generateMockFile } from '../utils/codeTemplates';

export interface MockDataControls {
  files: CodeFile[];
  cardCount: number;
  setCardCount: (count: number) => void;
  regenerateFiles: () => void;
  addFile: (type?: CodeFile['type']) => void;
  removeFile: (id: string) => void;
  updateFile: (id: string, updates: Partial<CodeFile>) => void;
  selectedFileId: string | null;
  setSelectedFileId: (id: string | null) => void;
  selectedFile: CodeFile | null;
}

export function useMockData(initialCount: number = 12): MockDataControls {
  const [files, setFiles] = useState<CodeFile[]>(() => generateMockFiles(initialCount));
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const cardCount = files.length;

  const selectedFile = useMemo(() => {
    return files.find(file => file.id === selectedFileId) || null;
  }, [files, selectedFileId]);

  const setCardCount = useCallback((count: number) => {
    const clampedCount = Math.max(0, Math.min(100, count));
    
    setFiles(prevFiles => {
      if (clampedCount === prevFiles.length) {
        return prevFiles;
      }
      
      if (clampedCount > prevFiles.length) {
        // Add new files
        const newFiles = generateMockFiles(clampedCount - prevFiles.length);
        return [...prevFiles, ...newFiles];
      } else {
        // Remove files from the end
        return prevFiles.slice(0, clampedCount);
      }
    });

    // Clear selection if selected file was removed
    setSelectedFileId(prevId => {
      if (prevId && clampedCount < files.length) {
        const selectedIndex = files.findIndex(f => f.id === prevId);
        if (selectedIndex >= clampedCount) {
          return null;
        }
      }
      return prevId;
    });
  }, [files.length]);

  const regenerateFiles = useCallback(() => {
    const newFiles = generateMockFiles(files.length);
    setFiles(newFiles);
    setSelectedFileId(null);
  }, [files.length]);

  const addFile = useCallback((type?: CodeFile['type']) => {
    if (files.length >= 100) return; // Max limit
    
    const newFile = generateMockFile(type);
    setFiles(prevFiles => [...prevFiles, newFile]);
  }, [files.length]);

  const removeFile = useCallback((id: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
    setSelectedFileId(prevId => prevId === id ? null : prevId);
  }, []);

  const updateFile = useCallback((id: string, updates: Partial<CodeFile>) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === id 
          ? { ...file, ...updates, lastModified: new Date() }
          : file
      )
    );
  }, []);

  return {
    files,
    cardCount,
    setCardCount,
    regenerateFiles,
    addFile,
    removeFile,
    updateFile,
    selectedFileId,
    setSelectedFileId,
    selectedFile
  };
} 