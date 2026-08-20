"use client";

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Catches window-level errors from React Three Fiber (which can crash outside
 * the React tree) and offers a retry instead of a blank canvas.
 */
export default function ThreeDErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const isThreeError = (message?: string) =>
      message?.includes('reconciler') ||
      message?.includes('fiber') ||
      message?.includes('ReactCurrentOwner') ||
      message?.includes('react-three');

    const handleError = (error: ErrorEvent) => {
      if (isThreeError(error.message)) {
        console.error('3D rendering error caught:', error);
        setHasError(true);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isThreeError(event.reason?.message)) {
        console.error('3D rendering promise rejection caught:', event.reason);
        setHasError(true);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h3 className="mb-2 text-lg font-medium">3D view error</h3>
          <p className="text-muted-foreground">The 3D visualization encountered a compatibility issue.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This may be due to React Three Fiber compatibility with your React version. Please use the
            2D graph view instead.
          </p>
          <Button className="mt-4" variant="secondary" onClick={() => setHasError(false)}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
