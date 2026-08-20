"use client";

import { cn } from '@/lib/utils';
import { StatusMessage } from '@/app/lib/hooks/useAnalyzeRepo';

const KIND_CLASSES: Record<StatusMessage['kind'], string> = {
  info: 'bg-muted/50 text-muted-foreground',
  success: 'bg-emerald-500/10 text-emerald-400',
  error: 'bg-destructive/10 text-destructive',
};

export default function StatusBar({ status }: { status: StatusMessage | null }) {
  return (
    <div role="status" aria-live="polite">
      {status && (
        <div className={cn('border-b px-4 py-1.5 text-sm', KIND_CLASSES[status.kind])}>
          {status.text}
        </div>
      )}
    </div>
  );
}
