import { useState } from 'react';

interface BatchActionBarProps {
  count: number;
  onClear: () => void;
  onApplyRsvp: (value: string) => Promise<void>;
  onApplyGroup: (value: string) => Promise<void>;
}

const RSVP_OPTIONS = ['Igen', 'Nem', 'Talán', 'Várakozás', 'Folyamatban'];

export default function BatchActionBar({ count, onClear, onApplyRsvp, onApplyGroup }: BatchActionBarProps) {
  const [mode, setMode] = useState<'rsvp' | 'group' | null>(null);
  const [rsvpValue, setRsvpValue] = useState('Igen');
  const [groupValue, setGroupValue] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleApplyRsvp() {
    setLoading(true);
    await onApplyRsvp(rsvpValue);
    setMode(null);
    setLoading(false);
  }

  async function handleApplyGroup() {
    setLoading(true);
    await onApplyGroup(groupValue);
    setMode(null);
    setGroupValue('');
    setLoading(false);
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 w-[calc(100vw-2rem)] max-w-xl">
      <div className="bg-autumn-800 text-white rounded-2xl shadow-2xl shadow-black/30 px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {count} vendég kiválasztva
          </span>
          <button
            onClick={onClear}
            className="text-autumn-300 hover:text-white transition-colors text-xs"
          >
            Mégsem
          </button>
        </div>

        {mode === null && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setMode('rsvp')}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-xl text-sm font-medium"
            >
              Visszajelzés beállítása
            </button>
            <button
              onClick={() => setMode('group')}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-xl text-sm font-medium"
            >
              Csoport beállítása
            </button>
          </div>
        )}

        {mode === 'rsvp' && (
          <div className="flex items-center gap-2">
            <select
              value={rsvpValue}
              onChange={(e) => setRsvpValue(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {RSVP_OPTIONS.map((o) => <option key={o} value={o} className="bg-autumn-800">{o}</option>)}
            </select>
            <button
              onClick={handleApplyRsvp}
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 transition-colors rounded-xl text-sm font-semibold"
            >
              {loading ? '…' : 'Alkalmaz'}
            </button>
            <button onClick={() => setMode(null)} className="text-autumn-300 hover:text-white text-sm">Vissza</button>
          </div>
        )}

        {mode === 'group' && (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={groupValue}
              onChange={(e) => setGroupValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleApplyGroup(); if (e.key === 'Escape') setMode(null); }}
              placeholder="Csoport neve (pl. Menyasszony oldala)…"
              className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              onClick={handleApplyGroup}
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 transition-colors rounded-xl text-sm font-semibold"
            >
              {loading ? '…' : 'Alkalmaz'}
            </button>
            <button onClick={() => setMode(null)} className="text-autumn-300 hover:text-white text-sm">Vissza</button>
          </div>
        )}
      </div>
    </div>
  );
}
