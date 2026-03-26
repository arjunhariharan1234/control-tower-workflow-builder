# CSV/XLSX Upload to Workflow — Design Spec

**Date:** 2026-03-26
**Feature:** #9 — Document Upload for Workflow Creation
**Status:** Approved

## Overview

Add the ability to upload CSV or XLSX files containing SOP / process steps in the AI Builder chat. The file content is parsed client-side, flattened into natural language text, and fed through the existing `parseNaturalLanguage()` pipeline to generate a workflow. No new parsing logic for workflow DSL — the existing NL converter handles everything.

## Scope

- Attachment button in the AI Builder chat input area
- Client-side CSV parsing (papaparse)
- Client-side XLSX parsing (xlsx / SheetJS)
- File-to-text flattening with intelligent header detection
- File attachment indicator in chat messages
- **Not in scope:** Server-side parsing, multi-sheet support, drag-and-drop upload zone, dedicated import page

## Dependencies

- `papaparse` — CSV parsing (client-side, ~15KB gzipped)
- `@types/papaparse` — TypeScript types for papaparse (devDependency)
- `xlsx` — XLSX/XLS parsing (client-side, ~90KB gzipped). **Must be dynamically imported** (`await import('xlsx')`) inside `parseFileToText()` to avoid bloating the client bundle — do NOT use top-level import. SheetJS bundles its own TypeScript types.

## Architecture

```
File selected → parseFileToText(file) → text string → processInput(text, attachment?) → parseNaturalLanguage(text) → WorkflowDSL → preview
```

The entire existing pipeline stays unchanged. This feature adds a new "front door" that converts files to text before feeding them into the same flow.

**Limitation:** Each spreadsheet row maps to one NL segment. Intra-row structure (e.g., a row containing both an Action and a Condition column) will be parsed as a single text string by the NL pipeline. Complex multi-column rows may produce a single step rather than branching logic. This is acceptable for v1.

## Files

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/file-parser.ts` | Create | `parseFileToText(file)` — CSV/XLSX → text string |
| `src/app/chat/page.tsx` | Modify | Add attachment button, file chip, file processing flow |
| `package.json` | Modify | Add `papaparse`, `@types/papaparse`, and `xlsx` dependencies |

## Data Model Changes

### ChatMessage Extension

Add an optional `attachment` field to the existing `ChatMessage` interface in `page.tsx`:

```typescript
interface ChatMessage {
  // ...existing fields...
  attachment?: {
    name: string;
    sizeBytes: number;
  };
}
```

### processInput Signature Update

```typescript
const processInput = useCallback(async (
  text: string,
  attachment?: { name: string; sizeBytes: number }
) => { ... }, [isProcessing]);
```

When `attachment` is provided, the user message bubble includes the attachment indicator.

### New State and Refs

```typescript
const [attachedFile, setAttachedFile] = useState<File | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
```

### Build Button Disabled Condition

Update from:
```typescript
disabled={!input.trim() || isProcessing}
```
To:
```typescript
disabled={(!input.trim() && !attachedFile) || isProcessing}
```

This enables the Build button when a file is attached even with no typed text.

## UI Changes — Chat Input Area

### Attachment Button
- Paperclip icon button positioned to the left of the "Build" button in the chat input bar
- Styled consistently with the existing input area (dark theme, gold accent on hover)
- Clicking opens a native file picker via hidden `<input type="file" accept=".csv,.xlsx,.xls" ref={fileInputRef} />`
- The `fileInputRef` is used to trigger the picker: `fileInputRef.current?.click()`

### File Chip
- When a file is selected, a pill/chip appears **above the textarea**
- Shows: file icon (spreadsheet) + file name (truncated to ~30 chars) + X button to remove
- Styled: `background: rgba(255,190,7,0.1)`, `border: 1px solid rgba(255,190,7,0.2)`, `color: #FFBE07`
- Removing the file chip clears `attachedFile` state and resets the file input value

### Submit Behavior
- **File only:** Parse file → feed extracted text to `processInput(parsedText, { name, sizeBytes })`
- **File + typed text:** Prepend typed text: `"[user text]\n\nFrom uploaded file:\n[parsed content]"` → `processInput(combined, { name, sizeBytes })`
- **Text only:** Existing behavior — `processInput(input)` unchanged

### User Message Display
- When `msg.attachment` exists, show a small attachment indicator below the message text
- Shows: spreadsheet icon + filename + file size (formatted: KB/MB)
- Styled muted (`color: #6b7280`, `fontSize: '10px'`)

## File Parsing Logic — `src/lib/file-parser.ts`

### Core Function

```typescript
export async function parseFileToText(file: File): Promise<string>
```

### Validation
- Max file size: 1MB — reject with thrown error if exceeded
- Supported extensions: `.csv`, `.xlsx`, `.xls` — reject others
- Min content: at least 1 parseable row — reject empty files

### CSV Parsing (papaparse)

PapaParse's File API is callback-based. Wrap in a Promise:

```typescript
const rows = await new Promise<string[][]>((resolve, reject) => {
  Papa.parse(file, {
    header: false,
    skipEmptyLines: true,
    complete: (results) => resolve(results.data as string[][]),
    error: (err) => reject(err),
  });
});
```

Auto-detects delimiter (comma, semicolon, tab) by default.

### XLSX Parsing (xlsx/SheetJS)

Dynamically import to avoid bundle bloat:

```typescript
const XLSX = await import('xlsx');
const buffer = await file.arrayBuffer();
const workbook = XLSX.read(buffer, { type: 'array' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
```

Read first sheet only.

### Text Flattening
1. Get 2D array of rows from CSV or XLSX parser
2. Filter out empty rows (all cells empty or whitespace)
3. **Header detection:** Check if first row looks like labels:
   - If cells contain words like "step", "name", "action", "description", "condition", "type", "timer", "escalate", "assign" (case-insensitive)
   - If detected: use headers as keys for each subsequent row → `"Step Name: Check Location. Action: Analyse for petrol pump. Condition: If near petrol pump..."`
4. **No headers:** Number each row → `"Step 1: [all cells joined with ', ']. Step 2: [...]"`
5. Join all step descriptions with newline separators
6. Return the complete text string

### Error Handling
- File read errors → throw with message: "Could not read the file. Please check the format and try again."
- Parse errors → throw with same message
- Empty file → throw: "The file appears to be empty. Please upload a file with process steps."
- File too large → throw: "File is too large (max 1MB). Please reduce the file size."

Errors are caught in `page.tsx` and displayed as system messages in the chat.

## Design Tokens

Uses existing project colors:
- Attachment button: `color: #6b7280`, hover: `color: #FFBE07`
- File chip: `background: rgba(255,190,7,0.1)`, `border: 1px solid rgba(255,190,7,0.2)`, `color: #FFBE07`
- Error messages: `color: #ef4444`

## Testing

- Upload a CSV with headers (Step Name, Action, Condition) → should produce a workflow
- Upload a CSV without headers (just rows of text) → should still produce a workflow
- Upload an XLSX file → should work identically to CSV
- Upload a file > 1MB → should show error message in chat
- Upload a non-CSV/XLSX file → should be rejected by file picker
- Upload + type text → text should be prepended as context
- Click X on file chip → should remove the attachment
- Upload an empty file → should show "file appears to be empty" error
- Build button should be enabled when file is attached (even with empty textarea)
