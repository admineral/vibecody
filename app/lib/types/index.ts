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

export interface ImportSpec {
  name: string;
  source: string;
  isDefault?: boolean;
  isNamespace?: boolean;
}

export type GraphEdgeKind = 'imports' | 'reexports';

export interface GraphEdge {
  from: string;
  to: string;
  kind: GraphEdgeKind;
  specifier?: string;
}

export interface CodeGraph {
  nodes: ComponentMetadata[];
  edges: GraphEdge[];
}

/** Stable graph id: normalized file path (one analyzed entity per file). */
export function nodeId(component: Pick<ComponentMetadata, 'file'>): string {
  return component.file.replace(/\\/g, '/');
}

export function findComponent(
  components: ComponentMetadata[],
  idOrName: string | null | undefined
): ComponentMetadata | undefined {
  if (!idOrName) return undefined;
  return components.find((c) => nodeId(c) === idOrName || c.name === idOrName);
}

// Component metadata with all the info we extract
export interface ComponentMetadata {
  name: string;
  description?: string;
  type: ComponentType;
  /** Outgoing edges: target node ids (file paths). Legacy caches may store names. */
  uses?: string[];
  /** Incoming edges: source node ids (file paths). */
  usedBy?: string[];
  props?: PropMetadata[];
  file: string;
  exports?: string[];
  content?: string;
  isClientComponent?: boolean;
  isServerComponent?: boolean;
  importSpecs?: ImportSpec[];
  dynamicImports?: string[];
  metadata?: {
    runtime?: 'nodejs' | 'edge';
    revalidate?: number | false;
    dynamic?: 'auto' | 'force-dynamic' | 'error' | 'force-static';
  };
}

// Props metadata extracted from TypeScript
export interface PropMetadata {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
  jsDocTags?: Record<string, string>;
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
  nodes: ComponentNode[];
  edges: ComponentEdge[];
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