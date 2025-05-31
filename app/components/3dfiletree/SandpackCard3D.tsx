"use client"

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Html, Text } from '@react-three/drei'
import { Group } from 'three'
import { Sandpack } from '@codesandbox/sandpack-react'
import { sandpackDark } from '@codesandbox/sandpack-themes'
import { ComponentMetadata, ComponentType } from '../../lib/types'

interface SandpackCard3DProps {
  component: ComponentMetadata | null;
  allComponents: ComponentMetadata[];
  repoUrl: string;
}

export default function SandpackCard3D({ component, allComponents, repoUrl }: SandpackCard3DProps) {
  const groupRef = useRef<Group>(null);

  // Gentle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.02;
    }
  });

  // Create files object for Sandpack
  const files = useMemo(() => {
    if (!component || allComponents.length === 0) {
      return {
        '/App.tsx': `// Welcome to 3D File Tree
// Select a file from the tree to view its code here

export default function App() {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>
        🌳 3D File Tree
      </h1>
      <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
        Click on files in the tree to view their code here
      </p>
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '10px',
        backdropFilter: 'blur(10px)'
      }}>
        <p>📁 Interactive 3D file browser</p>
        <p>✨ Live code preview</p>
        <p>🎮 Immersive experience</p>
      </div>
    </div>
  );
}`,
        '/styles.css': `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}`
      };
    }

    const fileMap: Record<string, string> = {};
    
    // Add all components to the file map
    allComponents.forEach(comp => {
      const fileName = comp.file.startsWith('/') ? comp.file : `/${comp.file}`;
      fileMap[fileName] = comp.content || `// File: ${comp.file}\n// Content not available`;
    });
    
    // Create an App.tsx if it doesn't exist
    if (!fileMap['/App.tsx'] && !fileMap['/app.tsx'] && !fileMap['/App.js'] && !fileMap['/app.js']) {
      const isPage = component.type === ComponentType.PAGE || 
                    component.file.includes('/page.') ||
                    component.file.includes('/pages/');
      
      if (isPage) {
        fileMap['/App.tsx'] = `// Auto-generated App wrapper for ${component.name}
import PageComponent from '.${component.file}';

export default function App() {
  return <PageComponent />;
}`;
      } else {
        fileMap['/App.tsx'] = `// Auto-generated App wrapper for ${component.name}
import ${component.name} from '.${component.file}';

export default function App() {
  return (
    <div style={{ 
      padding: '20px', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h1 style={{ 
            margin: '0 0 10px 0', 
            color: '#333', 
            fontSize: '24px', 
            fontWeight: '600' 
          }}>
            📄 ${component.name}
          </h1>
          <p style={{ 
            margin: '0', 
            color: '#666', 
            fontSize: '14px' 
          }}>
            {component.file}
          </p>
        </div>
        <div style={{ 
          background: 'white', 
          border: '1px solid #e5e7eb', 
          padding: '20px', 
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <${component.name} />
        </div>
      </div>
    </div>
  );
}`;
      }
    }
    
    // Add package.json if it doesn't exist
    if (!fileMap['/package.json']) {
      fileMap['/package.json'] = JSON.stringify({
        "name": "3d-filetree-preview",
        "version": "1.0.0",
        "main": "/App.tsx",
        "dependencies": {
          "react": "^18.0.0",
          "react-dom": "^18.0.0",
          "@types/react": "^18.0.0",
          "@types/react-dom": "^18.0.0"
        }
      }, null, 2);
    }
    
    return fileMap;
  }, [component, allComponents]);

  // Custom theme with purple accents
  const customTheme = {
    ...sandpackDark,
    colors: {
      ...sandpackDark.colors,
      surface1: '#0f0f23',
      surface2: '#1a1a2e',
      surface3: '#16213e',
      clickable: '#94a3b8',
      base: '#e2e8f0',
      disabled: '#475569',
      hover: '#9333ea',
      accent: '#9333ea',
    },
    font: {
      ...sandpackDark.font,
      body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
  };

  return (
    <group ref={groupRef}>
      {/* Title */}
      <Text
        position={[0, 8, 0]}
        fontSize={1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        Code Preview
      </Text>

      {/* Selected file info */}
      {component && (
        <Html position={[0, 6.5, 0]} style={{ textAlign: 'center' }}>
          <div className="text-white text-sm">
            <div className="font-semibold text-purple-300">{component.name}</div>
            <div className="text-gray-400 text-xs">{component.file}</div>
          </div>
        </Html>
      )}

      {/* Card backing */}
      <RoundedBox
        args={[16, 10, 0.8]}
        radius={0.3}
        smoothness={4}
      >
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.1}
          roughness={0.2}
        />
      </RoundedBox>

      {/* Glass effect border */}
      <RoundedBox
        args={[16.2, 10.2, 0.81]}
        radius={0.3}
        smoothness={4}
      >
        <meshBasicMaterial
          color="#9333ea"
          transparent
          opacity={0.3}
        />
      </RoundedBox>

      {/* Inner glow */}
      <RoundedBox
        args={[15.8, 9.8, 0.82]}
        radius={0.25}
        smoothness={4}
      >
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.1}
        />
      </RoundedBox>

      {/* Sandpack content */}
      <Html
        transform
        occlude
        position={[0, 0, 0.42]}
        style={{
          width: '1000px',
          height: '600px',
        }}
      >
        <div 
          className="w-full h-full rounded-lg overflow-hidden"
          style={{
            backgroundColor: '#0f0f23',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
          }}
        >
          <Sandpack
            files={files}
            theme={customTheme}
            template="react-ts"
            options={{
              showNavigator: true,
              showTabs: true,
              showLineNumbers: true,
              showInlineErrors: true,
              wrapContent: true,
              editorHeight: 560,
              activeFile: component ? (component.file.startsWith('/') ? component.file : `/${component.file}`) : '/App.tsx',
            }}
            customSetup={{
              dependencies: {
                'react': '^18.0.0',
                'react-dom': '^18.0.0',
                '@types/react': '^18.0.0',
                '@types/react-dom': '^18.0.0',
                'lucide-react': 'latest',
                'clsx': 'latest',
              }
            }}
          />
        </div>
      </Html>

      {/* Ambient glow effects */}
      <pointLight
        position={[0, 0, 3]}
        intensity={0.6}
        color="#9333ea"
        distance={20}
      />
      
      <pointLight
        position={[8, 4, 2]}
        intensity={0.3}
        color="#3b82f6"
        distance={15}
      />
      
      <pointLight
        position={[-8, -4, 2]}
        intensity={0.2}
        color="#8b5cf6"
        distance={12}
      />
    </group>
  );
} 