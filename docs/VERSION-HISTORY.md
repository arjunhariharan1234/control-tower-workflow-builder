# Version History & Rollback

## Overview

The Version History system automatically saves snapshots of workflows every time they are saved to the library. Users can browse the full version timeline, see what changed between versions (diff), restore any previous version, and mark versions as "Published" to distinguish draft from production-ready states.

**Location:** Playground toolbar menu → "Version History"

---

## Architecture

```
Save to Library (Toolbar)
        │
        ├── saveWorkflow()         → saved-workflows localStorage
        └── saveVersionSnapshot()  → version-history localStorage
                │
                ├── Compute version number (auto-increment)
                ├── Compute diff vs previous version
                ├── Generate change summary
                └── Store WorkflowVersion

Version History Drawer
        │
        ├── Timeline view (newest first)
        ├── Diff badges per version (+steps, -steps, ~modified)
        ├── Step-level diff lines
        ├── Restore → loadDSL(version.dsl)
        ├── Publish → mark as production-ready
        └── Delete → remove version
```

---

## Version Data Model

```typescript
interface WorkflowVersion {
  id: string;
  workflowId: string;
  workflowCode: string;
  version: number;           // Auto-incrementing: 1, 2, 3...
  label: string;             // "v1", "v2", etc.
  dsl: WorkflowDSL;          // Full snapshot of the workflow
  createdAt: string;
  changeType: VersionChangeType;  // 'initial' | 'edit' | 'rollback' | 'import'
  changeSummary: string;     // Auto-generated: "+2 steps, ~1 modified"
  stepCount: number;
  transitionCount: number;
  published: boolean;        // Draft vs Published state
}
```

---

## Diff Engine

The diff engine compares two WorkflowDSL snapshots and produces a structured diff:

```typescript
interface VersionDiff {
  addedSteps: string[];       // Step keys that are new
  removedSteps: string[];     // Step keys that were deleted
  modifiedSteps: string[];    // Step keys with changed properties
  addedTransitions: number;   // Net new edges
  removedTransitions: number; // Net removed edges
  metadataChanged: boolean;
  nameChanged: boolean;
}
```

### Diff Detection
- **Added:** step key exists in new but not old
- **Removed:** step key exists in old but not new
- **Modified:** step key exists in both but `JSON.stringify()` differs
- **Transitions:** compared by count (net change)

### Change Summary Generation
Auto-generated from diff: `"+2 steps, -1 step, ~3 modified, name changed"`

---

## Version History Drawer

### Visual Timeline
- Left-side timeline line with colored dots
- **Gold dot** = latest version
- **Green dot** = published version
- **Gray dot** = older versions

### Version Card (Collapsed)
- Version label (v1, v2, ...) + change type badge (Initial, Edit, Rollback, Import)
- Published / Latest badges
- Change summary line
- Timestamp + step count + edge count

### Version Card (Expanded)
- **Diff badges:** colored pills showing `+steps`, `-steps`, `~modified`, `+edges`, etc.
- **Step-level diff:** line-by-line showing which steps were added (green +), removed (red -), or modified (amber ~)
- **Restore button:** loads this version's DSL into the canvas
- **Publish button:** marks this version as the production version (unpublishes all others)
- **Delete button:** remove this version (disabled for published versions)

---

## Draft vs Published

- **Draft:** Every version starts as a draft
- **Published:** One version per workflow can be marked published
- Publishing unpublishes all other versions of the same workflow
- Visual indicator: green dot on timeline + "Published" badge
- Use case: edit freely in drafts, publish when ready for production deployment

---

## Auto-Versioning

Versions are automatically created when:
1. **Save to Library** — creates an `edit` version
2. Future: Import JSON → `import` version
3. Future: Restore from version → `rollback` version

---

## Files

| File | Purpose |
|------|---------|
| `src/types/version.ts` | `WorkflowVersion`, `VersionDiff`, `VersionChangeType` |
| `src/lib/version-history.ts` | CRUD, diff engine, change summary generator |
| `src/components/modals/VersionHistoryDrawer.tsx` | Timeline drawer with diff visualization |
| `src/store/workflow-store.ts` | `saveVersionSnapshot()`, `setShowVersionHistory()` |
| `src/components/toolbar/Toolbar.tsx` | Menu item + auto-version on save |
| `src/app/playground/page.tsx` | Mounts VersionHistoryDrawer |

---

## Storage

- **Key:** `ct-version-history`
- **Max versions per workflow:** 30 (oldest pruned)
- **Full DSL snapshot** stored per version (not delta — enables instant restore)
