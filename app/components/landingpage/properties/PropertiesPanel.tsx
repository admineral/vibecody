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
    [ComponentType.PAGE]: 'bg-blue-100 text-blue-900 border border-blue-200',
    [ComponentType.LAYOUT]: 'bg-violet-100 text-violet-900 border border-violet-200',
    [ComponentType.COMPONENT]: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
    [ComponentType.HOOK]: 'bg-orange-100 text-orange-900 border border-orange-200',
    [ComponentType.UTILITY]: 'bg-gray-100 text-gray-900 border border-gray-200',
    [ComponentType.CONTEXT]: 'bg-pink-100 text-pink-900 border border-pink-200',
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
      <div className="h-full flex flex-col bg-white p-6">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <svg 
            className="w-16 h-16 text-gray-300 mb-4" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M19 3H5C3.895 3 3 3.895 3 5v14c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V5c0-1.105-.895-2-2-2z" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">No component selected</h3>
          <p className="text-gray-700 max-w-sm">
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
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-300 flex items-center justify-between bg-white">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{component.name}</h2>
          <div className="mt-1 flex items-center">
            <TypeBadge type={component.type} />
            <span className="ml-2 text-xs text-gray-700">{component.file}</span>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="px-4 border-b border-gray-300 bg-white">
        <nav className="flex -mb-px">
          <button
            className={`py-2 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'props'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-400'
            }`}
            onClick={() => setActiveTab('props')}
          >
            Details
          </button>
          <button
            className={`ml-8 py-2 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'connections'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-400'
            }`}
            onClick={() => setActiveTab('connections')}
          >
            Connections
          </button>
          <button
            className={`ml-8 py-2 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'code'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-400'
            }`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {activeTab === 'props' && (
          <div>
            {component.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-sm text-gray-900">{component.description}</p>
              </div>
            )}
            
            {component.props && component.props.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Props</h3>
                <div className="bg-white rounded-md overflow-hidden border border-gray-300">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Required
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-300">
                      {component.props.map((prop) => (
                        <tr key={prop.name}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {prop.name}
                            {prop.description && (
                              <p className="text-xs text-gray-700 mt-0.5">{prop.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 font-mono">
                            {prop.type}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {prop.required ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-900 border border-red-200">
                                Required
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-900 border border-gray-200">
                                Optional
                              </span>
                            )}
                            {!prop.required && prop.defaultValue && (
                              <div className="text-xs text-gray-700 mt-1">
                                Default: <code className="px-1 py-0.5 bg-gray-100 rounded font-mono border border-gray-300">{prop.defaultValue}</code>
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
                <h3 className="text-sm font-medium text-gray-700 mb-2">Exports</h3>
                <div className="flex flex-wrap gap-2">
                  {component.exports.map((exportName) => (
                    <span 
                      key={exportName}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-900 border border-gray-300"
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
                <h3 className="text-sm font-medium text-gray-700 mb-2">Uses</h3>
                <div className="grid grid-cols-1 gap-2">
                  {uses.map((usedComponent) => (
                    <button
                      key={usedComponent.name}
                      className="flex items-center p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors text-left border border-gray-300"
                      onClick={() => onSelectComponent(usedComponent.name)}
                    >
                      <TypeBadge type={usedComponent.type} />
                      <span className="ml-2 text-sm font-medium text-gray-900">{usedComponent.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {usedBy && usedBy.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Used By</h3>
                <div className="grid grid-cols-1 gap-2">
                  {usedBy.map((parentComponent) => (
                    <button
                      key={parentComponent.name}
                      className="flex items-center p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors text-left border border-gray-300"
                      onClick={() => onSelectComponent(parentComponent.name)}
                    >
                      <TypeBadge type={parentComponent.type} />
                      <span className="ml-2 text-sm font-medium text-gray-900">{parentComponent.name}</span>
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