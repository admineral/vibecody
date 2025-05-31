"use client";

import { useState, useCallback } from 'react';
import { FileItem, ComponentType, ComponentMetadata } from '@/app/lib/types';
import { useComponentData } from '@/app/lib/context/ComponentDataContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import IgnoreList from './IgnoreList';
import { 
  CheckSquare, 
  Square, 
  Minus, 
  EyeOff, 
  RotateCcw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface FileTreeItemProps {
  item: FileItem;
  depth: number;
  selectedPath: string | null;
  onSelectFile: (file: FileItem) => void;
  selectedFiles: Set<string>;
  onToggleFileSelection: (filePath: string, isDirectory?: boolean) => void;
  ignoredFiles: Set<string>;
}

// Component for a single file or directory in the tree
function FileTreeItem({ 
  item, 
  depth, 
  selectedPath, 
  onSelectFile, 
  selectedFiles,
  onToggleFileSelection,
  ignoredFiles
}: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(depth < 2); // Auto-expand first 2 levels
  const hasChildren = item.children && item.children.length > 0;
  const isSelected = selectedPath === item.path;
  const isFileSelected = selectedFiles.has(item.path);
  const isIgnored = ignoredFiles.has(item.path);
  
  // Calculate selection state for directories
  const getDirectorySelectionState = () => {
    if (!hasChildren) return 'none';
    
    const allChildPaths = getAllChildPaths(item);
    const selectedChildPaths = allChildPaths.filter(path => selectedFiles.has(path));
    
    if (selectedChildPaths.length === 0) return 'none';
    if (selectedChildPaths.length === allChildPaths.length) return 'all';
    return 'partial';
  };

  const getAllChildPaths = (fileItem: FileItem): string[] => {
    const paths: string[] = [];
    if (fileItem.type === 'file') {
      paths.push(fileItem.path);
    }
    if (fileItem.children) {
      fileItem.children.forEach(child => {
        paths.push(...getAllChildPaths(child));
      });
    }
    return paths;
  };
  
  // Get file type icon
  const getFileIcon = () => {
    if (item.type === 'directory') {
      return isOpen ? '📂' : '📁';
    }
    
    if (item.metadata) {
      // Component file - use component type icon
      switch (item.metadata.type) {
        case ComponentType.PAGE: return '📄';
        case ComponentType.LAYOUT: return '🎨';
        case ComponentType.COMPONENT: return '🧩';
        case ComponentType.HOOK: return '🪝';
        case ComponentType.CONTEXT: return '🔄';
        case ComponentType.UTILITY: return '🔧';
        default: return '📄';
      }
    }
    
    // Non-component file - use file type icon
    switch (item.fileType) {
      case 'api': return '🌐';
      case 'config': return '⚙️';
      case 'util': return '🔧';
      case 'type': return '📝';
      case 'test': return '🧪';
      default: return '📄';
    }
  };
  
  // Get file type badge
  const getFileTypeBadge = () => {
    if (item.metadata) {
      return (
        <span className={`text-xs px-1.5 py-0.5 rounded text-white ml-2 ${
          item.metadata.type === ComponentType.PAGE ? 'bg-blue-600' :
          item.metadata.type === ComponentType.LAYOUT ? 'bg-violet-600' :
          item.metadata.type === ComponentType.COMPONENT ? 'bg-emerald-600' :
          item.metadata.type === ComponentType.HOOK ? 'bg-orange-600' :
          item.metadata.type === ComponentType.CONTEXT ? 'bg-pink-600' :
          'bg-gray-600'
        }`}>
          {item.metadata.type}
        </span>
      );
    }
    
    if (item.fileType && item.fileType !== 'file') {
      return (
        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-500 text-white ml-2">
          {item.fileType}
        </span>
      );
    }
    
    return null;
  };

  const handleClick = () => {
    if (item.type === 'directory') {
      setIsOpen(!isOpen);
    } else if (item.isClickable) {
      onSelectFile(item);
    }
  };

  const handleCheckboxChange = () => {
    onToggleFileSelection(item.path, item.type === 'directory');
  };

  const indentStyle = { paddingLeft: `${depth * 16 + 8}px` };
  const directionSelectionState = item.type === 'directory' ? getDirectorySelectionState() : 'none';

  return (
    <div className={isIgnored ? 'opacity-50' : ''}>
      <div
        className={`flex items-center py-1 px-2 hover:bg-gray-100 ${
          isSelected ? 'bg-blue-100 border-r-2 border-blue-600' : ''
        } ${
          !item.isClickable && item.type === 'file' ? 'opacity-60' : ''
        }`}
        style={indentStyle}
      >
        {/* Checkbox for selection */}
        <div className="mr-2 flex items-center">
          {item.type === 'directory' ? (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                handleCheckboxChange();
              }}
              className="cursor-pointer"
            >
              {directionSelectionState === 'all' ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : directionSelectionState === 'partial' ? (
                <Minus className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
            </div>
          ) : (
            <Checkbox
              checked={isFileSelected}
              onCheckedChange={handleCheckboxChange}
              className="w-4 h-4"
            />
          )}
        </div>

        {/* Directory expand/collapse */}
        {item.type === 'directory' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="mr-1 text-gray-600 hover:text-gray-800"
          >
            {isOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}
        
        <span className="mr-2">{getFileIcon()}</span>
        
        <div 
          className="flex-1 flex items-center cursor-pointer"
          onClick={handleClick}
        >
          <span className={`text-sm ${
            item.isClickable ? 'text-gray-900' : 'text-gray-500'
          } ${
            item.metadata ? 'font-medium' : ''
          }`}>
            {item.name}
          </span>
          
          {getFileTypeBadge()}
          
          {isIgnored && (
            <EyeOff className="w-3 h-3 ml-2 text-gray-400" />
          )}
        </div>
      </div>
      
      {isOpen && hasChildren && (
        <div>
          {item.children!.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              selectedFiles={selectedFiles}
              onToggleFileSelection={onToggleFileSelection}
              ignoredFiles={ignoredFiles}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Build a file tree from all files and component metadata
function buildFileTree(allFiles: GitHubFile[], components: ComponentMetadata[]): FileItem[] {
  // Create a map of file paths to components for quick lookup
  const componentMap = new Map<string, ComponentMetadata>();
  components.forEach(component => {
    componentMap.set(component.file, component);
  });
  
  // Helper function to determine file type for non-component files
  const getFileType = (path: string): 'file' | 'api' | 'config' | 'util' | 'type' | 'test' => {
    if (path.includes('/api/')) return 'api';
    if (path.match(/\.(config|json)$/)) return 'config';
    if (path.match(/\.(test|spec)\./)) return 'test';
    if (path.match(/\.(d\.ts|types)/)) return 'type';
    if (path.includes('/lib/') || path.includes('/utils/') || path.includes('/helpers/')) return 'util';
    return 'file';
  };

  // Filter and process files
  const processedFiles = allFiles
    .filter(file => 
      file.type === 'blob' &&
      !file.path.includes('node_modules') &&
      !file.path.includes('.next') &&
      !file.path.includes('dist') &&
      !file.path.includes('build') &&
      !file.path.includes('.git')
    )
    .map(file => {
      const component = componentMap.get(file.path);
      const fileType = getFileType(file.path);
      
      return {
        name: file.path.split('/').pop() || '',
        path: file.path,
        type: 'file' as const,
        fileType,
        isClickable: !!(component || 
          file.path.match(/\.(tsx|jsx|ts|js|json|md|txt|yml|yaml)$/)),
        metadata: component,
      };
    });

  // Build tree structure using a simpler approach
  const tree: FileItem[] = [];
  const pathMap = new Map<string, FileItem>();

  // Create directory structure
  processedFiles.forEach(file => {
    const pathParts = file.path.split('/');
    
    // Create directory nodes for each path segment
    for (let i = 0; i < pathParts.length - 1; i++) {
      const dirPath = pathParts.slice(0, i + 1).join('/');
      
      if (!pathMap.has(dirPath)) {
        const dirItem: FileItem = {
          name: pathParts[i],
          path: dirPath,
          type: 'directory',
          isClickable: false,
          children: [],
        };
        pathMap.set(dirPath, dirItem);
      }
    }
    
    // Add the file
    pathMap.set(file.path, file);
  });

  // Build the hierarchical structure
  pathMap.forEach((item, path) => {
    const pathParts = path.split('/');
    
    if (pathParts.length === 1) {
      // Root level item
      tree.push(item);
    } else {
      // Find parent and add to its children
      const parentPath = pathParts.slice(0, -1).join('/');
      const parent = pathMap.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(item);
      }
    }
  });

  // Sort function for tree items
  const sortTree = (items: FileItem[]): FileItem[] => {
    return items.sort((a, b) => {
      // Directories first, then files
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    }).map(item => ({
      ...item,
      children: item.children ? sortTree(item.children) : undefined,
    }));
  };

  return sortTree(tree);
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
  const {
    selectedFiles,
    ignoredFiles,
    toggleFileSelection,
    clearFileSelection,
    selectAllFiles,
    addToIgnoreList
  } = useComponentData();

  const [showIgnoreList, setShowIgnoreList] = useState(false);

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

  // Get all file paths for select all functionality
  const getAllFilePaths = (items: FileItem[]): string[] => {
    const paths: string[] = [];
    items.forEach(item => {
      if (item.type === 'file') {
        paths.push(item.path);
      }
      if (item.children) {
        paths.push(...getAllFilePaths(item.children));
      }
    });
    return paths;
  };

  const allFilePaths = getAllFilePaths(fileTree);
  const selectedFilesArray = Array.from(selectedFiles);

  // Handle directory selection
  const handleToggleFileSelection = (filePath: string, isDirectory?: boolean) => {
    if (isDirectory) {
      // Find the directory item and toggle all its children
      const findDirectoryAndChildren = (items: FileItem[], targetPath: string): string[] => {
        for (const item of items) {
          if (item.path === targetPath && item.type === 'directory') {
            return getAllFilePaths([item]);
          }
          if (item.children) {
            const result = findDirectoryAndChildren(item.children, targetPath);
            if (result.length > 0) return result;
          }
        }
        return [];
      };

      const childPaths = findDirectoryAndChildren(fileTree, filePath);
      const allSelected = childPaths.every(path => selectedFiles.has(path));
      
      if (allSelected) {
        // Deselect all children
        childPaths.forEach(path => {
          if (selectedFiles.has(path)) {
            toggleFileSelection(path);
          }
        });
      } else {
        // Select all children
        childPaths.forEach(path => {
          if (!selectedFiles.has(path)) {
            toggleFileSelection(path);
          }
        });
      }
    } else {
      toggleFileSelection(filePath);
    }
  };

  const handleSelectAll = () => {
    if (selectedFilesArray.length === allFilePaths.length) {
      clearFileSelection();
    } else {
      selectAllFiles(allFilePaths);
    }
  };

  const handleAddToIgnoreList = () => {
    if (selectedFilesArray.length > 0) {
      addToIgnoreList(selectedFilesArray);
      clearFileSelection();
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-3 border-b border-gray-300 bg-white">
        <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Files
        </h2>
      </div>

      {/* Ignore List */}
      <IgnoreList 
        isOpen={showIgnoreList} 
        onToggle={() => setShowIgnoreList(!showIgnoreList)} 
      />

      {/* Selection Controls */}
      {fileTree.length > 0 && (
        <div className="p-2 border-b border-gray-300 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-6 px-2 text-xs"
              >
                {selectedFilesArray.length === allFilePaths.length ? (
                  <>
                    <Square className="w-3 h-3 mr-1" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Select All
                  </>
                )}
              </Button>
              
              {selectedFilesArray.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFileSelection}
                  className="h-6 px-2 text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            
            <span className="text-xs text-gray-500">
              {selectedFilesArray.length} selected
            </span>
          </div>

          {selectedFilesArray.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToIgnoreList}
              className="w-full h-6 text-xs"
            >
              <EyeOff className="w-3 h-3 mr-1" />
              Add to Ignore List
            </Button>
          )}
        </div>
      )}
      
      {/* File Tree */}
      <ScrollArea className="flex-1">
        {fileTree.length > 0 ? (
          fileTree.map((item) => (
            <FileTreeItem
              key={item.path}
              item={item}
              depth={0}
              selectedPath={selectedPath}
              onSelectFile={handleSelectFile}
              selectedFiles={selectedFiles}
              onToggleFileSelection={handleToggleFileSelection}
              ignoredFiles={ignoredFiles}
            />
          ))
        ) : (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-gray-500">No files to display</p>
            <p className="text-xs text-gray-400 mt-2">Analyze a repository to see files</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
} 