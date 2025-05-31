"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ComponentMetadata } from '../types';

// Define the context shape
interface ComponentDataContextType {
  components: ComponentMetadata[];
  updateComponents: (newComponents: ComponentMetadata[]) => void;
  isLoading: boolean;
  ignoredFiles: Set<string>;
  selectedFiles: Set<string>;
  addToIgnoreList: (filePaths: string[]) => void;
  removeFromIgnoreList: (filePaths: string[]) => void;
  toggleFileSelection: (filePath: string) => void;
  clearFileSelection: () => void;
  selectAllFiles: (filePaths: string[]) => void;
}

// Create the context with a default value
const ComponentDataContext = createContext<ComponentDataContextType>({
  components: [],
  updateComponents: () => {},
  isLoading: false,
  ignoredFiles: new Set(),
  selectedFiles: new Set(),
  addToIgnoreList: () => {},
  removeFromIgnoreList: () => {},
  toggleFileSelection: () => {},
  clearFileSelection: () => {},
  selectAllFiles: () => {},
});

// Hook to use the context
export const useComponentData = () => useContext(ComponentDataContext);

// Provider component
export function ComponentDataProvider({ children }: { children: ReactNode }) {
  const [components, setComponents] = useState<ComponentMetadata[]>([]);
  const [isLoading] = useState(false);
  const [ignoredFiles, setIgnoredFiles] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Load ignore list from localStorage on mount
  useEffect(() => {
    // Default files to ignore
    const defaultIgnoredFiles = [
      'components/ui/button.tsx',
      'components/ui/checkbox.tsx',
      'components/ui/resizable.tsx',
      'components/ui/scroll-area.tsx',
      'components/ui/separator.tsx',
      'lib/utils.ts',
      'next.config.ts',
      'tailwind.config.js',
      'tailwind.config.ts',
      'postcss.config.js',
      'postcss.config.mjs',
      'eslint.config.mjs',
      'tsconfig.json',
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      '.gitignore',
      '.env',
      '.env.local',
      '.env.example',
      'README.md',
      'next-env.d.ts',
      'components.json'
    ];

    if (typeof window !== 'undefined') {
      const savedIgnoreList = localStorage.getItem('ignoreList');
      if (savedIgnoreList) {
        try {
          const parsed = JSON.parse(savedIgnoreList);
          setIgnoredFiles(new Set(parsed));
        } catch (error) {
          console.error('Failed to parse ignore list from localStorage:', error);
          // If parsing fails, use default ignored files
          setIgnoredFiles(new Set(defaultIgnoredFiles));
        }
      } else {
        // If no saved ignore list, use default ignored files
        setIgnoredFiles(new Set(defaultIgnoredFiles));
      }
    }
  }, []);

  // Save ignore list to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ignoreList', JSON.stringify(Array.from(ignoredFiles)));
    }
  }, [ignoredFiles]);

  // Update components and save to storage
  const updateComponents = (newComponents: ComponentMetadata[]) => {
    // Filter out ignored components
    const filteredComponents = newComponents.filter(comp => !ignoredFiles.has(comp.file));
    setComponents(filteredComponents);
    
    // Save to localStorage if available
    if (typeof window !== 'undefined') {
      if (newComponents.length > 0) {
        localStorage.setItem('componentData', JSON.stringify(newComponents));
      } else {
        localStorage.removeItem('componentData');
      }
    }
  };

  // Add files to ignore list
  const addToIgnoreList = (filePaths: string[]) => {
    setIgnoredFiles(prev => {
      const newSet = new Set(prev);
      filePaths.forEach(path => newSet.add(path));
      return newSet;
    });
    
    // Remove ignored files from components
    setComponents(prev => prev.filter(comp => !filePaths.includes(comp.file)));
  };

  // Remove files from ignore list
  const removeFromIgnoreList = (filePaths: string[]) => {
    setIgnoredFiles(prev => {
      const newSet = new Set(prev);
      filePaths.forEach(path => newSet.delete(path));
      return newSet;
    });
  };

  // Toggle file selection
  const toggleFileSelection = (filePath: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  };

  // Clear all file selections
  const clearFileSelection = () => {
    setSelectedFiles(new Set());
  };

  // Select all provided files
  const selectAllFiles = (filePaths: string[]) => {
    setSelectedFiles(new Set(filePaths));
  };

  return (
    <ComponentDataContext.Provider value={{ 
      components, 
      updateComponents, 
      isLoading,
      ignoredFiles,
      selectedFiles,
      addToIgnoreList,
      removeFromIgnoreList,
      toggleFileSelection,
      clearFileSelection,
      selectAllFiles
    }}>
      {children}
    </ComponentDataContext.Provider>
  );
} 