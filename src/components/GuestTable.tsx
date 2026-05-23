import { useState } from 'react';
import type { Guest, ColumnDef } from '../types';

interface GuestTableProps {
  guests: Guest[];
  columns: ColumnDef[];
  onEditGuest: (guest: Guest) => void;
  emptyMessage?: string;
}

type SortDir = 'asc' | 'desc' | null;

// ── Date formatting ───────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat('hu-HU', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

function formatDate(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return dateFormatter.format(d);
}

const DATE_KEYS: (keyof Guest)[] = ['erkezesDatuma', 'tavozasDatuma'];

// ── Row stripe color based on visszajelzés ────────────────────────────────────

function rowStripeClass(visszajelzes: string): string {
  const v = visszajelzes?.toLowerCase().trim();
  if (v === 'igen') return 'border-l-4 border-l-emerald-400';
  if (v === 'nem') return 'border-l-4 border-l-red-400';
  if (v === 'talán' || v === 'talan' || v === 'várakozás' || v === 'varakozas') return 'border-l-4 border-l-amber-400';
  if (v === 'folyamatban') return 'border-l-4 border-l-blue-400';
  return 'border-l-4 border-l-gray-200';
}

// ── Badge components ──────────────────────────────────────────────────────────

const VISSZAJELZES_STYLES: Record<string, string> = {
  'igen': 'bg-emerald-100 text-emerald-800',
  'nem': 'bg-red-100 text-red-700',
  'talán': 'bg-yellow-100 text-yellow-800',
  'talan': 'bg-yellow-100 text-yellow-800',
  'várakozás': 'bg-amber-100 text-amber-800',
  'varakozas': 'bg-amber-100 text-amber-800',
  'folyamatban': 'bg-blue-100 text-blue-800',
};

function VissszajelzesBadge({ value }: { value: string }) {
  if (!value) return <span className="text-gray-300">—</span>;
  const key = value.toLowerCase().trim();
  const style = VISSZAJELZES_STYLES[key] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {value}
    </span>
  );
}

function MeghivoBadge({ value }: { value: string }) {
  if (!value) return <span className="text-gray-300">—</span>;
  const lower = value.toLowerCase().trim();
  if (lower === 'igen' || lower === 'yes' || lower === '✓') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">{value}</span>;
  }
  if (lower === 'nem' || lower === 'no') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{value}</span>;
  }
  return <span className="text-sm text-gray-700">{value}</span>;
}

function CellValue({ colKey, value }: { colKey: keyof Guest; value: string }) {
  if (!value || value.trim() === '') return <span className="text-gray-300">—</span>;
  if (colKey === 'visszajelzes') return <VissszajelzesBadge value={value} />;
  if (colKey === 'meghivoElkuldve') return <MeghivoBadge value={value} />;
  if (DATE_KEYS.includes(colKey)) return <span className="text-sm text-gray-700">{formatDate(value)}</span>;
  return <span className="text-sm text-gray-800">{value}</span>;
}

// ── Sort icon ─────────────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === 'asc') {
    return (
      <svg className="w-3 h-3 ml-1 text-autumn-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
    );
  }
  if (dir === 'desc') {
    return (
      <svg className="w-3 h-3 ml-1 text-autumn-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      </svg>
    );
  }
  return (
    <svg className="w-3 h-3 ml-1 text-gray-300 opacity-0 group-hover/th:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GuestTable({ guests, columns, onEditGuest, emptyMessage }: GuestTableProps) {
  const [sortKey, setSortKey] = useState<keyof Guest | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  function handleSort(key: keyof Guest) {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return; }
    if (sortDir === 'asc') { setSortDir('desc'); return; }
    setSortKey(null); setSortDir(null);
  }

  const sorted = [...guests].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const av = (a[sortKey] ?? '').toLowerCase();
    const bv = (b[sortKey] ?? '').toLowerCase();
    return sortDir === 'asc' ? av.localeCompare(bv, 'hu') : bv.localeCompare(av, 'hu');
  });

  if (guests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <svg className="w-12 h-12 mb-3 text-autumn-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-sm">{emptyMessage ?? 'Nincsenek vendégek'}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-autumn-200 shadow-sm shadow-autumn-200/25 bg-[#FFFCF8] overflow-hidden">
      <div className="overflow-x-auto max-h-[68vh] overflow-y-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-autumn-50 border-b border-autumn-100">
              {columns.map((col) => {
                const active = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="group/th px-3 py-3 text-left text-xs font-semibold text-autumn-700 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:bg-autumn-100 transition-colors"
                  >
                    <span className="inline-flex items-center">
                      {col.label}
                      <SortIcon dir={active ? sortDir : null} />
                    </span>
                  </th>
                );
              })}
              {/* Always-visible edit column header */}
              <th className="px-3 py-3 text-right text-xs font-semibold text-autumn-700 uppercase tracking-wide sticky right-0 bg-autumn-50">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-autumn-50">
            {sorted.map((guest) => (
              <tr
                key={guest.id}
                className={`hover:bg-autumn-50/60 active:bg-autumn-100/60 transition-colors cursor-pointer group ${rowStripeClass(guest.visszajelzes ?? '')}`}
                onClick={() => onEditGuest(guest)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-3 whitespace-nowrap">
                    <CellValue colKey={col.key} value={guest[col.key] ?? ''} />
                  </td>
                ))}
                {/* Edit button — always visible on mobile, hover-reveal on desktop */}
                <td className="px-2 py-3 text-right sticky right-0 bg-[#FFFCF8] group-hover:bg-autumn-50/60 transition-colors">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditGuest(guest); }}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md text-autumn-600 hover:bg-autumn-100 active:bg-autumn-200 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                    title="Szerkesztés"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
