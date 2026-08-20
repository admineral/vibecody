"use client";

import { useState } from 'react';
import { ComponentMetadata, ComponentType } from '@/app/lib/types';
import CodeViewer from './CodeViewer';

interface TypeBadgeProps {
  type: ComponentType;
}

// Badge component for the component type
const TypeBadge = ({ type }: TypeBadgeProps) => {
  const bgColorMap: Record<ComponentType, string> = {
    [ComponentType.PAGE]: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    [ComponentType.LAYOUT]: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
    [ComponentType.COMPONENT]: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    [ComponentType.HOOK]: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
    [ComponentType.UTILITY]: 'bg-muted text-muted-foreground border',
    [ComponentType.CONTEXT]: 'bg-pink-500/15 text-pink-300 border border-pink-500/30',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColorMap[type]}`}>
      {type}
    </span>
  );
};

interface PropertiesPanelProps {
  component: ComponentMetadata | null;
  relatedComponents: ComponentMetadata[];
  onSelectComponent: (componentName: string) => void;
  repoUrl?: string;
}

export default function PropertiesPanel({
  component,
  relatedComponents,
  onSelectComponent,
  repoUrl
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<'props' | 'code' | 'connections'>('props');
  
  // If no component selected, show empty state
  if (!component) {
    return (
      <div className="h-full flex flex-col bg-sidebar text-sidebar-foreground p-6">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <svg 
            className="w-16 h-16 text-muted-foreground/40 mb-4" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M19 3H5C3.895 3 3 3.895 3 5v14c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V5c0-1.105-.895-2-2-2z" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h3 className="text-lg font-medium">No component selected</h3>
          <p className="text-muted-foreground max-w-sm">
            Select a component from the canvas to view its properties and code.
          </p>
        </div>
      </div>
    );
  }
  
  // Get related components (uses and usedBy)
  const uses = component.uses?.map(name => 
    relatedComponents.find(c => c.name === name)
  ).filter(Boolean) as ComponentMetadata[];
  
  const usedBy = component.usedBy?.map(name => 
    relatedComponents.find(c => c.name === name)
  ).filter(Boolean) as ComponentMetadata[];
  
  return (
    <div className="h-full flex flex-col bg-sidebar text-sidebar-foreground overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-sidebar-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{component.name}</h2>
          <div className="mt-1 flex items-center">
            <TypeBadge type={component.type} />
            <span className="ml-2 text-xs text-muted-foreground">{component.file}</span>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="px-4 border-b border-sidebar-border" role="tablist" aria-label="Component details">
        <nav className="flex -mb-px">
          <button
            role="tab"
            aria-selected={activeTab === 'props'}
            className={`py-2 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'props'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
            onClick={() => setActiveTab('props')}
          >
            Details
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'connections'}
            className={`ml-8 py-2 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'connections'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
            onClick={() => setActiveTab('connections')}
          >
            Connections
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'code'}
            className={`ml-8 py-2 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'code'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'props' && (
          <div>
            {component.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-sm">{component.description}</p>
              </div>
            )}
            
            {component.props && component.props.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Props</h3>
                <div className="bg-card rounded-md overflow-hidden border">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Required
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {component.props.map((prop) => (
                        <tr key={prop.name}>
                          <td className="px-4 py-2 text-sm font-medium">
                            {prop.name}
                            {prop.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{prop.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm font-mono">
                            {prop.type}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {prop.required ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-destructive/15 text-destructive border border-destructive/30">
                                Required
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border">
                                Optional
                              </span>
                            )}
                            {!prop.required && prop.defaultValue && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Default: <code className="px-1 py-0.5 bg-muted rounded font-mono border">{prop.defaultValue}</code>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {component.exports && component.exports.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Exports</h3>
                <div className="flex flex-wrap gap-2">
                  {component.exports.map((exportName) => (
                    <span 
                      key={exportName}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-muted border"
                    >
                      {exportName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'connections' && (
          <div>
            {uses && uses.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Uses</h3>
                <div className="grid grid-cols-1 gap-2">
                  {uses.map((usedComponent) => (
                    <button
                      key={usedComponent.name}
                      className="flex items-center p-2 bg-card rounded-md hover:bg-accent transition-colors text-left border"
                      onClick={() => onSelectComponent(usedComponent.name)}
                    >
                      <TypeBadge type={usedComponent.type} />
                      <span className="ml-2 text-sm font-medium">{usedComponent.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {usedBy && usedBy.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Used By</h3>
                <div className="grid grid-cols-1 gap-2">
                  {usedBy.map((parentComponent) => (
                    <button
                      key={parentComponent.name}
                      className="flex items-center p-2 bg-card rounded-md hover:bg-accent transition-colors text-left border"
                      onClick={() => onSelectComponent(parentComponent.name)}
                    >
                      <TypeBadge type={parentComponent.type} />
                      <span className="ml-2 text-sm font-medium">{parentComponent.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'code' && (
          <CodeViewer 
            filename={component.file} 
            content={component.content}
            repoUrl={repoUrl} 
          />
        )}
      </div>
    </div>
  );
} 