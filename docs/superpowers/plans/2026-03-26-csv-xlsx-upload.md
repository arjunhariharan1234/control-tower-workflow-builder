# CSV/XLSX Upload to Workflow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add file upload (CSV/XLSX) to the AI Builder chat so users can create workflows from spreadsheet-based SOPs.

**Architecture:** A new `file-parser.ts` lib handles CSV (papaparse) and XLSX (SheetJS, dynamically imported) parsing, flattening rows into natural language text. The chat page gets an attachment button, file chip state, and updated submit flow that feeds parsed text through the existing `processInput()` → `parseNaturalLanguage()` pipeline. No new workflow DSL logic.

**Tech Stack:** Next.js 14, papaparse, xlsx (SheetJS), TypeScript

**Spec:** `docs/superpowers/specs/2026-03-26-csv-xlsx-upload-design.md`

**Task Independence:** Tasks 1-2 are independent. Task 3 depends on both.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add papaparse, @types/papaparse, xlsx |
| `src/lib/file-parser.ts` | Create | `parseFileToText(file)` — CSV/XLSX → text string |
| `src/app/chat/page.tsx` | Modify | Attachment UI, file state, updated submit flow |

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install papaparse, @types/papaparse, and xlsx**

Note: Do NOT install `@types/xlsx` — SheetJS bundles its own TypeScript types. Installing `@types/xlsx` would cause type conflicts.

```bash
npm install papaparse xlsx
npm install --save-dev @types/papaparse
```

- [ ] **Step 2: Verify install**

Run: `npx tsc --noEmit`
Expected: No type errors (packages installed but not yet used)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add papaparse and xlsx dependencies for file upload"
```

---

### Task 2: Create File Parser (`src/lib/file-parser.ts`)

**Files:**
- Create: `src/lib/file-parser.ts`

- [ ] **Step 1: Create `src/lib/file-parser.ts`**

```typescript
import Papa from 'papaparse';

// ── Header keywords for detection ────────────────────────────────────
const HEADER_KEYWORDS = [
  'step', 'name', 'action', 'description', 'condition',
  'type', 'timer', 'escalate', 'assign', 'sop', 'process',
  'activity', 'task', 'owner', 'trigger', 'output', 'input',
];

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

// ── Main entry point ─────────────────────────────────────────────────

export async function parseFileToText(file: File): Promise<string> {
  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File is too large (max 1MB). Please reduce the file size.');
  }

  // Detect type and parse
  const ext = file.name.split('.').pop()?.toLowerCase();
  let rows: unknown[][];

  if (ext === 'csv') {
    rows = await parseCSV(file);
  } else if (ext === 'xlsx' || ext === 'xls') {
    rows = await parseXLSX(file);
  } else {
    throw new Error('Unsupported file format. Please upload a CSV or XLSX file.');
  }

  // Filter empty rows
  const filtered = rows.filter(row =>
    row.some(cell => String(cell ?? '').trim() !== '')
  );

  if (filtered.length === 0) {
    throw new Error('The file appears to be empty. Please upload a file with process steps.');
  }

  // Flatten to text
  return flattenRowsToText(filtered);
}

// ── CSV parsing (papaparse) ──────────────────────────────────────────

function parseCSV(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as string[][]),
      error: (err: Error) => reject(new Error(`Could not read the file. Please check the format and try again. (${err.message})`)),
    });
  });
}

// ── XLSX parsing (dynamic import) ────────────────────────────────────

async function parseXLSX(file: File): Promise<unknown[][]> {
  try {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('The file appears to be empty. Please upload a file with process steps.');
    }
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  } catch (err) {
    if (err instanceof Error && err.message.includes('empty')) throw err;
    throw new Error('Could not read the file. Please check the format and try again.');
  }
}

// ── Text flattening ──────────────────────────────────────────────────

