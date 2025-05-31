"use client"

import { useState } from 'react'
import { ComponentMetadata, ComponentType } from '../../lib/types'
import { ChevronRight, ChevronDown, Search, Layers, Eye, EyeOff } from 'lucide-react'

interface FileExplorer3DProps {
  components: ComponentMetadata[]
  selectedFile: string | null
  onSelectFile: (file: string) => void
}

interface FileNode {
  name: string
  path: string
  type: 'folder' | 'file'
  componentType?: ComponentType
  children?: FileNode[]
}

// Build file tree from components
function buildFileTree(components: ComponentMetadata[]): FileNode[] {
  const root: Record<string, FileNode> = {}
  
  components.forEach(component => {
    const parts = component.file.split('/')
    let currentPath = ''
    let currentLevel = root
    
    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      
      if (index === parts.length - 1) {
        // It's a file
        currentLevel[part] = {
          name: part,
          path: component.file,
          type: 'file',
          componentType: component.type,
        }
      } else {
        // It's a folder
        if (!currentLevel[part]) {
          currentLevel[part] = {
            name: part,
            path: currentPath,
            type: 'folder',
            children: {},
          }
        }
        currentLevel = currentLevel[part].children as Record<string, FileNode>
      }
    })
  })
  
  // Convert to array
  const convertToArray = (obj: Record<string, FileNode>): FileNode[] => {
    return Object.values(obj).map(node => ({
      ...node,
      children: node.children ? convertToArray(node.children) : undefined,
    })).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }
  
  return convertToArray(root)
}

// Tree node component
function TreeNode({ 
  node, 
  depth = 0, 
  selectedFile, 
  onSelectFile 
}: { 
  node: FileNode
  depth?: number
  selectedFile: string | null
  onSelectFile: (file: string) => void
}) {
  const [isOpen, setIsOpen] = useState(depth < 2)
  
  const getTypeIcon = (type?: ComponentType) => {
    if (!type) return '📄'
    switch (type) {
      case ComponentType.PAGE: return '📱'
      case ComponentType.COMPONENT: return '🧩'
      case ComponentType.HOOK: return '🪝'
      case ComponentType.UTILITY: return '🔧'
      case ComponentType.CONTEXT: return '🔄'
      case ComponentType.LAYOUT: return '🎨'
      default: return '📄'
    }
  }
  
  const getTypeColor = (type?: ComponentType) => {
    if (!type) return 'text-gray-300'
    switch (type) {
      case ComponentType.PAGE: return 'text-purple-400'
      case ComponentType.COMPONENT: return 'text-emerald-400'
      case ComponentType.HOOK: return 'text-orange-400'
      case ComponentType.UTILITY: return 'text-gray-400'
      case ComponentType.CONTEXT: return 'text-pink-400'
      case ComponentType.LAYOUT: return 'text-violet-400'
      default: return 'text-gray-300'
    }
  }
  
  const handleClick = () => {
    if (node.type === 'folder') {
      setIsOpen(!isOpen)
    } else {
      onSelectFile(node.path)
    }
  }
  
  return (
    <div>
      <div
        className={`flex items-center px-2 py-1 hover:bg-white/10 cursor-pointer transition-colors ${
          selectedFile === node.path ? 'bg-white/20' : ''
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'folder' && (
          <span className="mr-1 text-gray-400">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        <span className="mr-2">
          {node.type === 'folder' ? (isOpen ? '📂' : '📁') : getTypeIcon(node.componentType)}
        </span>
        <span className={`text-sm ${node.type === 'folder' ? 'text-gray-200' : getTypeColor(node.componentType)}`}>
          {node.name}
        </span>
      </div>
      
      {node.type === 'folder' && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FileExplorer3D({ components, selectedFile, onSelectFile }: FileExplorer3DProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<ComponentType | null>(null)
  
  const fileTree = buildFileTree(components)
  
  // Filter components based on search and type
  const filteredComponents = components.filter(comp => {
    const matchesSearch = searchQuery === '' || 
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.file.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !filterType || comp.type === filterType
    return matchesSearch && matchesType
  })
  
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="absolute top-20 left-4 z-10 p-2 bg-black/30 backdrop-blur-sm rounded-lg text-white hover:bg-black/40 transition-colors"
      >
        <Eye size={20} />
      </button>
    )
  }
  
  return (
    <div className="absolute top-20 left-4 z-10 w-80 max-h-[calc(100vh-120px)] bg-black/30 backdrop-blur-md rounded-lg text-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center">
            <Layers size={20} className="mr-2" />
            File Explorer
          </h3>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <EyeOff size={16} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/10 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        {/* Type filters */}
        <div className="flex flex-wrap gap-1">
          {Object.values(ComponentType).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? null : type)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filterType === type 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      
      {/* File tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {searchQuery || filterType ? (
          // Show filtered list
          <div>
            {filteredComponents.map(comp => (
              <div
                key={comp.file}
                onClick={() => onSelectFile(comp.file)}
                className={`flex items-center px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors rounded ${
                  selectedFile === comp.file ? 'bg-white/20' : ''
                }`}
              >
                <span className="mr-2">{
                  comp.type === ComponentType.PAGE ? '📱' :
                  comp.type === ComponentType.COMPONENT ? '🧩' :
                  comp.type === ComponentType.HOOK ? '🪝' :
                  comp.type === ComponentType.UTILITY ? '🔧' :
                  comp.type === ComponentType.CONTEXT ? '🔄' :
                  comp.type === ComponentType.LAYOUT ? '🎨' : '📄'
                }</span>
                <div className="flex-1">
                  <div className="text-sm">{comp.name}</div>
                  <div className="text-xs text-gray-400">{comp.file}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Show tree view
          fileTree.map(node => (
            <TreeNode
              key={node.path}
              node={node}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
            />
          ))
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-white/10 text-xs text-gray-400">
        {components.length} files • Click to fly to location
      </div>
    </div>
  )
} 