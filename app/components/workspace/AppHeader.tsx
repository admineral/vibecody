"use client";

import { Boxes, GitBranch, Loader2, PanelLeft, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DEFAULT_REPO_URL, StatusMessage } from '@/app/lib/hooks/useAnalyzeRepo';
import LabsMenu from './LabsMenu';
import CacheMenu from './CacheMenu';

export type ViewMode = '2d' | '3d';

interface AppHeaderProps {
  repoUrl: string;
  onRepoUrlChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  hasComponents: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isDetailsPanelOpen: boolean;
  onToggleDetailsPanel: () => void;
  onStatus: (status: StatusMessage) => void;
}

export default function AppHeader({
  repoUrl,
  onRepoUrlChange,
  onAnalyze,
  isAnalyzing,
  hasComponents,
  viewMode,
  onViewModeChange,
  isSidebarOpen,
  onToggleSidebar,
  isDetailsPanelOpen,
  onToggleDetailsPanel,
  onStatus,
}: AppHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <Boxes className="h-5 w-5 text-primary" aria-hidden="true" />
        <span className="text-sm font-semibold tracking-tight">DocAI</span>
      </div>

      <div className="ml-4 flex items-center gap-2">
        <Label htmlFor="repo-url" className="sr-only">
          GitHub repository URL
        </Label>
        <div className="relative">
          <GitBranch
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="repo-url"
            type="url"
            value={repoUrl}
            onChange={(e) => onRepoUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isAnalyzing) {
                onAnalyze();
              }
            }}
            placeholder={DEFAULT_REPO_URL}
            disabled={isAnalyzing}
            className="h-8 w-80 pl-8 text-sm"
          />
        </div>
        <Button size="sm" onClick={onAnalyze} disabled={isAnalyzing}>
          {isAnalyzing && <Loader2 className="animate-spin" />}
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {hasComponents && (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={viewMode}
            onValueChange={(value) => {
              if (value) onViewModeChange(value as ViewMode);
            }}
            aria-label="Visualization mode"
          >
            <ToggleGroupItem value="2d">2D Graph</ToggleGroupItem>
            <ToggleGroupItem value="3d">3D Carousel</ToggleGroupItem>
          </ToggleGroup>
        )}

        <LabsMenu />
        <CacheMenu onStatus={onStatus} />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onToggleSidebar}
              aria-label={isSidebarOpen ? 'Hide file explorer' : 'Show file explorer'}
              aria-pressed={isSidebarOpen}
            >
              <PanelLeft />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isSidebarOpen ? 'Hide file explorer' : 'Show file explorer'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onToggleDetailsPanel}
              aria-label={isDetailsPanelOpen ? 'Hide details panel' : 'Show details panel'}
              aria-pressed={isDetailsPanelOpen}
            >
              <PanelRight />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isDetailsPanelOpen ? 'Hide details panel' : 'Show details panel'}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
