"use client"

import { Sandpack } from '@codesandbox/sandpack-react'
import { sandpackDark } from '@codesandbox/sandpack-themes'

export default function SandpackCard() {
  // Hello World example code
  const files = {
    '/App.js': `export default function App() {
  return (
    <div className="App">
      <h1>Hello World! 🌍</h1>
      <p>Welcome to 3D Code Sandbox</p>
      <p>Edit this code and see the changes live!</p>
      <button 
        onClick={() => alert('Hello from 3D!')}
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '6px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          marginTop: '16px'
        }}
      >
        Click Me!
      </button>
    </div>
  );
}`,
    '/styles.css': `body {
  font-family: sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding: 20px;
  background: #0f172a;
  color: white;
}

.App {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  color: #3b82f6;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

p {
  color: #94a3b8;
  font-size: 1.2rem;
  line-height: 1.6;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

button:active {
  transform: translateY(0);
}`,
  }

  // Custom theme based on sandpackDark with our colors
  const customTheme = {
    ...sandpackDark,
    colors: {
      ...sandpackDark.colors,
      surface1: '#0f172a',
      surface2: '#1e293b',
      surface3: '#334155',
      clickable: '#94a3b8',
      base: '#e2e8f0',
      disabled: '#475569',
      hover: '#3b82f6',
      accent: '#3b82f6',
    },
    font: {
      ...sandpackDark.font,
      body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
  }

  return (
    <div 
      className="w-full h-full rounded-lg overflow-hidden"
      style={{
        backgroundColor: '#0f172a',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
      }}
    >
      <Sandpack
        files={files}
        theme={customTheme}
        template="react"
        options={{
          showNavigator: true,
          showTabs: true,
          showLineNumbers: true,
          showInlineErrors: true,
          wrapContent: true,
          editorHeight: 450,
        }}
        customSetup={{
          dependencies: {
            'react': '^18.0.0',
            'react-dom': '^18.0.0',
          }
        }}
      />
    </div>
  )
} 