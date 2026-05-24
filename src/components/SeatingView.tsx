import { useState, useRef } from 'react';
import type { Guest } from '../types';

interface SeatingViewProps {
  guests: Guest[];
  onUpdateGuest: (updated: Guest) => Promise<void>;
}

interface Table {
  id: string;
  label: string;
  x: number;
  y: number;
  seats: number;
}

const TABLE_R = 52;
const CANVAS_W = 900;
const CANVAS_H = 600;

const RSVP_COLOR: Record<string, string> = {
  igen: '#34d399',
  nem: '#f87171',
  'talán': '#fbbf24',
  'talan': '#fbbf24',
  'várakozás': '#fb923c',
  'varakozas': '#fb923c',
  folyamatban: '#60a5fa',
};

function guestColor(g: Guest) {
  return RSVP_COLOR[g.visszajelzes?.toLowerCase().trim() ?? ''] ?? '#d1d5db';
}

function makeDefaultTables(): Table[] {
  const labels = ['1. asztal', '2. asztal', '3. asztal', '4. asztal', '5. asztal', '6. asztal'];
  return labels.map((label, i) => ({
    id: label,
    label,
    x: 140 + (i % 3) * 240,
    y: 120 + Math.floor(i / 3) * 220,
    seats: 8,
  }));
}

