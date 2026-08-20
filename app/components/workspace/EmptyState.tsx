import { Boxes } from 'lucide-react';
import { DEFAULT_REPO_URL } from '@/app/lib/hooks/useAnalyzeRepo';

export default function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-background p-8 text-center">
      <Boxes className="mb-6 h-16 w-16 text-muted-foreground/40" strokeWidth={1.25} />
      <h2 className="mb-2 text-2xl font-semibold">Welcome to DocAI</h2>
      <p className="mb-6 max-w-md text-muted-foreground">
        Visualize and explore the component architecture of any GitHub repository.
      </p>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Enter a GitHub repository URL above and click &quot;Analyze&quot; to get started.
        </p>
        <p className="text-sm text-muted-foreground">
          Example:{' '}
          <code className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
            {DEFAULT_REPO_URL}
          </code>
        </p>
      </div>
    </div>
  );
}
