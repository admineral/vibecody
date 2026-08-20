export interface Segment {
  label: string;
  value: number;
  color: string;
}

export interface ProgressConfig {
  segments: Segment[];
  roughness: number;
  strokeWidth: number;
  backgroundColor: string;
  strokeColor: string;
  containerColor: string;
}

export interface ProgressBarProps {
  config: ProgressConfig;
}

export interface ConfigImporterProps {
  onConfigImport: (config: ProgressConfig) => void;
} 