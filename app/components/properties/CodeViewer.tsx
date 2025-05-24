"use client";

import { useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Sample code for each component
const componentSamples: Record<string, string> = {
  HomePage: `import React from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import HeroSection from '@/components/HeroSection';
import FeatureList from '@/components/FeatureList';
import Newsletter from '@/components/Newsletter';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function HomePage() {
  const { trackPageView } = useAnalytics();
  
  React.useEffect(() => {
    trackPageView('home');
  }, [trackPageView]);
  
  const features = [
    { title: 'Feature 1', description: 'Description 1', icon: '✨' },
    { title: 'Feature 2', description: 'Description 2', icon: '🚀' },
    { title: 'Feature 3', description: 'Description 3', icon: '💡' },
  ];
  
  return (
    <MainLayout>
      <HeroSection 
        title="Welcome to Our Platform" 
        subtitle="The best solution for your needs"
      />
      <FeatureList features={features} />
      <Newsletter />
    </MainLayout>
  );
}`,

  MainLayout: `import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Sidebar from '@/components/Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export default function MainLayout({ 
  children, 
  showSidebar = true 
}: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  
  const handleCollapse = () => {
    setSidebarCollapsed(prev => !prev);
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {showSidebar && (
        <Sidebar 
          collapsed={sidebarCollapsed}
          onCollapse={handleCollapse}
        />
      )}
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}`,

  Header: `import React from 'react';
import Logo from '@/components/Logo';
import NavLink from '@/components/NavLink';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const { user } = useAuth();
  
  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Logo />
          <nav className="ml-10 space-x-4">
            <NavLink href="/" label="Home" />
            <NavLink href="/features" label="Features" />
            <NavLink href="/pricing" label="Pricing" />
            <NavLink href="/blog" label="Blog" />
          </nav>
        </div>
        {user ? (
          <UserMenu />
        ) : (
          <div className="space-x-2">
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900">
              Sign In
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}`,

  NavLink: `import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface NavLinkProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export default function NavLink({ href, label, icon }: NavLinkProps) {
  const router = useRouter();
  const isActive = router.pathname === href;
  
  return (
    <Link 
      href={href}
      className={\`flex items-center px-3 py-2 rounded-md \${
        isActive 
          ? 'bg-gray-100 text-gray-900' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }\`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </Link>
  );
}`,

  useAuth: `import { useState, useEffect, createContext, useContext } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);
  
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    // Simulated API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = { id: '1', name: 'John Doe', email };
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    setLoading(false);
  };
  
  const signOut = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}`
};

interface CodeViewerProps {
  filename: string;
  componentName: string;
}

export default function CodeViewer({ filename, componentName }: CodeViewerProps) {
  // Extract the language from the filename
  const language = useMemo(() => {
    if (filename.endsWith('.tsx') || filename.endsWith('.jsx')) {
      return 'tsx';
    } else if (filename.endsWith('.ts') || filename.endsWith('.js')) {
      return 'typescript';
    } else if (filename.endsWith('.css')) {
      return 'css';
    } else if (filename.endsWith('.scss')) {
      return 'scss';
    } else {
      return 'javascript';
    }
  }, [filename]);
  
  // Get code sample for this component
  const code = useMemo(() => {
    return componentSamples[componentName] || `// No code sample available for ${componentName}`;
  }, [componentName]);
  
  return (
    <div className="-mx-4 -my-2">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.875rem',
          lineHeight: 1.5,
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
} 