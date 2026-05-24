import { useEffect, useState } from 'react';
import type { AuditEntry } from '../utils/api';
import { fetchLogs, clearLogs } from '../utils/api';

interface ActivityLogProps {
  open: boolean;
  onClose: () => void;
}

const ACTION_LABELS: Record<string, string> = {
  save: 'Szerkesztés',
  add: 'Hozzáadás',
  delete: 'Törlés',
  import: 'Import',
  clear: 'Törlés (összes)',
  batch: 'Tömeges szerkesztés',
  rsvp: 'RSVP frissítés',
};

const FIELD_LABELS: Record<string, string> = {
  visszajelzes: 'Visszajelzés',
  etkezes: 'Étkezés',
  szallasNeve: 'Szállás neve',
  szobaszam: 'Szobaszám',
  telefonszam: 'Telefonszám',
  megjegyzes: 'Megjegyzés',
  csoportNev: 'Csoport',
  etkezesiKorlatozas: 'Étkezési korlátozás',
  ultetesiRend: 'Ültetési rend',
};

function formatRelTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'épp most';
  if (diff < 3600) return `${Math.floor(diff / 60)} perce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} órája`;
  return new Intl.DateTimeFormat('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function ActionIcon({ action }: { action: string }) {
  if (action === 'add') return (
    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </div>
  );
  if (action === 'delete' || action === 'clear') return (
    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </div>
  );
  if (action === 'import') return (
    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    </div>
  );
  return (
    <div className="w-8 h-8 rounded-full bg-autumn-100 flex items-center justify-center shrink-0">
      <svg className="w-4 h-4 text-autumn-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </div>
  );
}

export default function ActivityLog({ open, onClose }: ActivityLogProps) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchLogs().then((data) => { setLogs(data); setLoading(false); }).catch(() => setLoading(false));
  }, [open]);

  async function handleClear() {
    if (!window.confirm('Biztosan törlöd az összes előzményt?')) return;
    await clearLogs();
    setLogs([]);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-md bg-[#FFFCF8] shadow-2xl shadow-black/20 flex flex-col h-full">
        <div className="px-5 py-4 border-b border-autumn-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-autumn-800">Előzmények</h2>
            <p className="text-xs text-stone-400 mt-0.5">Legutóbbi 200 módosítás</p>
          </div>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                onClick={handleClear}
                className="text-xs text-stone-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
              >
                Törlés
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-autumn-300 border-t-autumn-600 rounded-full animate-spin" />
            </div>
          )}
          {!loading && logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
              <svg className="w-12 h-12 mb-3 text-autumn-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">Még nincsenek előzmények</p>
            </div>
          )}
          {!loading && logs.length > 0 && (
            <ul className="space-y-2">
              {logs.map((entry) => (
                <li key={entry.id} className="flex gap-3 items-start py-2">
                  <ActionIcon action={entry.action} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-stone-800 truncate">
                        {entry.guest_name || ACTION_LABELS[entry.action] || entry.action}
                      </span>
                      <span className="text-xs text-stone-400 shrink-0">{formatRelTime(entry.created_at)}</span>
                    </div>
                    {entry.field && (
                      <p className="text-xs text-stone-500 mt-0.5">
                        {FIELD_LABELS[entry.field] ?? entry.field}
                        {entry.old_value && entry.new_value && (
                          <span>: <span className="line-through text-red-400">{entry.old_value}</span> → <span className="text-emerald-600">{entry.new_value}</span></span>
                        )}
                      </p>
                    )}
                    {entry.action && !entry.field && (
                      <p className="text-xs text-stone-400 mt-0.5">{ACTION_LABELS[entry.action] ?? entry.action}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
