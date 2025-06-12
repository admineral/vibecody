"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ComponentType, ComponentMetadata } from '@/app/lib/types';

// Icons for different component types
const ComponentTypeIcon = ({ type }: { type: ComponentType }) => {
  switch (type) {
    case ComponentType.PAGE:
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 6H9v12h6V6z" fill="currentColor" />
        </svg>
      );
    case ComponentType.LAYOUT:
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H5C3.895 3 3 3.895 3 5v14c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V5c0-1.105-.895-2-2-2zm0 16H5V5h14v14z" fill="currentColor" />
          <path d="M9 5v14" stroke="currentColor" strokeWidth="2" />
          <path d="M5 9h14" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case ComponentType.COMPONENT:
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 8l5-5 5 5-5 5-5-5z" fill="currentColor" />
          <path d="M7 16l5-5 5 5-5 5-5-5z" fill="currentColor" />
        </svg>
      );
    case ComponentType.HOOK:
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.927 16.32C18.21 17.927 16.447 19 14.5 19c-2.761 0-5-2.239-5-5v-4h-2v4c0 3.866 3.134 7 7 7 2.628 0 4.923-1.454 6.128-3.598l1.423.797C20.665 20.59 17.78 23 14.5 23c-5.042 0-9.127-4.085-9.127-9.127v-3.746H3L7.5 5l4.5 5.127H9.373v3.746c0 2.821 2.306 5.127 5.127 5.127 1.414 0 2.692-.578 3.618-1.513" fill="currentColor" />
        </svg>
      );
    case ComponentType.UTILITY:
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.571 5.714h4.857v4.857H9.571V5.714zm0 7.715h4.857v4.857H9.571v-4.857z" fill="currentColor" />
          <path d="M9.571 5.714h4.857v4.857H9.571V5.714z" fill="currentColor" />
        </svg>
      );
    case ComponentType.CONTEXT:
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4C7.582 4 4 7.582 4 12s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 14c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z" fill="currentColor" />
          <path d="M15 9l-6 6m0-6l6 6" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    default:
      return null;
  }
};

// Component badge colors based on type
const typeColors = {
  [ComponentType.PAGE]: 'bg-blue-700',
  [ComponentType.LAYOUT]: 'bg-violet-700', 
  [ComponentType.COMPONENT]: 'bg-emerald-700',
  [ComponentType.HOOK]: 'bg-orange-700',
  [ComponentType.UTILITY]: 'bg-gray-700',
  [ComponentType.CONTEXT]: 'bg-pink-700',
};

// Text color based on type
const textColors = {
  [ComponentType.PAGE]: 'text-blue-900 bg-blue-50 border border-blue-200',
  [ComponentType.LAYOUT]: 'text-violet-900 bg-violet-50 border border-violet-200',
  [ComponentType.COMPONENT]: 'text-emerald-900 bg-emerald-50 border border-emerald-200',
  [ComponentType.HOOK]: 'text-orange-900 bg-orange-50 border border-orange-200',
  [ComponentType.UTILITY]: 'text-gray-900 bg-gray-50 border border-gray-200',
  [ComponentType.CONTEXT]: 'text-pink-900 bg-pink-50 border border-pink-200',
};

// The component that renders the node
function ComponentNodeComponent({ data, selected }: NodeProps<{metadata: ComponentMetadata; selected?: boolean}>) {
  const { metadata } = data;
  const isSelected = selected || data.selected;
  
  // Get relevant props for metrics
  const propCount = metadata.props?.length || 0;
  const usesCount = metadata.uses?.length || 0;
  const usedByCount = metadata.usedBy?.length || 0;
  
  return (
    <div 
      className={`px-4 py-3 rounded-lg shadow-md bg-white transition-all ${
        isSelected ? 'ring-2 ring-blue-600 shadow-lg' : ''
      }`}
      style={{ 
        width: 220, 
        border: `2px solid ${typeColors[metadata.type].replace('bg-', '#')}`,
        boxShadow: isSelected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-gray-500 !border-2 !border-white"
      />
      
      {/* Component header */}
      <div className="flex items-center justify-between mb-2">
        <div className={`text-xs font-medium px-2 py-0.5 rounded ${textColors[metadata.type]}`}>
          {metadata.type}
        </div>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${typeColors[metadata.type]} text-white`}>
          <ComponentTypeIcon type={metadata.type} />
        </div>
      </div>
      
      {/* Component name */}
      <div className="font-bold text-gray-900 truncate mb-1" title={metadata.name}>
        {metadata.name}
      </div>
      
      {/* Component description */}
      {metadata.description && (
        <div className="text-xs text-gray-800 h-8 overflow-hidden" title={metadata.description}>
          {metadata.description.length > 60 
            ? `${metadata.description.substring(0, 57)}...` 
            : metadata.description}
        </div>
      )}
      
      {/* Component metrics */}
      <div className="flex justify-between mt-2 text-xs text-gray-700">
        {propCount > 0 && (
          <div title={`${propCount} props`}>
            <span className="font-medium text-gray-900">{propCount}</span> props
          </div>
        )}
        <div title={`Used by ${usedByCount} components`}>
          <span className="font-medium text-gray-900">{usedByCount}</span> in
        </div>
        <div title={`Uses ${usesCount} components`}>
          <span className="font-medium text-gray-900">{usesCount}</span> out
        </div>
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-gray-500 !border-2 !border-white"
      />
    </div>
  );
}

export default memo(ComponentNodeComponent); 