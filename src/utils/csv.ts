import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import type { Guest } from '../types';
import { CSV_HEADER_MAP, CSV_REVERSE_MAP, FULL_LIST_COLUMNS, SZALLAS_COLUMNS } from '../types';

// ── Row mapping (shared between CSV and spreadsheet paths) ────────────────────

function mapRows(rows: Record<string, unknown>[]): Guest[] {
  return rows.map((row) => {
    const guest: Partial<Guest> = { id: uuidv4() };
    for (const [headerKey, fieldKey] of Object.entries(CSV_HEADER_MAP)) {
      guest[fieldKey] = String(row[headerKey] ?? '').trim();
    }
    return guest as Guest;
  });
}

// ── CSV via PapaParse ─────────────────────────────────────────────────────────

function parseCsvRows(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as Record<string, unknown>[]),
      error: reject,
    });
  });
}

// ── XLS / XLSX / ODS via SheetJS ─────────────────────────────────────────────

async function parseSpreadsheetRows(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
}

// ── Public unified entry point ────────────────────────────────────────────────

export async function parseFile(file: File): Promise<Guest[]> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const rows = ext === 'csv'
    ? await parseCsvRows(file)
    : await parseSpreadsheetRows(file);
  return mapRows(rows);
}

// ── Szállás file: guests + capacities from the same file ─────────────────────

export interface ParsedSzallasFile {
  guests: Guest[];
  capacities: Record<string, number>;
}

export async function parseSzallasFile(file: File): Promise<ParsedSzallasFile> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const rows = ext === 'csv'
    ? await parseCsvRows(file)
    : await parseSpreadsheetRows(file);

  const capacities: Record<string, number> = {};
  const guestRows: Record<string, unknown>[] = [];

  for (const row of rows) {
    const szallasName = String(row['Szállások'] ?? '').trim();
    const helyek = String(row['Helyek'] ?? '').trim();
    if (szallasName && helyek) {
      const n = parseInt(helyek, 10);
      if (!isNaN(n) && n > 0) {
        capacities[szallasName] = n;
      }
    }
    if (String(row['Vendég neve'] ?? '').trim()) {
      guestRows.push(row);
    }
  }

  return { guests: mapRows(guestRows), capacities };
}

// ── Export helpers ────────────────────────────────────────────────────────────

function triggerDownload(csv: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportCSV(guests: Guest[], filename = 'vendegek.csv'): void {
  const headers = FULL_LIST_COLUMNS.map((col) => CSV_REVERSE_MAP[col.key]);
  const rows = guests.map((guest) =>
    FULL_LIST_COLUMNS.map((col) => guest[col.key] ?? '')
  );
  triggerDownload(Papa.unparse({ fields: headers, data: rows }), filename);
}

export function exportSzallasCSV(guests: Guest[], filename = 'szallas.csv'): void {
  const headers = SZALLAS_COLUMNS.map((col) => CSV_REVERSE_MAP[col.key]);
  const rows = guests.map((guest) =>
    SZALLAS_COLUMNS.map((col) => guest[col.key] ?? '')
  );
  triggerDownload(Papa.unparse({ fields: headers, data: rows }), filename);
}
