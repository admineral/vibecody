export interface CodeFile {
  id: string;
  name: string;
  type: 'javascript' | 'typescript' | 'css' | 'html' | 'json' | 'markdown';
  content: string;
  size: number;
  lastModified: Date;
}

export const codeTemplates = {
  javascript: [
    `// React Component
import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="counter">
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`,

    `// API Service
class ApiService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async get(endpoint) {
    const response = await fetch(\`\${this.baseURL}\${endpoint}\`);
    return response.json();
  }

  async post(endpoint, data) {
    const response = await fetch(\`\${this.baseURL}\${endpoint}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}`,

    `// Utility Functions
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};`
  ],

  typescript: [
    `// Type Definitions
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// Generic API Hook
export function useApi<T>(url: string): {
  data: T | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}`,

    `// Advanced Types
type EventHandler<T = Event> = (event: T) => void;

interface ComponentProps {
  children: React.ReactNode;
  className?: string;
  onClick?: EventHandler<MouseEvent>;
}

// Conditional Types
type NonNullable<T> = T extends null | undefined ? never : T;

// Utility Type
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Generic Class
class DataStore<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  getAll(): T[] {
    return [...this.items];
  }

  findById<K extends keyof T>(key: K, value: T[K]): T | undefined {
    return this.items.find(item => item[key] === value);
  }
}`
  ],

  css: [
    `/* Modern CSS Grid Layout */
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem;
}

.card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
}`,

    `/* CSS Custom Properties & Animations */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #8b5cf6;
  --text-color: #1f2937;
  --bg-color: #f8fafc;
  --border-radius: 8px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.button:hover::before {
  left: 100%;
}`
  ],

  html: [
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Web App</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="header">
    <nav class="nav">
      <div class="nav-brand">
        <h1>Brand</h1>
      </div>
      <ul class="nav-links">
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <main class="main">
    <section class="hero">
      <h2>Welcome to the Future</h2>
      <p>Building amazing experiences with modern web technologies.</p>
      <button class="cta-button">Get Started</button>
    </section>
  </main>

  <script src="script.js"></script>
</body>
</html>`,

    `<!-- Component Template -->
<div class="card-component" data-testid="user-card">
  <div class="card-header">
    <img src="{{avatar}}" alt="{{name}}" class="avatar">
    <div class="user-info">
      <h3 class="user-name">{{name}}</h3>
      <p class="user-role">{{role}}</p>
    </div>
  </div>
  
  <div class="card-body">
    <p class="user-bio">{{bio}}</p>
    <div class="user-stats">
      <div class="stat">
        <span class="stat-value">{{posts}}</span>
        <span class="stat-label">Posts</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{followers}}</span>
        <span class="stat-label">Followers</span>
      </div>
    </div>
  </div>
  
  <div class="card-actions">
    <button class="btn btn-primary">Follow</button>
    <button class="btn btn-secondary">Message</button>
  </div>
</div>`
  ],

  json: [
    `{
  "name": "awesome-project",
  "version": "1.0.0",
  "description": "A modern web application",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^13.4.0",
    "@types/react": "^18.2.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "eslint": "^8.40.0",
    "prettier": "^2.8.0"
  }
}`,

    `{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "profile": {
        "avatar": "https://example.com/avatar1.jpg",
        "bio": "Full-stack developer passionate about React and Node.js",
        "location": "San Francisco, CA",
        "website": "https://johndoe.dev"
      },
      "preferences": {
        "theme": "dark",
        "notifications": true,
        "language": "en"
      }
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "profile": {
        "avatar": "https://example.com/avatar2.jpg",
        "bio": "UI/UX Designer creating beautiful digital experiences",
        "location": "New York, NY",
        "website": "https://janesmith.design"
      },
      "preferences": {
        "theme": "light",
        "notifications": false,
        "language": "en"
      }
    }
  ]
}`
  ],

  markdown: [
    `# Project Documentation

## Overview
This project demonstrates modern web development practices using React, TypeScript, and Next.js.

## Features
- ⚡ Fast development with hot reload
- 🎨 Modern UI with Tailwind CSS
- 📱 Responsive design
- 🔒 Type-safe with TypeScript
- 🧪 Comprehensive testing

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
\`\`\`bash
npm install
npm run dev
\`\`\`

## Architecture

### Components
- **Layout**: Main application layout
- **Header**: Navigation and branding
- **Sidebar**: Secondary navigation
- **Content**: Main content area

### Hooks
- \`useAuth\`: Authentication management
- \`useApi\`: Data fetching
- \`useLocalStorage\`: Persistent storage

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request`,

    `# API Reference

## Authentication

### POST /api/auth/login
Authenticate a user and return a JWT token.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
\`\`\`

## Users

### GET /api/users
Retrieve a list of users.

**Query Parameters:**
- \`page\` (number): Page number (default: 1)
- \`limit\` (number): Items per page (default: 10)
- \`search\` (string): Search term

**Response:**
\`\`\`json
{
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
\`\`\``
  ]
};

export function generateMockFile(type?: keyof typeof codeTemplates): CodeFile {
  const types = Object.keys(codeTemplates) as (keyof typeof codeTemplates)[];
  const selectedType = type || types[Math.floor(Math.random() * types.length)];
  const templates = codeTemplates[selectedType];
  const content = templates[Math.floor(Math.random() * templates.length)];
  
  const fileNames = {
    javascript: ['component.js', 'utils.js', 'service.js', 'helpers.js', 'hooks.js'],
    typescript: ['types.ts', 'api.ts', 'store.ts', 'utils.ts', 'hooks.ts'],
    css: ['styles.css', 'components.css', 'layout.css', 'theme.css', 'animations.css'],
    html: ['index.html', 'template.html', 'component.html', 'layout.html'],
    json: ['package.json', 'config.json', 'data.json', 'manifest.json'],
    markdown: ['README.md', 'DOCS.md', 'API.md', 'GUIDE.md', 'CHANGELOG.md']
  };

  const names = fileNames[selectedType];
  const name = names[Math.floor(Math.random() * names.length)];

  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    type: selectedType,
    content,
    size: content.length,
    lastModified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
  };
}

export function generateMockFiles(count: number): CodeFile[] {
  return Array.from({ length: count }, () => generateMockFile());
} 