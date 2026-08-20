"use client";

import { useEffect, useState } from 'react';
import { Database, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { StatusMessage } from '@/app/lib/hooks/useAnalyzeRepo';

interface CacheStats {
  totalFiles: number;
  totalSizeMB: number;
  oldestFile?: string;
  newestFile?: string;
  backend?: 'kv' | 'filesystem';
  ttlDays?: number;
  ephemeral?: boolean;
}

interface CacheMenuProps {
  onStatus: (status: StatusMessage) => void;
}

export default function CacheMenu({ onStatus }: CacheMenuProps) {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/cache');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch cache stats:', error);
      }
    };

    fetchStats();
  }, []);

  const clearCache = async () => {
    try {
      const response = await fetch('/api/cache', { method: 'DELETE' });
      if (response.ok) {
        setStats({ totalFiles: 0, totalSizeMB: 0 });
        onStatus({ kind: 'success', text: 'Cache cleared successfully' });
      } else {
        onStatus({ kind: 'error', text: 'Failed to clear cache' });
      }
    } catch {
      onStatus({ kind: 'error', text: 'Error clearing cache' });
    } finally {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Cache management">
          <Database />
          Cache
          {stats && stats.totalFiles > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5">
              {stats.totalFiles}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <h3 className="mb-3 text-sm font-semibold">Cache statistics</h3>
        {stats ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cached repositories</span>
              <span className="font-medium">{stats.totalFiles}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total size</span>
              <span className="font-medium">{stats.totalSizeMB} MB</span>
            </div>
            {stats.newestFile && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last cached</span>
                <span className="font-medium">
                  {new Date(stats.newestFile).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Storage</span>
              <span className="font-medium">
                {stats.backend === 'kv' ? 'Vercel KV' : 'Local disk'}
              </span>
            </div>
            {stats.ephemeral && (
              <p className="text-xs text-muted-foreground">
                Disk cache is wiped on each Vercel deploy and cold start. Add Upstash/Vercel KV
                (`KV_REST_API_URL` + `KV_REST_API_TOKEN`) to keep repos for {stats.ttlDays ?? 30} days,
                or until the commit SHA changes.
              </p>
            )}
            <div className="border-t pt-3">
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={clearCache}
                disabled={stats.totalFiles === 0}
              >
                <Trash2 />
                Clear cache
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Loading cache statistics...</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
