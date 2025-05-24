"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ComponentMetadata } from '../types';

// Define the context shape
interface ComponentDataContextType {
  components: ComponentMetadata[];
  updateComponents: (newComponents: ComponentMetadata[]) => void;
  isLoading: boolean;
}

// Create the context with a default value
const ComponentDataContext = createContext<ComponentDataContextType>({
  components: [],
  updateComponents: () => {},
  isLoading: false,
});

// Hook to use the context
export const useComponentData = () => useContext(ComponentDataContext);

// Provider component
export function ComponentDataProvider({ children }: { children: ReactNode }) {
  const [components, setComponents] = useState<ComponentMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Update components and save to storage
  const updateComponents = (newComponents: ComponentMetadata[]) => {
    setComponents(newComponents);
    
    // Save to localStorage if available
    if (typeof window !== 'undefined') {
      if (newComponents.length > 0) {
        localStorage.setItem('componentData', JSON.stringify(newComponents));
      } else {
        localStorage.removeItem('componentData');
      }
    }
  };

  return (
    <ComponentDataContext.Provider value={{ components, updateComponents, isLoading }}>
      {children}
    </ComponentDataContext.Provider>
  );
} 