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
- `xlsx` — XLSX/XLS parsing (client-side, ~90KB gzipped)

## Architecture

```
File selected → parseFileToText(file) → text string → processInput(text) → parseNaturalLanguage(text) → WorkflowDSL → preview
```

The entire existing pipeline stays unchanged. This feature adds a new "front door" that converts files to text before feeding them into the same flow.

## Files

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/file-parser.ts` | Create | `parseFileToText(file)` — CSV/XLSX → text string |
| `src/app/chat/page.tsx` | Modify | Add attachment button, file chip, file processing flow |
| `package.json` | Modify | Add `papaparse` and `xlsx` dependencies |

## UI Changes — Chat Input Area

### Attachment Button
- Paperclip icon button positioned to the left of the "Build" button in the chat input bar
- Styled consistently with the existing input area (dark theme, gold accent on hover)
- Clicking opens a native file picker: `<input type="file" accept=".csv,.xlsx,.xls" />`
- Hidden file input, triggered by the button click

### File Chip
- When a file is selected, a pill/chip appears **above the textarea**
- Shows: file icon (spreadsheet) + file name (truncated to ~30 chars) + X button to remove
- Styled: `background: rgba(255,190,7,0.1)`, `border: 1px solid rgba(255,190,7,0.2)`, `color: #FFBE07`
- Removing the file chip clears the attachment state

### Submit Behavior
- **File only:** Parse file → feed extracted text to `processInput()`
- **File + typed text:** Prepend typed text as context: `"[user text]\n\nFrom uploaded file:\n[parsed content]"`
- **Text only:** Existing behavior (unchanged)

### User Message Display
- When a message was created from a file upload, show a small attachment indicator below the message text
- Shows: spreadsheet icon + filename + file size
- Styled muted (`color: #6b7280`, `fontSize: '10px'`)

## File Parsing Logic — `src/lib/file-parser.ts`

### Core Function

```typescript
parseFileToText(file: File): Promise<string>
```

### Validation
- Max file size: 1MB — reject with error message if exceeded
- Supported extensions: `.csv`, `.xlsx`, `.xls` — reject others
- Min content: at least 1 parseable row — reject empty files

### CSV Parsing (papaparse)
- Use `Papa.parse(file, { header: false })` to get raw 2D array
- Auto-detect delimiter (comma, semicolon, tab)

### XLSX Parsing (xlsx/SheetJS)
- Read file as ArrayBuffer
- Use `XLSX.read(buffer, { type: 'array' })`
- Read first sheet only: `workbook.SheetNames[0]`
- Convert to 2D array: `XLSX.utils.sheet_to_json(sheet, { header: 1 })`

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
- File read errors → show error message in chat: "Could not read the file. Please check the format and try again."
- Parse errors → same treatment
- Empty file → "The file appears to be empty. Please upload a file with process steps."
- File too large → "File is too large (max 1MB). Please reduce the file size."

## Design Tokens

Uses existing project colors:
- Attachment button: `color: #6b7280`, hover: `color: #FFBE07`
- File chip: `background: rgba(255,190,7,0.1)`, `border: 1px solid rgba(255,190,7,0.2)`, `color: #FFBE07`
- Error messages: `color: #ef4444`

## Testing

- Upload a CSV with headers (Step Name, Action, Condition) → should produce a workflow
- Upload a CSV without headers (just rows of text) → should still produce a workflow
- Upload an XLSX file → should work identically to CSV
- Upload a file > 1MB → should show error
- Upload a non-CSV/XLSX file → should be rejected by file picker
- Upload + type text → text should be prepended as context
- Click X on file chip → should remove the attachment
- Upload an empty file → should show "file appears to be empty" error
