import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Guest } from '../types';
import type { RoomDef, AccommodationRooms } from '../utils/rooms';

interface AccommodationViewProps {
  guests: Guest[];
  capacities: Record<string, number>;
  onCapacityChange: (name: string, max: number) => void;
  rooms: AccommodationRooms;
  onRoomsChange: (accName: string, rooms: RoomDef[]) => void;
  onAssignRoom: (guestId: string, roomName: string) => void;
  onEditGuest: (guest: Guest) => void;
  onAddAccommodation: (name: string) => void;
  onRenameAccommodation: (oldName: string, newName: string, maxSlots: number) => void;
  onDeleteAccommodation: (name: string) => void;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function guestHeadcount(g: Guest): number {
  const n = parseInt(g.letszam ?? '', 10);
  return isNaN(n) || n < 1 ? 1 : n;
}

const dateFormatter = new Intl.DateTimeFormat('hu-HU', { month: 'short', day: 'numeric' });
function shortDate(v: string): string {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : dateFormatter.format(d);
}

const BADGE: Record<string, string> = {
  'igen': 'bg-emerald-100 text-emerald-800',
  'nem': 'bg-red-100 text-red-700',
  'talán': 'bg-yellow-100 text-yellow-800',
  'talan': 'bg-yellow-100 text-yellow-800',
  'várakozás': 'bg-amber-100 text-amber-800',
  'varakozas': 'bg-amber-100 text-amber-800',
  'folyamatban': 'bg-blue-100 text-blue-800',
};

function RsvpBadge({ value }: { value: string }) {
  if (!value) return <span className="text-gray-300 text-xs">—</span>;
  const cls = BADGE[value.toLowerCase().trim()] ?? 'bg-gray-100 text-gray-600';
  return <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{value}</span>;
}

// ── Inline capacity editor (fallback, shown when no rooms defined) ─────────────

function CapacityEditor({ name, value, onChange }: { name: string; value: number | undefined; onChange: (n: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  function commit() {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n > 0) onChange(n);
    setEditing(false);
  }

  if (editing) {
    return (
      <input ref={inputRef} type="number" min={1} value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-14 text-center text-sm font-semibold border border-autumn-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-autumn-300"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <button onClick={(e) => { e.stopPropagation(); setDraft(String(value ?? '')); setEditing(true); }}
      className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-autumn-600 transition-colors group/cap"
      title={`Kapacitás szerkesztése: ${name}`}
    >
      <span>max: <span className="font-semibold text-gray-700">{value ?? '?'}</span></span>
      <svg className="w-3.5 h-3.5 opacity-40 group-hover/cap:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  );
}

// ── Room chip ─────────────────────────────────────────────────────────────────

function roomOccupied(room: RoomDef, guests: Guest[]): number {
  return guests
    .filter((g) => (g.szobaszam ?? '').trim() === room.name.trim())
    .reduce((s, g) => s + guestHeadcount(g), 0);
}

function RoomChip({
  room, guests, onEdit, onDelete,
}: {
  room: RoomDef;
  guests: Guest[];
  onEdit: (r: RoomDef) => void;
  onDelete: (id: string) => void;
}) {
  const occ = roomOccupied(room, guests);
  const free = room.capacity - occ;
  const full = free <= 0;
  const almost = !full && free <= 1 && room.capacity > 1;
  const dotCls = full ? 'bg-red-400' : almost ? 'bg-amber-400' : 'bg-emerald-400';
  const borderCls = full ? 'border-red-200 bg-red-50' : almost ? 'border-amber-200 bg-amber-50' : 'border-emerald-100 bg-emerald-50/60';

  return (
    <div className={`group/chip flex items-start justify-between gap-1 px-2.5 py-2 rounded-lg border text-xs ${borderCls} min-w-[90px]`}>
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotCls}`} />
          <span className="font-medium text-gray-800 truncate">{room.name}</span>
        </div>
        <div className="text-gray-500 tabular-nums pl-3.5">
          {occ} / {room.capacity} fő{full ? ' · tele' : free === room.capacity ? ' · szabad' : ''}
        </div>
      </div>
      {/* Actions always visible on mobile, hover on desktop */}
      <div className="flex gap-0.5 shrink-0 sm:opacity-0 sm:group-hover/chip:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onEdit(room); }}
          className="p-1.5 rounded text-gray-400 hover:text-autumn-600 hover:bg-white active:bg-autumn-100 transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
          title="Szoba szerkesztése"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(room.id); }}
          className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-white active:bg-red-50 transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
          title="Szoba törlése"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Add / edit room inline form ───────────────────────────────────────────────

function RoomForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: RoomDef;
  onSave: (name: string, capacity: number) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [cap, setCap] = useState(String(initial?.capacity ?? ''));
  const [errors, setErrors] = useState<{ name?: boolean; cap?: boolean }>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  function commit() {
    const n = name.trim();
    const c = cap.trim() === '' ? 1 : parseInt(cap, 10);
    const errs = { name: !n, cap: isNaN(c) || c < 1 };
    if (errs.name || errs.cap) { setErrors(errs); return; }
    onSave(n, c);
  }

  return (
    <div className="flex flex-col gap-2 mt-2 w-full" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1.5">
        <input
          ref={nameRef}
          type="text"
          placeholder="Szoba neve…"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((e2) => ({ ...e2, name: false })); }}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onCancel(); }}
          className={`flex-1 min-w-0 px-2.5 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 min-h-[40px] ${errors.name ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-autumn-300 focus:ring-autumn-300'}`}
        />
        <input
          type="number"
          min={1}
          max={99}
          placeholder="fő"
          value={cap}
          onChange={(e) => { setCap(e.target.value); setErrors((e2) => ({ ...e2, cap: false })); }}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onCancel(); }}
          className={`w-16 px-2.5 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 text-center min-h-[40px] ${errors.cap ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-autumn-300 focus:ring-autumn-300'}`}
        />
      </div>
      {(errors.name || errors.cap) && (
        <p className="text-xs text-red-500">
          {errors.name ? 'Adj meg szoba nevet. ' : ''}{errors.cap ? 'A kapacitásnak legalább 1-nek kell lennie.' : ''}
        </p>
      )}
      <div className="flex gap-1.5">
        <button onClick={commit}
          className="flex-1 px-3 py-2 text-sm rounded-lg bg-autumn-600 text-white hover:bg-autumn-700 active:bg-autumn-800 transition-colors min-h-[40px]"
        >Mentés</button>
        <button onClick={onCancel}
          className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors min-h-[40px]"
        >Mégse</button>
      </div>
    </div>
  );
}

// ── Room assignment dropdown ──────────────────────────────────────────────────

function RoomSelector({
  guestId,
  currentRoom,
  accRooms,
  allGuests,
  onAssign,
}: {
  guestId: string;
  currentRoom: string;
  accRooms: RoomDef[];
  allGuests: Guest[];
  onAssign: (guestId: string, roomName: string) => void;
}) {
  const thisGuest = allGuests.find((g) => g.id === guestId);
  const thisCount = thisGuest ? guestHeadcount(thisGuest) : 1;

  // Rooms that guests already have assigned but are not in the formal room definitions
  // (e.g. came from a CSV import). Sort them numerically when possible.
  const definedNames = new Set(accRooms.map((r) => r.name.trim()));
  const virtualRoomNames = [
    ...new Set(
      allGuests
        .map((g) => (g.szobaszam ?? '').trim())
        .filter((name) => name && !definedNames.has(name))
    ),
  ].sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b, 'hu');
  });

  // If there are no formal rooms AND no virtual rooms, just show the current value as a badge
  if (accRooms.length === 0 && virtualRoomNames.length === 0) {
    return currentRoom
      ? <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">{currentRoom}</span>
      : null;
  }

  return (
    <select
      value={currentRoom || ''}
      onChange={(e) => { e.stopPropagation(); onAssign(guestId, e.target.value); }}
      onClick={(e) => e.stopPropagation()}
      className="text-xs rounded-lg border border-stone-200 bg-[#FFFCF8] text-stone-700 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-autumn-300 focus:border-autumn-400 min-h-[36px] min-w-[80px] max-w-[140px]"
    >
      <option value="">— szoba</option>

      {/* Formally defined rooms (with capacity tracking) */}
      {accRooms.map((room) => {
        const occ = roomOccupied(room, allGuests);
        const isCurrentRoom = currentRoom === room.name;
        // wouldFit: add back thisCount for the current room so the guest can "remain" there
        const wouldFit = (isCurrentRoom ? room.capacity - occ + thisCount : room.capacity - occ) >= thisCount;
        // displayFree: actual free slots (no self-removal trick — just show reality)
        const displayFree = room.capacity - occ;
        return (
          <option key={room.id} value={room.name} disabled={!wouldFit && !isCurrentRoom}>
            {room.name} ({displayFree > 0 ? `${displayFree} szabad` : 'tele'})
          </option>
        );
      })}

      {/* Virtual rooms from CSV import (no capacity definition) */}
      {virtualRoomNames.length > 0 && accRooms.length > 0 && (
        <option disabled>──────────</option>
      )}
      {virtualRoomNames.map((name) => {
        const occ = allGuests
          .filter((g) => (g.szobaszam ?? '').trim() === name)
          .reduce((s, g) => s + guestHeadcount(g), 0);
        return (
          <option key={name} value={name}>
            {name} ({occ} fő)
          </option>
        );
      })}
    </select>
  );
}

