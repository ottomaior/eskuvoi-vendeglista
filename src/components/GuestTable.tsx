import { useState, useRef, useEffect, useCallback } from 'react';
import type { Guest, ColumnDef } from '../types';

interface GuestTableProps {
  guests: Guest[];
  columns: ColumnDef[];
  onEditGuest: (guest: Guest) => void;
  emptyMessage?: string;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  storageKey?: string;
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

// ── Column visibility helpers ─────────────────────────────────────────────────

// vendegNeve is always pinned visible
const PINNED_KEY: keyof Omit<Guest, 'id'> = 'vendegNeve';

function loadHiddenCols(storageKey: string, columns: ColumnDef[]): Set<string> {
  try {
    const raw = localStorage.getItem(`eskuvoi-hidden-cols-${storageKey}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    // Filter to only keys that still exist in this column set
    const validKeys = new Set<string>(columns.map((c) => c.key));
    return new Set(parsed.filter((k) => validKeys.has(k) && k !== PINNED_KEY));
  } catch { return new Set(); }
}

function saveHiddenCols(storageKey: string, hidden: Set<string>) {
  try {
    localStorage.setItem(`eskuvoi-hidden-cols-${storageKey}`, JSON.stringify([...hidden]));
  } catch { /* noop */ }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GuestTable({
  guests,
  columns,
  onEditGuest,
  emptyMessage,
  selectedIds,
  onSelectionChange,
  storageKey = 'default',
}: GuestTableProps) {
  const [sortKey, setSortKey] = useState<keyof Guest | null>('letszam');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => loadHiddenCols(storageKey, columns));
  const [gearOpen, setGearOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<HTMLDivElement>(null);

  const selectable = !!onSelectionChange;
  const selected = selectedIds ?? new Set<string>();

  // Columns actually rendered (filter out hidden ones)
  const visibleColumns = columns.filter((c) => !hiddenCols.has(c.key));

  // ── Scroll state tracking ─────────────────────────────────────────────────

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', updateScrollState); ro.disconnect(); };
  }, [updateScrollState]);

  // Recheck scroll state when visible columns change
  useEffect(() => { setTimeout(updateScrollState, 50); }, [hiddenCols, updateScrollState]);

  // ── Close gear dropdown on outside click ──────────────────────────────────

  useEffect(() => {
    if (!gearOpen) return;
    function onOutside(e: MouseEvent) {
      if (gearRef.current && !gearRef.current.contains(e.target as Node)) {
        setGearOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [gearOpen]);

  // ── Column toggle ─────────────────────────────────────────────────────────

  function toggleColumn(key: string) {
    if (key === PINNED_KEY) return;
    const next = new Set(hiddenCols);
    if (next.has(key)) next.delete(key); else next.add(key);
    setHiddenCols(next);
    saveHiddenCols(storageKey, next);
  }

  // ── Sort ──────────────────────────────────────────────────────────────────

  function handleSort(key: keyof Guest) {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return; }
    if (sortDir === 'asc') { setSortDir('desc'); return; }
    setSortKey(null); setSortDir(null);
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  function toggleSelect(id: string) {
    if (!onSelectionChange) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onSelectionChange(next);
  }

  function toggleAll() {
    if (!onSelectionChange) return;
    if (selected.size === sorted.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(sorted.map((g) => g.id)));
    }
  }

  // ── Scroll arrows ─────────────────────────────────────────────────────────

  function scrollLeft() {
    scrollRef.current?.scrollBy({ left: -220, behavior: 'smooth' });
  }

  function scrollRight() {
    scrollRef.current?.scrollBy({ left: 220, behavior: 'smooth' });
  }

  // ── Sorting ───────────────────────────────────────────────────────────────

  const sorted = [...guests].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    if (sortKey === 'letszam') {
      const an = parseInt(av, 10);
      const bn = parseInt(bv, 10);
      if (!isNaN(an) && !isNaN(bn)) return sortDir === 'asc' ? an - bn : bn - an;
    }
    return sortDir === 'asc'
      ? av.toLowerCase().localeCompare(bv.toLowerCase(), 'hu')
      : bv.toLowerCase().localeCompare(av.toLowerCase(), 'hu');
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

  const allSelected = sorted.length > 0 && selected.size === sorted.length;
  const someSelected = selected.size > 0 && !allSelected;
  const hiddenCount = hiddenCols.size;

  return (
    <div className="rounded-xl border border-autumn-200 shadow-sm shadow-autumn-200/25 bg-[#FFFCF8] overflow-hidden">

      {/* ── Toolbar: column visibility gear ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-autumn-100 bg-autumn-50/50">
        <span className="text-xs text-stone-400">
          {visibleColumns.length} / {columns.length} oszlop látható
          {hiddenCount > 0 && (
            <button
              onClick={() => { setHiddenCols(new Set()); saveHiddenCols(storageKey, new Set()); }}
              className="ml-2 text-autumn-600 hover:text-autumn-700 underline underline-offset-2"
            >
              összes megjelenítése
            </button>
          )}
        </span>

        <div className="relative" ref={gearRef}>
          <button
            onClick={() => setGearOpen((o) => !o)}
            title="Oszlopok megjelenítése / elrejtése"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              gearOpen || hiddenCount > 0
                ? 'bg-autumn-100 text-autumn-700'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Oszlopok
            {hiddenCount > 0 && (
              <span className="bg-autumn-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                {hiddenCount}
              </span>
            )}
          </button>

          {/* Gear dropdown */}
          {gearOpen && (
            <div className="absolute right-0 top-full mt-1 z-30 bg-[#FFFCF8] border border-autumn-200 rounded-xl shadow-xl shadow-autumn-900/10 p-3 min-w-[260px] max-w-[90vw]">
              <p className="text-xs font-semibold text-autumn-700 mb-2 px-1">Látható oszlopok</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {columns.map((col) => {
                  const pinned = col.key === PINNED_KEY;
                  const hidden = hiddenCols.has(col.key);
                  return (
                    <label
                      key={col.key}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                        pinned ? 'opacity-50 cursor-not-allowed' : 'hover:bg-autumn-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!hidden}
                        disabled={pinned}
                        onChange={() => toggleColumn(col.key)}
                        className="w-3.5 h-3.5 rounded accent-autumn-600 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-xs text-stone-700 leading-snug">{col.label}</span>
                      {pinned && <span className="text-[9px] text-stone-400 ml-auto">rögzített</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable table with overlay arrows ── */}
      <div className="relative">
        {/* Left scroll arrow */}
        <button
          onClick={scrollLeft}
          aria-label="Görgetés balra"
          className={`absolute left-0 top-0 bottom-0 z-20 w-10 flex items-center justify-center
            bg-gradient-to-r from-[#FFFCF8] to-transparent transition-opacity duration-200
            ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#FFFCF8] border border-autumn-200 shadow-sm text-autumn-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </span>
        </button>

        {/* Right scroll arrow */}
        <button
          onClick={scrollRight}
          aria-label="Görgetés jobbra"
          className={`absolute right-0 top-0 bottom-0 z-20 w-10 flex items-center justify-center
            bg-gradient-to-l from-[#FFFCF8] to-transparent transition-opacity duration-200
            ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#FFFCF8] border border-autumn-200 shadow-sm text-autumn-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>

        {/* Table scroll container */}
        <div ref={scrollRef} className="overflow-x-auto max-h-[68vh] overflow-y-auto scroll-smooth">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-autumn-50 border-b border-autumn-100">
                {selectable && (
                  <th className="px-3 py-3 sticky left-0 bg-autumn-50 z-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded accent-autumn-600 cursor-pointer"
                    />
                  </th>
                )}
                {visibleColumns.map((col) => {
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
                <th className="px-3 py-3 text-right text-xs font-semibold text-autumn-700 uppercase tracking-wide sticky right-0 bg-autumn-50">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-autumn-50">
              {sorted.map((guest) => {
                const isSelected = selected.has(guest.id);
                return (
                  <tr
                    key={guest.id}
                    className={`hover:bg-autumn-50/60 active:bg-autumn-100/60 transition-colors cursor-pointer group ${rowStripeClass(guest.visszajelzes ?? '')} ${isSelected ? 'bg-autumn-50' : ''}`}
                    onClick={() => selectable ? toggleSelect(guest.id) : onEditGuest(guest)}
                  >
                    {selectable && (
                      <td className="px-3 py-3 sticky left-0 bg-[#FFFCF8] group-hover:bg-autumn-50/60 transition-colors" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(guest.id)}
                          className="w-4 h-4 rounded accent-autumn-600 cursor-pointer"
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td key={col.key} className="px-3 py-3 whitespace-nowrap">
                        <CellValue colKey={col.key} value={guest[col.key] ?? ''} />
                      </td>
                    ))}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
