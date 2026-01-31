// core/types.ts

export interface PbixLayout {
  id: number;
  reportId: number;
  filters?: string;
  config?: string;
  sections?: PbixSection[];
}

export interface PbixSection {
  name: string;
  displayName?: string;
  visualContainers?: PbixVisualContainer[];
}

export interface PbixVisualContainer {
  id: string;
  config?: unknown;
}
