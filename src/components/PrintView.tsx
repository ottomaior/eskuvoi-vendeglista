import { useRef } from 'react';
import type { Guest } from '../types';
import type { RoomDef } from '../utils/rooms';

interface PrintViewProps {
  szallasGuests: Guest[];
  capacities: Record<string, number>;
  rooms: Record<string, RoomDef[]>;
  onClose: () => void;
}

const dateFormatter = new Intl.DateTimeFormat('hu-HU', {
  year: 'numeric', month: 'long', day: 'numeric',
});

function fmt(d: string) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dateFormatter.format(dt);
}

// ── Accommodation summary section ─────────────────────────────────────────────

function AccSection({
  accName,
  guests,
  rooms,
  capacity,
}: {
  accName: string;
  guests: Guest[];
  rooms: RoomDef[];
  capacity: number;
}) {
  // Group guests by room
  const byRoom: Record<string, Guest[]> = {};
  const unassigned: Guest[] = [];
  for (const g of guests) {
    const room = g.szobaszam?.trim();
    if (room) {
      if (!byRoom[room]) byRoom[room] = [];
      byRoom[room].push(g);
    } else {
      unassigned.push(g);
    }
  }

  // Sort rooms: defined rooms first (in definition order), then any unexpected names
  const definedOrder = rooms.map((r) => r.name);
  const allRoomNames = [...new Set([...definedOrder, ...Object.keys(byRoom)])];

  return (
    <div className="print-acc-section">
      <div className="print-acc-header">
        <h2 className="print-acc-name">{accName}</h2>
        <span className="print-acc-meta">
          {guests.length} vendég
          {capacity > 0 ? ` · ${capacity} fő kapacitás` : ''}
        </span>
      </div>

      {allRoomNames.map((roomName) => {
        const roomGuests = byRoom[roomName] ?? [];
        if (roomGuests.length === 0) return null;
        const roomDef = rooms.find((r) => r.name === roomName);
        return (
          <div key={roomName} className="print-room">
            <div className="print-room-header">
              <span className="print-room-name">{roomName}</span>
              {roomDef && (
                <span className="print-room-cap">{roomGuests.length} / {roomDef.capacity} fő</span>
              )}
            </div>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Vendég neve</th>
                  <th>Érkezés</th>
                  <th>Távozás</th>
                  <th>Étkezés</th>
                  <th>Korlátozás</th>
                  <th>Megjegyzés</th>
                </tr>
              </thead>
              <tbody>
                {roomGuests.map((g) => (
                  <tr key={g.id}>
                    <td className="font-medium">{g.vendegNeve || '—'}</td>
                    <td>{fmt(g.erkezesDatuma)}</td>
                    <td>{fmt(g.tavozasDatuma)}</td>
                    <td>{g.etkezes || '—'}</td>
                    <td>{g.etkezesiKorlatozas || '—'}</td>
                    <td>{g.megjegyzes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {unassigned.length > 0 && (
        <div className="print-room">
          <div className="print-room-header">
            <span className="print-room-name print-room-unassigned">Nincs szoba hozzárendelve</span>
            <span className="print-room-cap">{unassigned.length} fő</span>
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th>Vendég neve</th>
                <th>Érkezés</th>
                <th>Távozás</th>
                <th>Étkezés</th>
                <th>Korlátozás</th>
                <th>Megjegyzés</th>
              </tr>
            </thead>
            <tbody>
              {unassigned.map((g) => (
                <tr key={g.id}>
                  <td className="font-medium">{g.vendegNeve || '—'}</td>
                  <td>{fmt(g.erkezesDatuma)}</td>
                  <td>{fmt(g.tavozasDatuma)}</td>
                  <td>{g.etkezes || '—'}</td>
                  <td>{g.etkezesiKorlatozas || '—'}</td>
                  <td>{g.megjegyzes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Catering summary section ──────────────────────────────────────────────────

function CateringSummary({ guests }: { guests: Guest[] }) {
  const counts: Record<string, { total: number; restrictions: Record<string, number> }> = {};
  for (const g of guests) {
    const meal = g.etkezes?.trim() || 'Nincs megjelölve';
    if (!counts[meal]) counts[meal] = { total: 0, restrictions: {} };
    counts[meal].total++;
    const restriction = g.etkezesiKorlatozas?.trim();
    if (restriction) {
      counts[meal].restrictions[restriction] = (counts[meal].restrictions[restriction] ?? 0) + 1;
    }
  }

  const rows = Object.entries(counts).sort(([, a], [, b]) => b.total - a.total);

  return (
    <div className="print-catering">
      <h2 className="print-section-title">Étkezési összesítő</h2>
      <p className="print-section-sub">Összesen: {guests.length} vendég</p>
      <table className="print-table print-catering-table">
        <thead>
          <tr>
            <th>Étkezés típusa</th>
            <th>Darab</th>
            <th>Korlátozások</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([meal, data]) => (
            <tr key={meal}>
              <td className="font-medium">{meal}</td>
              <td className="text-center font-semibold">{data.total}</td>
              <td>
                {Object.entries(data.restrictions).length > 0
                  ? Object.entries(data.restrictions)
                      .map(([r, n]) => `${r} (${n} fő)`)
                      .join(', ')
                  : '—'}
              </td>
            </tr>
          ))}
          <tr className="print-total-row">
            <td className="font-bold">Összesen</td>
            <td className="text-center font-bold">{guests.length}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PrintView({ szallasGuests, capacities, rooms, onClose }: PrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    window.print();
  }

  // Group guests by accommodation
  const byAcc: Record<string, Guest[]> = {};
  for (const g of szallasGuests) {
    const acc = g.szallasNeve?.trim() || 'Ismeretlen szállás';
    if (!byAcc[acc]) byAcc[acc] = [];
    byAcc[acc].push(g);
  }

  const today = new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <>
      {/* ── Screen overlay ── */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-auto p-4">
        <div className="bg-[#FFFCF8] rounded-2xl shadow-2xl w-full max-w-5xl my-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-autumn-200 print:hidden">
            <div>
              <h2 className="text-lg font-semibold text-autumn-800">Szállás összesítő nyomtatása</h2>
              <p className="text-sm text-stone-500 mt-0.5">Ellenőrizd, majd kattints a Nyomtatás gombra</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors min-h-[44px]"
              >
                Mégse
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-autumn-600 hover:bg-autumn-700 transition-colors min-h-[44px] flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Nyomtatás
              </button>
            </div>
          </div>

          {/* Printable content */}
          <div ref={printRef} className="print-content px-8 py-6 overflow-auto max-h-[75vh] print:max-h-none print:overflow-visible">
            {/* Print header */}
            <div className="print-header">
              <h1 className="print-title">Esküvői szállás összesítő</h1>
              <p className="print-date">Nyomtatva: {today}</p>
              <p className="print-summary">
                {szallasGuests.length} szállást igénylő vendég · {Object.keys(byAcc).length} szállás
              </p>
            </div>

            {/* Accommodation sections */}
            {Object.entries(byAcc)
              .sort(([a], [b]) => a.localeCompare(b, 'hu'))
              .map(([accName, accGuests]) => (
                <AccSection
                  key={accName}
                  accName={accName}
                  guests={accGuests}
                  rooms={rooms[accName] ?? []}
                  capacity={capacities[accName] ?? 0}
                />
              ))}

            {/* Catering summary */}
            <CateringSummary guests={szallasGuests} />
          </div>
        </div>
      </div>
    </>
  );
}