export default function SeatingView({ guests, onUpdateGuest }: SeatingViewProps) {
  const [tables, setTables] = useState<Table[]>(makeDefaultTables);
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [_draggingGuest, _setDraggingGuest] = useState<Guest | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [addingTable, setAddingTable] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Group guests by ultetesiRend
  const byTable: Record<string, Guest[]> = {};
  const unseated: Guest[] = [];
  for (const g of guests) {
    const t = g.ultetesiRend?.trim();
    if (t) { if (!byTable[t]) byTable[t] = []; byTable[t].push(g); }
    else unseated.push(g);
  }

  // ── Table drag (move tables on canvas) ───────────────────────────────────────

  function onTableMouseDown(e: React.MouseEvent, tableId: string) {
    if (_draggingGuest) return;
    e.preventDefault();
    setDraggingTable(tableId);
    const table = tables.find((t) => t.id === tableId)!;
    const svgRect = svgRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_W / svgRect.width;
    const scaleY = CANVAS_H / svgRect.height;
    setDragOffset({ x: (e.clientX - svgRect.left) * scaleX - table.x, y: (e.clientY - svgRect.top) * scaleY - table.y });
  }

  function onSvgMouseMove(e: React.MouseEvent) {
    if (!draggingTable) return;
    const svgRect = svgRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_W / svgRect.width;
    const scaleY = CANVAS_H / svgRect.height;
    const nx = Math.max(TABLE_R, Math.min(CANVAS_W - TABLE_R, (e.clientX - svgRect.left) * scaleX - dragOffset.x));
    const ny = Math.max(TABLE_R, Math.min(CANVAS_H - TABLE_R, (e.clientY - svgRect.top) * scaleY - dragOffset.y));
    setTables((prev) => prev.map((t) => t.id === draggingTable ? { ...t, x: nx, y: ny } : t));
  }

  function onSvgMouseUp() {
    setDraggingTable(null);
  }

  // ── Assign guest to table ─────────────────────────────────────────────────────

  async function assignGuest(guest: Guest, tableLabel: string) {
    if (updating === guest.id) return;
    setUpdating(guest.id);
    await onUpdateGuest({ ...guest, ultetesiRend: tableLabel });
    setUpdating(null);
  }

  async function removeGuest(guest: Guest) {
    if (updating === guest.id) return;
    setUpdating(guest.id);
    await onUpdateGuest({ ...guest, ultetesiRend: '' });
    setUpdating(null);
  }

  // ── Add table ────────────────────────────────────────────────────────────────

  function addTable() {
    const label = newLabel.trim() || `${tables.length + 1}. asztal`;
    if (tables.find((t) => t.id === label)) return;
    setTables((prev) => [...prev, {
      id: label, label,
      x: 140 + ((tables.length % 3) * 240),
      y: 120 + (Math.floor(tables.length / 3) * 220),
      seats: 8,
    }]);
    setNewLabel('');
    setAddingTable(false);
  }

  function removeTable(id: string) {
    setTables((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
      {/* ── Canvas ── */}
      <div className="flex-1 bg-[#FFFCF8] border border-autumn-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-autumn-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-autumn-800">Asztaltérkép</h3>
          <div className="flex items-center gap-2">
            {addingTable ? (
              <>
                <input
                  autoFocus
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addTable(); if (e.key === 'Escape') setAddingTable(false); }}
                  placeholder="Asztal neve…"
                  className="text-sm px-3 py-1.5 border border-autumn-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-autumn-300 w-36"
                />
                <button onClick={addTable} className="text-sm px-3 py-1.5 bg-autumn-600 text-white rounded-lg hover:bg-autumn-700 transition-colors">OK</button>
                <button onClick={() => setAddingTable(false)} className="text-sm px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors">Mégse</button>
              </>
            ) : (
              <button
                onClick={() => setAddingTable(true)}
                className="text-sm px-3 py-1.5 bg-autumn-50 text-autumn-700 border border-autumn-200 rounded-lg hover:bg-autumn-100 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Asztal hozzáadása
              </button>
            )}
          </div>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          className="w-full h-[calc(100%-53px)] cursor-default"
          onMouseMove={onSvgMouseMove}
          onMouseUp={onSvgMouseUp}
          onMouseLeave={onSvgMouseUp}
        >
          {/* Grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e8d9c8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={CANVAS_W} height={CANVAS_H} fill="url(#grid)" />

          {/* Tables */}
          {tables.map((table) => {
            const seated = byTable[table.label] ?? [];
            const full = seated.length >= table.seats;
            const fill = full ? '#fef3c7' : '#FBF7F2';
            const stroke = full ? '#f59e0b' : '#D4C4B0';
            return (
              <g
                key={table.id}
                transform={`translate(${table.x}, ${table.y})`}
                className="cursor-move"
                onMouseDown={(e) => onTableMouseDown(e, table.id)}
              >
                <circle r={TABLE_R} fill={fill} stroke={stroke} strokeWidth={1.5} />
                <text y={-6} textAnchor="middle" className="select-none" fontSize={12} fontWeight={600} fill="#6F4F35">
                  {table.label}
                </text>
                <text y={10} textAnchor="middle" className="select-none" fontSize={10} fill="#9a7f65">
                  {seated.length}/{table.seats}
                </text>

                {/* Seated guest dots around perimeter */}
                {seated.slice(0, table.seats).map((g, idx) => {
                  const angle = (idx / table.seats) * 2 * Math.PI - Math.PI / 2;
                  const r = TABLE_R + 22;
                  const gx = Math.cos(angle) * r;
                  const gy = Math.sin(angle) * r;
                  return (
                    <g key={g.id} transform={`translate(${gx}, ${gy})`}>
                      <circle
                        r={14}
                        fill={guestColor(g)}
                        fillOpacity={0.85}
                        stroke="white"
                        strokeWidth={1.5}
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => { e.stopPropagation(); removeGuest(g); }}
                      >
                        <title>{g.vendegNeve}</title>
                      </circle>
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={7}
                        fontWeight={600}
                        fill="white"
                        className="select-none pointer-events-none"
                      >
                        {g.vendegNeve.slice(0, 4)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Unassigned sidebar ── */}
      <div className="w-60 flex flex-col bg-[#FFFCF8] border border-autumn-200 rounded-2xl shadow-sm overflow-hidden shrink-0">
        <div className="px-4 py-3 border-b border-autumn-100">
          <h3 className="text-sm font-semibold text-autumn-800">Nem ültetett</h3>
          <p className="text-xs text-stone-400 mt-0.5">{unseated.length} vendég</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {unseated.length === 0 && (
            <p className="text-xs text-stone-400 text-center py-8">Mindenki el van ültetve 🎉</p>
          )}
          {unseated.map((g) => (
            <div key={g.id} className="bg-autumn-50 border border-autumn-100 rounded-xl px-3 py-2">
              <p className="text-xs font-semibold text-autumn-900 truncate">{g.vendegNeve || '—'}</p>
              <select
                value=""
                onChange={async (e) => {
                  const tableLabel = e.target.value;
                  if (tableLabel) await assignGuest(g, tableLabel);
                }}
                className="mt-1.5 w-full text-xs px-2 py-1.5 border border-autumn-200 rounded-lg bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-autumn-300"
                disabled={updating === g.id}
              >
                <option value="">Asztal kiválasztása…</option>
                {tables.map((t) => {
                  const seated = byTable[t.label]?.length ?? 0;
                  return (
                    <option key={t.id} value={t.label} disabled={seated >= t.seats}>
                      {t.label} ({seated}/{t.seats})
                    </option>
                  );
                })}
              </select>
            </div>
          ))}
        </div>

        {/* Table list for removal */}
        <div className="border-t border-autumn-100 px-4 py-3">
          <p className="text-xs font-semibold text-stone-500 mb-2">Asztalok kezelése</p>
          <div className="space-y-1">
            {tables.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-xs">
                <span className="text-stone-700 truncate">{t.label}</span>
                <button
                  onClick={() => removeTable(t.id)}
                  className="text-stone-300 hover:text-red-400 transition-colors ml-2 shrink-0"
                  title="Asztal törlése"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