function flattenRowsToText(rows: unknown[][]): string {
  const firstRow = rows[0].map(cell => String(cell ?? '').trim().toLowerCase());
  const hasHeaders = firstRow.some(cell =>
    HEADER_KEYWORDS.some(kw => cell.includes(kw))
  );

  if (hasHeaders && rows.length > 1) {
    // Use first row as headers
    const headers = rows[0].map(cell => String(cell ?? '').trim());
    const dataRows = rows.slice(1);

    return dataRows
      .map((row, idx) => {
        const parts = row
          .map((cell, colIdx) => {
            const header = headers[colIdx];
            const value = String(cell ?? '').trim();
            if (!value) return '';
            return header ? `${header}: ${value}` : value;
          })
          .filter(Boolean);
        return `Step ${idx + 1}: ${parts.join('. ')}`;
      })
      .join('\n');
  }

  // No headers — number each row
  return rows
    .map((row, idx) => {
      const text = row.map(cell => String(cell ?? '').trim()).filter(Boolean).join(', ');
      return `Step ${idx + 1}: ${text}`;
    })
    .join('\n');
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/file-parser.ts
git commit -m "feat: add file parser for CSV/XLSX to text conversion"
```

---

### Task 3: Integrate File Upload into Chat Page

**Files:**
- Modify: `src/app/chat/page.tsx`

This task modifies the chat page to add: file state, attachment button, file chip, updated submit flow, and attachment indicator on messages.

- [ ] **Step 1: Add imports and state**

At the top of `page.tsx`, add the import (after existing imports around line 11):

```typescript
import { parseFileToText } from '@/lib/file-parser';
```

Inside `ChatPage()`, add the `attachment` field to the `ChatMessage` interface (around line 68):

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  thinkingSteps?: ThinkingStep[];
  parseResult?: ParseResult;
  isThinking?: boolean;
  attachment?: { name: string; sizeBytes: number };
}
```

Add new state and ref (after existing state declarations, around line 103):

```typescript
const [attachedFile, setAttachedFile] = useState<File | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
```

- [ ] **Step 2: Update `processInput` to accept attachment metadata**

Change the `processInput` function signature and user message creation (lines 120-130):

```typescript
const processInput = useCallback(async (
  text: string,
  attachment?: { name: string; sizeBytes: number }
) => {
  if ((!text.trim() && !attachment) || isProcessing) return;

  const userMsg: ChatMessage = {
    id: uuid(),
    role: 'user',
    content: text.trim(),
    timestamp: new Date(),
    attachment,
  };
```

- [ ] **Step 3: Update `handleSubmit` to process file attachments**

Replace the existing `handleSubmit` and `handleKeyDown` functions (lines 191-200). Extract the shared submit logic into a helper so both `handleSubmit` and `handleKeyDown` can use it without type conflicts. Add above `handleSubmit`:

```typescript
const triggerSubmit = async () => {
  if (attachedFile) {
    try {
      const parsedText = await parseFileToText(attachedFile);
      const finalText = input.trim()
        ? `${input.trim()}\n\nFrom uploaded file:\n${parsedText}`
        : parsedText;
      const attachment = { name: attachedFile.name, sizeBytes: attachedFile.size };
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (inputRef.current) inputRef.current.style.height = 'auto';
      processInput(finalText, attachment);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: uuid(),
        role: 'system',
        content: (err as Error).message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  } else {
    processInput(input);
  }
};

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  triggerSubmit();
};
```

Update `handleKeyDown` to call the shared helper:

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    triggerSubmit();
  }
};
```

- [ ] **Step 4: Add file chip UI above the textarea**

Inside the input area form (after line 465's `<div className="rounded-2xl overflow-hidden" ...>`), add the file chip before the textarea:

```tsx
{/* File chip */}
{attachedFile && (
  <div className="flex items-center gap-2 px-4 pt-3">
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
      style={{
        background: 'rgba(255,190,7,0.1)',
        border: '1px solid rgba(255,190,7,0.2)',
        color: GOLD,
      }}
    >
      <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
      <span className="truncate max-w-[200px]">{attachedFile.name}</span>
      <span style={{ color: '#6b7280' }}>
        ({attachedFile.size < 1024 ? `${attachedFile.size}B` : `${(attachedFile.size / 1024).toFixed(0)}KB`})
      </span>
      <button
        type="button"
        onClick={() => {
          setAttachedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        className="ml-1 hover:opacity-80"
        style={{ color: '#6b7280' }}
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 5: Add attachment button and hidden file input**

In the bottom bar of the input area (line 477, the `<div className="flex items-center justify-between px-4 pb-3">`), add the attachment button and hidden input before the hint text:

Replace the entire bottom bar `<div>`:

```tsx
<div className="flex items-center justify-between px-4 pb-3">
  <div className="flex items-center gap-3">
    {/* Hidden file input */}
    <input
      ref={fileInputRef}
      type="file"
      accept=".csv,.xlsx,.xls"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) setAttachedFile(file);
      }}
    />
    {/* Attachment button */}
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      disabled={isProcessing}
      className="transition-colors disabled:opacity-30"
      style={{ color: '#6b7280' }}
      onMouseEnter={(e) => { if (!isProcessing) (e.currentTarget as HTMLElement).style.color = GOLD; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#6b7280'; }}
      title="Upload CSV or XLSX file"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
      </svg>
    </button>
    <span className="text-[10px]" style={{ color: '#4a4d5a' }}>
      Press Enter to send · Shift+Enter for new line
    </span>
  </div>
  <button
    type="submit"
    disabled={(!input.trim() && !attachedFile) || isProcessing}
    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
    style={{ background: GOLD, color: '#000' }}
  >
    {isProcessing ? (
      <>
        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        Building...
      </>
    ) : (
      <>
        Build
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
      </>
    )}
  </button>
</div>
```

- [ ] **Step 6: Add attachment indicator to user messages**

In the message rendering section (around line 376-417), inside the user message bubble, after the message text `<div>` and before the closing `</div>` of the message bubble, add:

```tsx
{msg.attachment && (
  <div className="flex items-center gap-1.5 mt-2" style={{ color: '#6b7280', fontSize: '10px' }}>
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
    <span>{msg.attachment.name}</span>
    <span>·</span>
    <span>{msg.attachment.sizeBytes < 1024 ? `${msg.attachment.sizeBytes}B` : `${(msg.attachment.sizeBytes / 1024).toFixed(0)}KB`}</span>
  </div>
)}
```

- [ ] **Step 7: Add system message rendering**

Two edits in the message thread rendering (around line 376-417):

**Edit A:** In the message bubble's `style` prop (line 379-385), replace the ternary with a three-way check. Find:

```tsx
style={msg.role === 'user' ? {
  background: 'rgba(255,190,7,0.1)',
  border: '1px solid rgba(255,190,7,0.2)',
} : {
  background: '#13151d',
  border: '1px solid #2a2d3a',
}}
```

Replace with:

```tsx
style={msg.role === 'user' ? {
  background: 'rgba(255,190,7,0.1)',
  border: '1px solid rgba(255,190,7,0.2)',
} : msg.role === 'system' ? {
  background: 'rgba(239,68,68,0.1)',
  border: '1px solid rgba(239,68,68,0.2)',
} : {
  background: '#13151d',
  border: '1px solid #2a2d3a',
}}
```

**Edit B:** Inside the message bubble, right after the opening `>` of the styled `<div>`, before the existing `{msg.role === 'assistant' && (` block (line 387), add:

```tsx
{msg.role === 'system' && (
  <div className="flex items-center gap-2 mb-2">
    <svg className="w-3.5 h-3.5" style={{ color: '#ef4444' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    <span className="text-[10px] font-semibold" style={{ color: '#ef4444' }}>Error</span>
  </div>
)}
```

All existing message rendering (assistant header, parseResult badges, thinking animation, messagesEndRef) remains untouched.

- [ ] **Step 8: Type-check and build**

Run: `npx tsc --noEmit && npx next build`
Expected: No errors

- [ ] **Step 9: Commit**

```bash
git add src/app/chat/page.tsx
git commit -m "feat: add CSV/XLSX file upload to AI Builder chat"
```

---

### Task 4: Update PRODUCT-CONTEXT.md and Final Verification

**Files:**
- Modify: `docs/PRODUCT-CONTEXT.md`

- [ ] **Step 1: Add Feature #9 to the features table**

In `docs/PRODUCT-CONTEXT.md`, after the Feature #8 row in the features table, add:

```
| 9 | Document Upload (CSV/XLSX) | `/chat` (attachment) | Shipped |
```

- [ ] **Step 2: Manual smoke test**

Run: `npx next dev`
Then verify:
- Paperclip button visible in chat input area
- Click paperclip → file picker opens (only .csv, .xlsx, .xls shown)
- Select a CSV file → file chip appears above textarea with name + size + X button
- Click X → file chip removed
- With file selected, Build button is enabled even with empty textarea
- Submit with file → workflow is generated and displayed in preview
- User message shows attachment indicator (icon + filename + size)
- Submit with file + typed text → both are combined
- Upload a file > 1MB → error message appears in chat
- Upload an empty file → error message appears in chat

- [ ] **Step 3: Commit**

```bash
git add docs/PRODUCT-CONTEXT.md
git commit -m "docs: add Feature #9 Document Upload to product context"
```
