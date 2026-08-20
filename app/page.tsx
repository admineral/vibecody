"use client"

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Canvas from './components/landingpage/canvas/Canvas';
import FileExplorer from './components/landingpage/explorer/FileExplorer';
import PropertiesPanel from './components/landingpage/properties/PropertiesPanel';
import AppHeader, { ViewMode } from './components/workspace/AppHeader';
import StatusBar from './components/workspace/StatusBar';
import EmptyState from './components/workspace/EmptyState';
import ThreeDErrorBoundary from './components/workspace/ThreeDErrorBoundary';
import UniverseView from './components/workspace/UniverseView';
import { useComponentGraph } from './lib/hooks/useComponentGraph';
import { useComponentData } from './lib/context/ComponentDataContext';
import { useAnalyzeRepo, DEFAULT_REPO_URL } from './lib/hooks/useAnalyzeRepo';
import { findComponent } from './lib/types';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function Home() {
  const { components: contextComponents, isLoading } = useComponentData();
  const {
    components,
    selectedNode,
    selectNode,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    resetLayout,
  } = useComponentGraph(contextComponents);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(true);
  const [repoUrl, setRepoUrl] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('3d');

  const { analyzeRepository, isAnalyzing, status, setStatus, allFiles } = useAnalyzeRepo();

  const selectedComponent = selectedNode
    ? findComponent(components, selectedNode) || null
    : null;

  if (isLoading) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading component data...</p>
      </div>
    );
  }

  const hasComponents = components.length > 0;

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <AppHeader
        repoUrl={repoUrl}
        onRepoUrlChange={setRepoUrl}
        onAnalyze={() => analyzeRepository(repoUrl)}
        isAnalyzing={isAnalyzing}
        hasComponents={hasComponents}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isDetailsPanelOpen={isDetailsPanelOpen}
        onToggleDetailsPanel={() => setIsDetailsPanelOpen(!isDetailsPanelOpen)}
        onStatus={setStatus}
      />

      <StatusBar status={status} />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          {isSidebarOpen && (
            <>
              <ResizablePanel defaultSize="20%" minSize="15%" maxSize="35%">
                <FileExplorer
                  components={components}
                  allFiles={allFiles}
                  selectedComponent={selectedNode}
                  onSelectComponent={selectNode}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          <ResizablePanel defaultSize={isSidebarOpen && isDetailsPanelOpen ? "60%" : isSidebarOpen || isDetailsPanelOpen ? "80%" : "100%"}>
            {hasComponents ? (
              viewMode === '2d' ? (
                <Canvas
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={(nodeId) => selectNode(nodeId || null)}
                  onResetLayout={resetLayout}
                  selectedNodeId={selectedNode}
                />
              ) : (
                <ThreeDErrorBoundary>
                  <UniverseView
                    components={components}
                    selectedComponentName={selectedNode}
                    onSelectComponent={selectNode}
                  />
                </ThreeDErrorBoundary>
              )
            ) : (
              <EmptyState />
            )}
          </ResizablePanel>

          {isDetailsPanelOpen && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="20%" minSize="15%" maxSize="40%">
                <PropertiesPanel
                  component={selectedComponent}
                  relatedComponents={components}
                  onSelectComponent={selectNode}
                  repoUrl={repoUrl.trim() || DEFAULT_REPO_URL}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