// ── Rooms section ─────────────────────────────────────────────────────────────

function RoomsSection({
  accRooms,
  guests,
  onRoomsChange,
}: {
  accName?: string;
  accRooms: RoomDef[];
  guests: Guest[];
  onRoomsChange: (rooms: RoomDef[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleAdd(name: string, capacity: number) {
    onRoomsChange([...accRooms, { id: uuidv4(), name, capacity }]);
    setAdding(false);
  }

  function handleEdit(id: string, name: string, capacity: number) {
    onRoomsChange(accRooms.map((r) => r.id === id ? { ...r, name, capacity } : r));
    setEditingId(null);
  }

  function handleDelete(id: string) {
    if (window.confirm('Biztosan törli ezt a szobát?')) {
      onRoomsChange(accRooms.filter((r) => r.id !== id));
    }
  }

  return (
    <div className="px-4 py-3 border-t border-autumn-100 bg-autumn-50/40">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Szobák</span>
        {!adding && (
          <button
            onClick={(e) => { e.stopPropagation(); setAdding(true); }}
            className="inline-flex items-center gap-1 text-xs text-autumn-600 hover:text-autumn-700 active:text-autumn-800 font-medium transition-colors px-2 py-1.5 rounded-md hover:bg-autumn-50 min-h-[32px]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Szoba
          </button>
        )}
      </div>

      {accRooms.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {accRooms.map((room) =>
            editingId === room.id ? (
              <RoomForm
                key={room.id}
                initial={room}
                onSave={(n, c) => handleEdit(room.id, n, c)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <RoomChip
                key={room.id}
                room={room}
                guests={guests}
                onEdit={(r) => setEditingId(r.id)}
                onDelete={handleDelete}
              />
            )
          )}
        </div>
      )}

      {adding && (
        <RoomForm
          onSave={handleAdd}
          onCancel={() => setAdding(false)}
        />
      )}

      {accRooms.length === 0 && !adding && (
        <p className="text-xs text-gray-400 italic">Még nincsenek szobák megadva</p>
      )}
    </div>
  );
}

// ── Single accommodation card ─────────────────────────────────────────────────

function AccommodationCard({
  name,
  guests,
  maxSlots,
  accRooms,
  onCapacityChange,
  onRoomsChange,
  onAssignRoom,
  onEditGuest,
  onRename,
  onDelete,
}: {
  name: string;
  guests: Guest[];
  maxSlots: number | undefined;
  accRooms: RoomDef[];
  onCapacityChange: (n: number) => void;
  onRoomsChange: (rooms: RoomDef[]) => void;
  onAssignRoom: (guestId: string, roomName: string) => void;
  onEditGuest: (g: Guest) => void;
  onRename?: (newName: string, maxSlots: number) => void;
  onDelete?: () => void;
}) {
  const [editingHeader, setEditingHeader] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftCap, setDraftCap] = useState(String(maxSlots ?? ''));
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editingHeader) nameInputRef.current?.select(); }, [editingHeader]);

  function openHeaderEdit() {
    setDraftName(name);
    setDraftCap(String(maxSlots ?? ''));
    setEditingHeader(true);
  }

  function commitHeaderEdit() {
    const newName = draftName.trim();
    if (!newName) return;
    const cap = parseInt(draftCap, 10);
    onRename?.(newName, isNaN(cap) || cap < 0 ? 0 : cap);
    setEditingHeader(false);
  }

  const hasRooms = accRooms.length > 0;
  const roomsTotal = hasRooms ? accRooms.reduce((s, r) => s + r.capacity, 0) : (maxSlots ?? 0);
  const occupied = guests.reduce((sum, g) => sum + guestHeadcount(g), 0);
  const effectiveMax = roomsTotal > 0 ? roomsTotal : maxSlots;
  const hasMax = typeof effectiveMax === 'number' && effectiveMax > 0;
  const pct = hasMax ? Math.min(Math.round((occupied / effectiveMax!) * 100), 100) : null;
  const barColor = pct === null ? 'bg-gray-300' : pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-400';
  const pctColor = pct === null ? 'text-gray-400' : pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-emerald-600';
  const isUnassigned = name === '__unassigned__';

  return (
    <div className="bg-[#FFFCF8] rounded-xl border border-autumn-200 shadow-sm shadow-autumn-200/25 overflow-hidden">
      {/* Card header */}
      <div className="px-4 pt-4 pb-3">
        {!isUnassigned && editingHeader ? (
          /* ── Inline header edit form ── */
          <div className="flex flex-col gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-2">
              <input
                ref={nameInputRef}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitHeaderEdit(); if (e.key === 'Escape') setEditingHeader(false); }}
                placeholder="Szálláshely neve…"
                className="flex-1 min-w-0 px-2.5 py-2 text-sm font-semibold rounded-lg border border-autumn-300 focus:outline-none focus:ring-2 focus:ring-autumn-400 min-h-[40px]"
              />
              <input
                type="number"
                min={0}
                placeholder="max fő"
                value={draftCap}
                onChange={(e) => setDraftCap(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitHeaderEdit(); if (e.key === 'Escape') setEditingHeader(false); }}
                className="w-20 px-2.5 py-2 text-sm rounded-lg border border-autumn-300 focus:outline-none focus:ring-2 focus:ring-autumn-400 text-center min-h-[40px]"
                title="Max kapacitás (fő)"
              />
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={commitHeaderEdit}
                disabled={!draftName.trim()}
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-autumn-600 text-white hover:bg-autumn-700 disabled:opacity-40 transition-colors min-h-[38px]"
              >Mentés</button>
              <button
                onClick={() => setEditingHeader(false)}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-500 hover:bg-stone-50 transition-colors min-h-[38px]"
              >Mégse</button>
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingHeader(false); onDelete(); }}
                  className="px-3 py-2 text-sm rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors min-h-[38px]"
                  title="Szálláshely törlése"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className={`font-display font-semibold text-base leading-tight truncate ${isUnassigned ? 'text-gray-400 italic' : 'text-autumn-800'}`}>
                {isUnassigned ? 'Nincs szállás megadva' : name}
              </h3>
              {!isUnassigned && onRename && (
                <button
                  onClick={(e) => { e.stopPropagation(); openHeaderEdit(); }}
                  className="shrink-0 p-1 rounded text-gray-300 hover:text-autumn-500 hover:bg-autumn-50 transition-colors"
                  title="Szálláshely szerkesztése"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!isUnassigned && !hasRooms && (
                <CapacityEditor name={name} value={maxSlots} onChange={onCapacityChange} />
              )}
              <span className={`text-sm font-semibold tabular-nums ${pctColor}`}>
                {occupied}{hasMax ? ` / ${effectiveMax}` : ' fő'}
              </span>
            </div>
          </div>
        )}

        {!isUnassigned && !editingHeader && (
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct ?? (occupied > 0 ? 100 : 0)}%` }}
            />
          </div>
        )}
        {!editingHeader && pct !== null && (
          <p className={`text-xs mt-1 font-medium ${pctColor}`}>{pct}% foglalt</p>
        )}
      </div>

      {/* Rooms section */}
      {!isUnassigned && (
        <RoomsSection
          accName={name}
          accRooms={accRooms}
          guests={guests}
          onRoomsChange={onRoomsChange}
        />
      )}

      {/* Guest rows */}
      {guests.length > 0 ? (
        <div className="border-t border-autumn-50 divide-y divide-autumn-50">
          {guests.map((g) => {
            const from = shortDate(g.erkezesDatuma ?? '');
            const to = shortDate(g.tavozasDatuma ?? '');
            const dates = from || to ? `${from}${from && to ? '–' : ''}${to}` : '';
            return (
              <div
                key={g.id}
                className="px-4 py-2 flex items-center gap-3 hover:bg-autumn-50/60 cursor-pointer group/row transition-colors"
                onClick={() => onEditGuest(g)}
              >
                {/* RSVP stripe */}
                <div className={`w-1 h-6 rounded-full shrink-0 ${
                  g.visszajelzes?.toLowerCase().trim() === 'igen' ? 'bg-emerald-400'
                  : g.visszajelzes?.toLowerCase().trim() === 'nem' ? 'bg-red-400'
                  : (g.visszajelzes?.toLowerCase().trim() === 'talán' || g.visszajelzes?.toLowerCase().trim() === 'talan' || g.visszajelzes?.toLowerCase().trim() === 'várakozás') ? 'bg-amber-400'
                  : 'bg-gray-200'
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800 truncate">{g.vendegNeve || '—'}</span>
                    {parseInt(g.letszam ?? '', 10) > 1 && (
                      <span className="text-xs text-gray-400">{g.letszam} fő</span>
                    )}
                    <RsvpBadge value={g.visszajelzes ?? ''} />
                    {dates && <span className="text-xs text-gray-400">{dates}</span>}
                    {g.etkezesiKorlatozas && (
                      <span className="text-xs bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded" title="Étkezési korlátozás">{g.etkezesiKorlatozas}</span>
                    )}
                  </div>
                  {g.megjegyzes && <p className="text-xs text-gray-400 mt-0.5 truncate">{g.megjegyzes}</p>}
                </div>

                {/* Room assignment */}
                <div onClick={(e) => e.stopPropagation()}>
                  <RoomSelector
                    guestId={g.id}
                    currentRoom={g.szobaszam ?? ''}
                    accRooms={accRooms}
                    allGuests={guests}
                    onAssign={onAssignRoom}
                  />
                </div>

                <svg className="w-4 h-4 text-autumn-400 sm:opacity-0 sm:group-hover/row:opacity-100 shrink-0 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-4 pb-4 text-xs text-gray-400 italic">Még nincs vendég hozzárendelve</div>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function AccommodationView({
  guests,
  capacities,
  onCapacityChange,
  rooms,
  onRoomsChange,
  onAssignRoom,
  onEditGuest,
  onAddAccommodation,
  onRenameAccommodation,
  onDeleteAccommodation,
}: AccommodationViewProps) {
  const [addingAcc, setAddingAcc] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const newAccInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingAcc) newAccInputRef.current?.focus();
  }, [addingAcc]);

  function handleConfirmAddAcc() {
    const name = newAccName.trim();
    if (!name) return;
    onAddAccommodation(name);
    setNewAccName('');
    setAddingAcc(false);
  }
  const groups = new Map<string, Guest[]>();
  const unassigned: Guest[] = [];

  for (const g of guests) {
    const key = g.szallasNeve?.trim() || '';
    if (!key) {
      unassigned.push(g);
    } else {
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(g);
    }
  }

  // Also show accommodations that exist in capacities but have no guests yet
  for (const name of Object.keys(capacities)) {
    if (!groups.has(name)) groups.set(name, []);
  }

  const sortedGroups = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'hu'));

  // Total capacity: prefer sum of rooms, else manual capacities
  const totalMax = [...groups.keys()].reduce((sum, name) => {
    const accRooms = rooms[name] ?? [];
    const roomTotal = accRooms.reduce((s, r) => s + r.capacity, 0);
    return sum + (roomTotal > 0 ? roomTotal : (capacities[name] ?? 0));
  }, 0);
  const totalOccupied = guests.reduce((s, g) => s + guestHeadcount(g), 0);


  return (
    <div className="space-y-4">
      {guests.length === 0 && sortedGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <svg className="w-12 h-12 mb-3 text-autumn-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <p className="text-sm">Nincsenek szállással rendelkező vendégek</p>
        </div>
      )}

      {/* Overall summary */}
      {totalMax > 0 && (
        <div className="bg-[#FFFCF8] rounded-xl border border-autumn-200 px-4 py-3 shadow-sm shadow-autumn-200/25">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="text-sm font-medium text-gray-600">Összes foglaltság</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold text-gray-700 tabular-nums">{totalOccupied} / {totalMax} fő</span>
              <span className="text-lg font-bold tabular-nums text-autumn-700">
                {Math.round((totalOccupied / totalMax) * 100)}%
              </span>
            </div>
          </div>
          <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalOccupied / totalMax >= 1 ? 'bg-red-400' : totalOccupied / totalMax >= 0.8 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(Math.round((totalOccupied / totalMax) * 100), 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedGroups.map(([name, groupGuests]) => (
          <AccommodationCard
            key={name}
            name={name}
            guests={groupGuests}
            maxSlots={capacities[name]}
            accRooms={rooms[name] ?? []}
            onCapacityChange={(n) => onCapacityChange(name, n)}
            onRoomsChange={(r) => onRoomsChange(name, r)}
            onAssignRoom={onAssignRoom}
            onEditGuest={onEditGuest}
            onRename={(newName, maxSlots) => onRenameAccommodation(name, newName, maxSlots)}
            onDelete={() => onDeleteAccommodation(name)}
          />
        ))}
        {unassigned.length > 0 && (
          <AccommodationCard
            key="__unassigned__"
            name="__unassigned__"
            guests={unassigned}
            maxSlots={undefined}
            accRooms={[]}
            onCapacityChange={() => {}}
            onRoomsChange={() => {}}
            onAssignRoom={onAssignRoom}
            onEditGuest={onEditGuest}
          />
        )}

        {/* Add accommodation card */}
        {addingAcc ? (
          <div className="rounded-xl border-2 border-dashed border-autumn-300 bg-[#FFFCF8] p-4 flex flex-col gap-3 shadow-sm">
            <p className="text-sm font-semibold text-autumn-700">Új szálláshely neve</p>
            <input
              ref={newAccInputRef}
              value={newAccName}
              onChange={(e) => setNewAccName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmAddAcc(); if (e.key === 'Escape') setAddingAcc(false); }}
              placeholder="pl. Vendégház..."
              className="w-full px-3 py-2.5 rounded-lg border border-autumn-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-autumn-400 min-h-[44px]"
            />
            <div className="flex gap-2">
              <button
                onClick={handleConfirmAddAcc}
                disabled={!newAccName.trim()}
                className="flex-1 px-3 py-2.5 rounded-lg bg-autumn-600 text-white text-sm font-medium hover:bg-autumn-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
              >
                Hozzáad
              </button>
              <button
                onClick={() => { setAddingAcc(false); setNewAccName(''); }}
                className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-stone-50 transition-colors min-h-[44px]"
              >
                Mégse
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingAcc(true)}
            className="rounded-xl border-2 border-dashed border-autumn-200 bg-[#FFFCF8]/60 hover:bg-autumn-50 hover:border-autumn-300 transition-colors flex flex-col items-center justify-center gap-2 p-6 text-autumn-500 hover:text-autumn-700 min-h-[100px]"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">Új szálláshely</span>
          </button>
        )}
      </div>
    </div>
  );
}
