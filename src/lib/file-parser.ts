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
