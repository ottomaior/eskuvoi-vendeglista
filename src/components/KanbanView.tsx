import { useState } from 'react';
import type { Guest } from '../types';

interface KanbanViewProps {
  guests: Guest[];
  onUpdateRsvp: (guestId: string, newRsvp: string) => Promise<void>;
  onEditGuest: (guest: Guest) => void;
}

const COLUMNS = [
  { id: 'Igen',        label: 'Igen',          color: 'border-t-emerald-400', badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-400' },
  { id: 'Nem',         label: 'Nem',           color: 'border-t-red-400',     badge: 'bg-red-100 text-red-700',         dot: 'bg-red-400' },
  { id: 'Várakozás',   label: 'Várakozás',     color: 'border-t-amber-400',   badge: 'bg-amber-100 text-amber-800',     dot: 'bg-amber-400' },
  { id: '__empty__',   label: 'Nincs adat',    color: 'border-t-gray-300',    badge: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-300' },
];

function normalizeRsvp(v: string): string {
  const map: Record<string, string> = {
    'igen': 'Igen', 'nem': 'Nem',
    'várakozás': 'Várakozás', 'varakozas': 'Várakozás',
  };
  return map[v?.toLowerCase().trim() ?? ''] ?? '__empty__';
}

function GuestCard({
  guest,
  dragging,
  onDragStart,
  onEdit,
}: {
  guest: Guest;
  dragging: boolean;
  onDragStart: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onEdit}
      className={`bg-[#FFFCF8] border border-autumn-200 rounded-xl px-3 py-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow select-none ${dragging ? 'opacity-40 rotate-1' : ''}`}
    >
      <p className="text-sm font-semibold text-autumn-900 leading-snug truncate">{guest.vendegNeve || '—'}</p>
      {guest.telefonszam && (
        <p className="text-xs text-stone-400 mt-0.5 truncate">{guest.telefonszam}</p>
      )}
      {guest.szallasNeve && (
        <p className="text-xs text-stone-400 mt-0.5 truncate">{guest.szallasNeve}</p>
      )}
      {guest.csoportNev && (
        <span className="mt-1.5 inline-block text-xs px-1.5 py-0.5 rounded-md bg-autumn-100 text-autumn-700">
          {guest.csoportNev}
        </span>
      )}
    </div>
  );
}

export default function KanbanView({ guests, onUpdateRsvp, onEditGuest }: KanbanViewProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const grouped: Record<string, Guest[]> = Object.fromEntries(COLUMNS.map((c) => [c.id, []]));
  for (const g of guests) {
    const key = normalizeRsvp(g.visszajelzes ?? '');
    grouped[key]?.push(g);
  }

  function handleDragStart(id: string) {
    setDraggedId(id);
  }

  function handleDragOver(e: React.DragEvent, colId: string) {
    e.preventDefault();
    setDragOverCol(colId);
  }

  async function handleDrop(colId: string) {
    if (!draggedId || updating) return;
    const guest = guests.find((g) => g.id === draggedId);
    if (!guest) return;
    const newRsvp = colId === '__empty__' ? '' : colId;
    const oldNorm = normalizeRsvp(guest.visszajelzes ?? '');
    if (oldNorm === colId) { setDraggedId(null); setDragOverCol(null); return; }
    setUpdating(draggedId);
    await onUpdateRsvp(draggedId, newRsvp);
    setUpdating(null);
    setDraggedId(null);
    setDragOverCol(null);
  }

  return (
    <div className="overflow-x-auto pb-4 max-sm:pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
      <div className="flex gap-3 min-w-max">
        {COLUMNS.map((col) => {
          const colGuests = grouped[col.id] ?? [];
          const isOver = dragOverCol === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => handleDrop(col.id)}
              className={`w-56 flex flex-col gap-2 rounded-2xl border-t-4 bg-autumn-50/60 border border-autumn-100 p-3 transition-colors ${col.color} ${isOver ? 'bg-autumn-100/80 shadow-inner' : ''}`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-1">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${col.badge}`}>
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  {col.label}
                </span>
                <span className="text-xs text-stone-400 font-medium">{colGuests.length}</span>
              </div>

              {/* Guest cards */}
              <div className="flex flex-col gap-2 min-h-[80px]">
                {colGuests.map((g) => (
                  <GuestCard
                    key={g.id}
                    guest={g}
                    dragging={draggedId === g.id}
                    onDragStart={() => handleDragStart(g.id)}
                    onEdit={() => onEditGuest(g)}
                  />
                ))}
                {isOver && draggedId && (
                  <div className="border-2 border-dashed border-autumn-300 rounded-xl h-14 flex items-center justify-center">
                    <span className="text-xs text-autumn-400">Ide húzd</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
