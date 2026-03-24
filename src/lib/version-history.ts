import { WorkflowDSL } from '@/types/workflow';
import { WorkflowVersion, VersionChangeType, VersionDiff } from '@/types/version';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'ct-version-history';
const MAX_VERSIONS_PER_WORKFLOW = 30;

// ── CRUD ─────────────────────────────────────────────────────────────

export function getAllVersions(): WorkflowVersion[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getVersionsForWorkflow(workflowCode: string): WorkflowVersion[] {
  return getAllVersions()
    .filter((v) => v.workflowCode === workflowCode)
    .sort((a, b) => b.version - a.version);
}

export function getVersionById(id: string): WorkflowVersion | undefined {
  return getAllVersions().find((v) => v.id === id);
}

export function getLatestVersion(workflowCode: string): WorkflowVersion | undefined {
  const versions = getVersionsForWorkflow(workflowCode);
  return versions[0];
}

export function getPublishedVersion(workflowCode: string): WorkflowVersion | undefined {
  return getVersionsForWorkflow(workflowCode).find((v) => v.published);
}

export function saveVersion(
  workflowId: string,
  workflowCode: string,
  dsl: WorkflowDSL,
  changeType: VersionChangeType,
  customLabel?: string
): WorkflowVersion {
  const all = getAllVersions();
  const existing = all.filter((v) => v.workflowCode === workflowCode);
  const nextNum = existing.length > 0 ? Math.max(...existing.map((v) => v.version)) + 1 : 1;

  const prev = existing.sort((a, b) => b.version - a.version)[0];
  const diff = prev ? computeDiff(prev.dsl, dsl) : null;
  const summary = diff ? generateChangeSummary(diff, changeType) : 'Initial version';

  const version: WorkflowVersion = {
    id: uuidv4(),
    workflowId,
    workflowCode,
    version: nextNum,
    label: customLabel || `v${nextNum}`,
    dsl,
    createdAt: new Date().toISOString(),
    changeType,
    changeSummary: summary,
    stepCount: dsl.steps.length,
    transitionCount: dsl.transitions.length,
    published: false,
  };

  all.unshift(version);

  // Prune old versions for this workflow
  const thisWorkflow = all.filter((v) => v.workflowCode === workflowCode);
  if (thisWorkflow.length > MAX_VERSIONS_PER_WORKFLOW) {
    const toRemove = new Set(
      thisWorkflow
        .sort((a, b) => b.version - a.version)
        .slice(MAX_VERSIONS_PER_WORKFLOW)
        .map((v) => v.id)
    );
    const pruned = all.filter((v) => !toRemove.has(v.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  return version;
}

export function publishVersion(id: string): void {
  const all = getAllVersions();
  const version = all.find((v) => v.id === id);
  if (!version) return;

  // Unpublish all others for same workflow
  for (const v of all) {
    if (v.workflowCode === version.workflowCode) {
      v.published = v.id === id;
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteVersion(id: string): void {
  const all = getAllVersions().filter((v) => v.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteAllVersionsForWorkflow(workflowCode: string): void {
  const all = getAllVersions().filter((v) => v.workflowCode !== workflowCode);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// ── Diff Engine ──────────────────────────────────────────────────────

export function computeDiff(oldDsl: WorkflowDSL, newDsl: WorkflowDSL): VersionDiff {
  const oldStepKeyList = oldDsl.steps.map((s) => s.step_key);
  const newStepKeyList = newDsl.steps.map((s) => s.step_key);
  const oldStepKeys = new Set(oldStepKeyList);
  const newStepKeys = new Set(newStepKeyList);

  const addedSteps = newStepKeyList.filter((k) => !oldStepKeys.has(k));
  const removedSteps = oldStepKeyList.filter((k) => !newStepKeys.has(k));

  // Modified = exists in both but different
  const modifiedSteps: string[] = [];
  for (const key of newStepKeyList) {
    if (oldStepKeys.has(key)) {
      const oldStep = oldDsl.steps.find((s) => s.step_key === key);
      const newStep = newDsl.steps.find((s) => s.step_key === key);
      if (JSON.stringify(oldStep) !== JSON.stringify(newStep)) {
        modifiedSteps.push(key);
      }
    }
  }

  const oldTransitions = oldDsl.transitions.length;
  const newTransitions = newDsl.transitions.length;

  return {
    addedSteps,
    removedSteps,
    modifiedSteps,
    addedTransitions: Math.max(0, newTransitions - oldTransitions),
    removedTransitions: Math.max(0, oldTransitions - newTransitions),
    metadataChanged: JSON.stringify(oldDsl.metadata) !== JSON.stringify(newDsl.metadata),
    nameChanged: oldDsl.name !== newDsl.name,
  };
}

function generateChangeSummary(diff: VersionDiff, changeType: VersionChangeType): string {
  if (changeType === 'rollback') return 'Rolled back to previous version';
  if (changeType === 'import') return 'Imported from JSON';

  const parts: string[] = [];
  if (diff.addedSteps.length > 0) parts.push(`+${diff.addedSteps.length} step${diff.addedSteps.length > 1 ? 's' : ''}`);
  if (diff.removedSteps.length > 0) parts.push(`-${diff.removedSteps.length} step${diff.removedSteps.length > 1 ? 's' : ''}`);
  if (diff.modifiedSteps.length > 0) parts.push(`~${diff.modifiedSteps.length} modified`);
  if (diff.addedTransitions > 0) parts.push(`+${diff.addedTransitions} transition${diff.addedTransitions > 1 ? 's' : ''}`);
  if (diff.removedTransitions > 0) parts.push(`-${diff.removedTransitions} transition${diff.removedTransitions > 1 ? 's' : ''}`);
  if (diff.nameChanged) parts.push('name changed');
  if (diff.metadataChanged) parts.push('metadata updated');

  return parts.length > 0 ? parts.join(', ') : 'No changes detected';
}

// ── Stats ────────────────────────────────────────────────────────────

export function getVersionStats(workflowCode: string) {
  const versions = getVersionsForWorkflow(workflowCode);
  const published = versions.find((v) => v.published);
  return {
    totalVersions: versions.length,
    latestVersion: versions[0]?.version || 0,
    publishedVersion: published?.version,
    lastSavedAt: versions[0]?.createdAt,
  };
}
