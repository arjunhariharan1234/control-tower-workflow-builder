import { WorkflowDSL } from './workflow';

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  workflowCode: string;
  version: number;
  label: string;           // "v1", "v2", or custom label
  dsl: WorkflowDSL;
  createdAt: string;
  author?: string;
  changeType: VersionChangeType;
  changeSummary: string;   // auto-generated diff summary
  stepCount: number;
  transitionCount: number;
  published: boolean;
}

export type VersionChangeType = 'initial' | 'edit' | 'rollback' | 'import';

export interface VersionDiff {
  addedSteps: string[];
  removedSteps: string[];
  modifiedSteps: string[];
  addedTransitions: number;
  removedTransitions: number;
  metadataChanged: boolean;
  nameChanged: boolean;
}
