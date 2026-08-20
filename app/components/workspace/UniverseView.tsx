"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { ComponentMetadata } from '@/app/lib/types';

const CodeUniverse3D = dynamic(() => import('@/app/components/3dcode/CodeUniverse3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading code universe...</p>
    </div>
  ),
});

type UniverseCameraMode = 'orbital' | 'firstPerson' | 'follow' | 'cinematic';

const CAMERA_MODES: { value: UniverseCameraMode; label: string }[] = [
  { value: 'orbital', label: 'Orbital' },
  { value: 'firstPerson', label: 'First Person' },
  { value: 'follow', label: 'Follow Agent' },
  { value: 'cinematic', label: 'Cinematic' },
];

interface UniverseViewProps {
  components: ComponentMetadata[];
  selectedComponentName: string | null;
  onSelectComponent: (name: string | null) => void;
}

export default function UniverseView({
  components,
  selectedComponentName,
  onSelectComponent,
}: UniverseViewProps) {
  const [cameraMode, setCameraMode] = useState<UniverseCameraMode>('orbital');
  const [agentsEnabled, setAgentsEnabled] = useState(true);
  const [agentSpeed, setAgentSpeed] = useState(0.3);

  const selectedFile = components.find((c) => c.name === selectedComponentName)?.file ?? null;

  const handleSelectFile = (file: string | null) => {
    if (!file) {
      onSelectComponent(null);
      return;
    }
    const match = components.find((c) => c.file === file);
    onSelectComponent(match?.name ?? null);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <CodeUniverse3D
        components={components}
        selectedFile={selectedFile}
        onSelectFile={handleSelectFile}
        agentsEnabled={agentsEnabled}
        agentSpeed={agentSpeed}
        viewMode={cameraMode}
        showExplorer={false}
      />

      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-lg border bg-background/80 p-1 shadow-sm backdrop-blur">
          <div className="flex">
            {CAMERA_MODES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setCameraMode(value)}
                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                  cameraMode === value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border" />

          <button
            type="button"
            onClick={() => setAgentsEnabled((enabled) => !enabled)}
            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
              agentsEnabled
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Agent {agentsEnabled ? 'on' : 'off'}
          </button>

          {agentsEnabled && (
            <label className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
              Speed
              <input
                type="range"
                min="0.1"
                max="0.6"
                step="0.1"
                value={agentSpeed}
                onChange={(e) => setAgentSpeed(parseFloat(e.target.value))}
                className="w-20 accent-primary"
              />
              <span className="w-8 font-mono text-foreground">{agentSpeed.toFixed(1)}x</span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
