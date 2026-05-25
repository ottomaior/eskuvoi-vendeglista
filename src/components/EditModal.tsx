import { useEffect, useRef, useState } from 'react';
import type { Guest } from '../types';
import { FULL_LIST_COLUMNS, SZALLAS_COLUMNS } from '../types';
import type { TabId } from './TabBar';

interface EditModalProps {
  guest: Guest | null;
  source: TabId;
  onSave: (updated: Guest) => void;
  onClose: () => void;
}

// ── Accommodation options (stored + custom) ───────────────────────────────────

const SZALLAS_OPTIONS_KEY = 'eskuvoi-szallas-opciok';
const DEFAULT_SZALLAS_OPTIONS = [
  'Erőss Hunor',
  'Leánylak',
  'Tűzoltószertár',
  'OVR',
  'Róka Panzió',
  'Bartis Elvira',
  'Tömbház',
  'Mamáék',
  'Ottó',
];

function loadCustomSzallasOptions(): string[] {
  try {
    const raw = localStorage.getItem(SZALLAS_OPTIONS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

function saveCustomSzallasOptions(opts: string[]): void {
  localStorage.setItem(SZALLAS_OPTIONS_KEY, JSON.stringify(opts));
}

// ── Simple select options for other fields ────────────────────────────────────

const SIMPLE_SELECT: Partial<Record<keyof Guest, string[]>> = {
  visszajelzes: ['', 'Igen', 'Nem', 'Várakozás'],
  meghivoElkuldve: ['', 'Igen', 'Nem'],
  etkezes: ['', 'Igen', 'Nem', 'Vegetáriánus', 'Vegán', 'Egyéb'],
};

const DATE_KEYS: (keyof Guest)[] = ['erkezesDatuma', 'tavozasDatuma'];

// ── CustomizableSelect component ──────────────────────────────────────────────

const ADD_NEW_SENTINEL = '__add_new__';

interface CustomizableSelectProps {
  value: string;
  onChange: (v: string) => void;
}

function CustomizableSelect({ value, onChange }: CustomizableSelectProps) {
  const [customOptions, setCustomOptions] = useState<string[]>(loadCustomSzallasOptions);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const allOptions = [...DEFAULT_SZALLAS_OPTIONS, ...customOptions];

  function handleSelectChange(v: string) {
    if (v === ADD_NEW_SENTINEL) {
      setDraft('');
      setAdding(true);
    } else {
      onChange(v);
    }
  }

  function commitNew() {
    const trimmed = draft.trim();
    if (!trimmed) { setAdding(false); return; }
    if (!allOptions.includes(trimmed)) {
      const next = [...customOptions, trimmed];
      setCustomOptions(next);
      saveCustomSzallasOptions(next);
    }
    onChange(trimmed);
    setAdding(false);
    setDraft('');
  }

  function cancelNew() {
    setAdding(false);
    setDraft('');
  }

  if (adding) {
    return (
      <div className="flex gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitNew(); }
            if (e.key === 'Escape') cancelNew();
          }}
          placeholder="Új szállás neve…"
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-autumn-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-autumn-300"
        />
        <button
          type="button"
          onClick={commitNew}
          className="p-2.5 rounded-lg bg-autumn-600 text-white hover:bg-autumn-700 active:bg-autumn-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Mentés"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={cancelNew}
          className="p-2.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Mégse"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => handleSelectChange(e.target.value)}
      className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 bg-[#FFFCF8] text-gray-800 focus:outline-none focus:ring-2 focus:ring-autumn-300 focus:border-autumn-400 transition-shadow min-h-[44px]"
    >
      <option value="">—</option>
      {allOptions.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
      <option disabled>──────────</option>
      <option value={ADD_NEW_SENTINEL}>＋ Új szállás hozzáadása…</option>
    </select>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function EditModal({ guest, source, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState<Guest | null>(null);

  useEffect(() => {
    setForm(guest ? { ...guest } : null);
  }, [guest]);

  if (!guest || !form) return null;

  const columns = source === 'teljes' ? FULL_LIST_COLUMNS : SZALLAS_COLUMNS;

  function handleChange(key: keyof Guest, value: string) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form) onSave(form);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#FFFCF8] rounded-2xl shadow-2xl shadow-autumn-900/10 w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="px-6 py-4 border-b border-autumn-100 flex items-center justify-between shrink-0">
          <div className="min-w-0 flex-1 mr-2">
            <h2 className="text-lg font-semibold text-autumn-800">Vendég szerkesztése</h2>
            <p className="text-sm text-autumn-600 truncate">{guest.vendegNeve || 'Névtelen vendég'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {columns.map((col) => {
              const simpleOptions = SIMPLE_SELECT[col.key];
              const value = form[col.key] ?? '';
              const isDate = DATE_KEYS.includes(col.key);

              return (
                <div key={col.key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {col.label}
                  </label>

                  {col.key === 'szallasNeve' ? (
                    <CustomizableSelect
                      value={value}
                      onChange={(v) => handleChange(col.key, v)}
                    />
                  ) : simpleOptions ? (
                    <select
                      value={value}
                      onChange={(e) => handleChange(col.key, e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 bg-[#FFFCF8] text-gray-800 focus:outline-none focus:ring-2 focus:ring-autumn-300 focus:border-autumn-400 transition-shadow min-h-[44px]"
                    >
                      {simpleOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt || '—'}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={isDate ? 'date' : 'text'}
                      value={value}
                      onChange={(e) => handleChange(col.key, e.target.value)}
                      placeholder={`${col.label}…`}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 bg-[#FFFCF8] text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-autumn-300 focus:border-autumn-400 transition-shadow min-h-[44px]"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Modal footer */}
          <div className="px-6 py-4 border-t border-autumn-50 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-sm font-medium rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors min-h-[44px]"
            >
              Mégsem
            </button>
            <button
              type="submit"
              className="px-5 py-3 text-sm font-medium rounded-xl text-white bg-autumn-600 hover:bg-autumn-700 active:bg-autumn-800 transition-colors min-h-[44px]"
            >
              Mentés
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
