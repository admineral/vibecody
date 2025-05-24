"use client";

import { useState, useCallback } from 'react';
import { FileItem, ComponentType, ComponentMetadata } from '@/app/lib/types';

// Icons for file types
const FileIcon = ({ filename }: { filename: string }) => {
  if (filename.endsWith('.tsx') || filename.endsWith('.jsx')) {
    return (
      <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 13.5V10m0 9.5a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  } else if (filename.endsWith('.ts') || filename.endsWith('.js')) {
    return (
      <svg className="w-4 h-4 text-yellow-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" />
        <path d="M15 9h2v7.5m-2-3h2M7 12v4.5h2.25m0-9H7V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  } else if (filename.endsWith('.css') || filename.endsWith('.scss')) {
    return (
      <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" />
        <path d="M7 7h4.5m1.5 0h4m-10 5h3m2 0h5m-10 5h2m3 0h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  } else {
    return (
      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 2h10l4 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 9h4m-4 4h4m-4 4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
};

interface FileTreeItemProps {
  item: FileItem;
  depth: number;
  selectedPath: string | null;
  onSelectFile: (file: FileItem) => void;
}

// Component for a single file or directory in the tree
const FileTreeItem = ({ item, depth, selectedPath, onSelectFile }: FileTreeItemProps) => {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const isDirectory = item.type === 'directory';
  const hasMetadata = !!item.metadata;
  
  const toggleOpen = useCallback(() => {
    if (isDirectory) {
      setIsOpen(!isOpen);
    }
  }, [isDirectory, isOpen]);
  
  const handleClick = useCallback(() => {
    if (!isDirectory && hasMetadata) {
      onSelectFile(item);
    } else {
      toggleOpen();
    }
  }, [isDirectory, hasMetadata, item, onSelectFile, toggleOpen]);
  
  // Get the appropriate icon based on component type
  const ComponentBadge = ({ type }: { type: ComponentType }) => {
    const bgColorMap: Record<ComponentType, string> = {
      [ComponentType.PAGE]: 'bg-blue-700',
      [ComponentType.LAYOUT]: 'bg-violet-700',
      [ComponentType.COMPONENT]: 'bg-emerald-700',
      [ComponentType.HOOK]: 'bg-orange-700',
      [ComponentType.UTILITY]: 'bg-gray-700',
      [ComponentType.CONTEXT]: 'bg-pink-700',
    };
    
    return (
      <span 
        className={`w-2 h-2 rounded-full ${bgColorMap[type]} inline-block ml-1 border border-white`}
        title={`${type.charAt(0).toUpperCase() + type.slice(1)}`}
      />
    );
  };
  
  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-1 px-2 rounded text-sm ${
          selectedPath === item.path 
            ? 'bg-blue-100 text-blue-900 border border-blue-300' 
            : hasMetadata 
              ? 'hover:bg-gray-100 cursor-pointer text-gray-900' 
              : 'text-gray-700'
        }`}
        style={{ paddingLeft: `${(depth * 12) + 8}px` }}
        onClick={handleClick}
      >
        {isDirectory ? (
          <svg 
            className={`w-4 h-4 mr-1 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span className="mr-1">
            <FileIcon filename={item.name} />
          </span>
        )}
        
        <span className="truncate">{item.name}</span>
        
        {!isDirectory && item.metadata && (
          <ComponentBadge type={item.metadata.type} />
        )}
      </div>
      
      {isDirectory && isOpen && item.children && Array.isArray(item.children) && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Build a file tree from all files and component metadata
function buildFileTree(allFiles: GitHubFile[], components: ComponentMetadata[]): FileItem[] {
  const rootItems: Record<string, FileItem> = {};
  
  // Create a map of file paths to components for quick lookup
  const componentMap = new Map<string, ComponentMetadata>();
  components.forEach(component => {
    componentMap.set(component.file, component);
  });
  
  // Build the file tree from all files
  allFiles.forEach(file => {
    const pathParts = file.path.split('/').filter(Boolean);
    
    let currentPath = '';
    let currentItems = rootItems;
    
    // Handle directories
    if (file.type === 'tree') {
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
        
        if (!currentItems[part]) {
          currentItems[part] = {
            name: part,
            path: currentPath,
            type: 'directory',
            children: {} as Record<string, FileItem>
          };
        }
        
        if (i < pathParts.length - 1) {
          currentItems = currentItems[part].children as Record<string, FileItem>;
        }
      }
    } else {
      // Handle files
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
        
        if (!currentItems[part]) {
          currentItems[part] = {
            name: part,
            path: currentPath,
            type: 'directory',
            children: {} as Record<string, FileItem>
          };
        }
        
        currentItems = currentItems[part].children as Record<string, FileItem>;
      }
      
      // Add the file
      const fileName = pathParts[pathParts.length - 1];
      const fileFinalPath = currentPath ? `${currentPath}/${fileName}` : `/${fileName}`;
      
      currentItems[fileName] = {
        name: fileName,
        path: fileFinalPath,
        type: 'file',
        metadata: componentMap.get(file.path) || componentMap.get(fileFinalPath)
      };
    }
  });
  
  // Convert the nested object structure to arrays
  function convertToArray(items: Record<string, FileItem>): FileItem[] {
    return Object.values(items).map(item => {
      if (item.type === 'directory' && item.children) {
        return {
          ...item,
          children: convertToArray(item.children as Record<string, FileItem>)
        };
      }
      return item;
    }).sort((a, b) => {
      // Directories first, then alphabetical
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  }
  
  return convertToArray(rootItems);
}

interface GitHubFile {
  path: string;
  type: 'blob' | 'tree';
  url: string;
}

interface FileExplorerProps {
  components: ComponentMetadata[];
  allFiles?: GitHubFile[];
  selectedComponent: string | null;
  onSelectComponent: (componentName: string) => void;
}

export default function FileExplorer({ 
  components,
  allFiles = [],
  selectedComponent,
  onSelectComponent
}: FileExplorerProps) {
  // Build file tree from all files if available, otherwise fall back to component-only tree
  const fileTree = allFiles.length > 0 
    ? buildFileTree(allFiles, components)
    : components.length > 0
      ? buildFileTree(
          components.map(c => ({ path: c.file, type: 'blob' as const, url: '' })),
          components
        )
      : [];
  
  // Find the file path of the selected component
  const selectedPath = selectedComponent 
    ? components.find(c => c.name === selectedComponent)?.file || null
    : null;
  
  // Handle file selection
  const handleSelectFile = useCallback((file: FileItem) => {
    if (file.metadata) {
      onSelectComponent(file.metadata.name);
    }
  }, [onSelectComponent]);
  
  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-300">
      <div className="p-3 border-b border-gray-300 bg-white">
        <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Files
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {fileTree.length > 0 ? (
          fileTree.map((item) => (
            <FileTreeItem
              key={item.path}
              item={item}
              depth={0}
              selectedPath={selectedPath}
              onSelectFile={handleSelectFile}
            />
          ))
        ) : (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-gray-500">No files to display</p>
            <p className="text-xs text-gray-400 mt-2">Analyze a repository to see files</p>
          </div>
        )}
      </div>
    </div>
  );
} 