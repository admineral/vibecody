import { Node, Edge } from 'reactflow';

// Component type categorization
export enum ComponentType {
  PAGE = 'page',
  LAYOUT = 'layout',
  COMPONENT = 'component',
  HOOK = 'hook',
  UTILITY = 'utility',
  CONTEXT = 'context',
}

// Metadata extracted from a component
export interface ComponentMetadata {
  name: string;
  description?: string;
  type: ComponentType;
  uses?: string[];  // Other components this component uses
  usedBy?: string[]; // Components that use this component
  props?: PropMetadata[];
  file: string;     // Path to the component file
  exports?: string[];
  content?: string; // File content (stored during analysis)
}

// Metadata for a component's props
export interface PropMetadata {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
}

// A node in our component graph
export interface ComponentNode extends Node {
  data: {
    metadata: ComponentMetadata;
    selected?: boolean;
  };
  type: 'component';
}

// An edge in our component graph
export type ComponentEdge = Edge & {
  data?: {
    relationship: 'uses' | 'usedBy';
  };
};

// File structure representation
export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  fileType?: 'file' | 'api' | 'config' | 'util' | 'type' | 'test';
  isClickable?: boolean;
  children?: FileItem[];
  metadata?: ComponentMetadata;
  isSelected?: boolean; // For multiselect functionality
  isIgnored?: boolean;  // For ignore list functionality
}

// For canvas state management
export interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: string | null;
}

// GitHub repository information
export interface GitHubRepo {
  owner: string;
  name: string;
  branch?: string;
}

// Ignore list management
export interface IgnoreListState {
  ignoredFiles: Set<string>;
  selectedFiles: Set<string>;
}

// File explorer state
export interface FileExplorerState {
  ignoreList: string[];
  selectedFiles: string[];
  showIgnoreList: boolean;
} 