import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip,
} from 'recharts';
import type { Guest } from '../types';
import type { RoomDef } from '../utils/rooms';

interface DashboardViewProps {
  guests: Guest[];
  szallasGuests: Guest[];
  capacities: Record<string, number>;
  rooms: Record<string, RoomDef[]>;
}

// ── RSVP doughnut ─────────────────────────────────────────────────────────────

const RSVP_COLORS: Record<string, string> = {
  'Igen':         '#34d399',
  'Nem':          '#f87171',
  'Talán':        '#fbbf24',
  'Várakozás':    '#fb923c',
  'Folyamatban':  '#60a5fa',
  'Nincs adat':   '#d1d5db',
};

function rsvpLabel(v: string): string {
  const map: Record<string, string> = {
    igen: 'Igen', nem: 'Nem', talán: 'Talán', talan: 'Talán',
    várakozás: 'Várakozás', varakozas: 'Várakozás', folyamatban: 'Folyamatban',
  };
  return map[v.toLowerCase().trim()] ?? 'Nincs adat';
}

function buildRsvpData(guests: Guest[]) {
  const counts: Record<string, number> = {};
  for (const g of guests) {
    const label = rsvpLabel(g.visszajelzes ?? '');
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort(([a], [b]) => {
      const order = ['Igen', 'Nem', 'Talán', 'Várakozás', 'Folyamatban', 'Nincs adat'];
      return order.indexOf(a) - order.indexOf(b);
    })
    .map(([name, value]) => ({ name, value }));
}

// ── Meal bar chart ────────────────────────────────────────────────────────────

function buildMealData(guests: Guest[]) {
  const counts: Record<string, number> = {};
  for (const g of guests) {
    const v = g.etkezes?.trim();
    if (!v) continue;
    counts[v] = (counts[v] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));
}

// ── Accommodation fill ────────────────────────────────────────────────────────

function buildAccFill(szallasGuests: Guest[], capacities: Record<string, number>) {
  const filled: Record<string, number> = {};
  for (const g of szallasGuests) {
    const name = g.szallasNeve?.trim();
    if (!name) continue;
    filled[name] = (filled[name] ?? 0) + 1;
  }
  const allNames = new Set([...Object.keys(capacities), ...Object.keys(filled)]);
  return [...allNames].map((name) => ({
    name,
    foglalt: filled[name] ?? 0,
    szabad: Math.max(0, (capacities[name] ?? 0) - (filled[name] ?? 0)),
    kapacitas: capacities[name] ?? 0,
  })).sort((a, b) => b.foglalt - a.foglalt);
}

// ── Custom tooltip for doughnut ───────────────────────────────────────────────

function RsvpTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-autumn-200 rounded-xl px-3 py-2 shadow-lg text-sm">
      <span className="font-semibold text-autumn-800">{name}</span>
      <span className="ml-2 text-stone-600">{value} fő</span>
    </div>
  );
}

function MealTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-autumn-200 rounded-xl px-3 py-2 shadow-lg text-sm">
      <span className="font-semibold text-autumn-800">{label}</span>
      <span className="ml-2 text-stone-600">{payload[0].value} fő</span>
    </div>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

function StatTile({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="bg-[#FFFCF8] border border-autumn-200 rounded-xl px-5 py-4 shadow-sm">
      <p className={`text-3xl font-bold leading-none ${color}`}>{value}</p>
      <p className="text-sm font-medium text-stone-600 mt-1">{label}</p>
      {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DashboardView({ guests, szallasGuests, capacities, rooms }: DashboardViewProps) {
  const rsvpData = buildRsvpData(guests);
  const mealData = buildMealData(guests);
  const accFill = buildAccFill(szallasGuests, capacities);

  const igen = guests.filter((g) => rsvpLabel(g.visszajelzes ?? '') === 'Igen').length;
  const nem = guests.filter((g) => rsvpLabel(g.visszajelzes ?? '') === 'Nem').length;
  const totalRooms = Object.values(rooms).reduce((s, arr) => s + arr.length, 0);
  const pct = guests.length > 0 ? Math.round((igen / guests.length) * 100) : 0;

  const noMeal = guests.filter((g) => !g.etkezes?.trim()).length;

  if (guests.length === 0 && szallasGuests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-400">
        <svg className="w-16 h-16 mb-4 text-autumn-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-base">Még nincsenek vendégek — tölts fel egy listát az Összesítőhöz.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Összes vendég" value={guests.length} color="text-autumn-700" />
        <StatTile label="Visszajelzett (Igen)" value={igen} sub={`${pct}%`} color="text-emerald-600" />
        <StatTile label="Nem jön / Bizonytalan" value={nem} color="text-red-500" />
        <StatTile label="Szállást igényel" value={szallasGuests.length} color="text-blue-600" />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doughnut */}
        <div className="bg-[#FFFCF8] border border-autumn-200 rounded-2xl shadow-sm p-5">
          <h3 className="text-base font-semibold text-autumn-800 mb-4">Visszajelzések megoszlása</h3>
          {rsvpData.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-12">Még nincs adat</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={rsvpData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {rsvpData.map((entry) => (
                    <Cell key={entry.name} fill={RSVP_COLORS[entry.name] ?? '#d1d5db'} />
                  ))}
                </Pie>
                <PieTooltip content={<RsvpTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-xs text-stone-700">{value}</span>}
                  iconType="circle"
                  iconSize={10}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart: meals */}
        <div className="bg-[#FFFCF8] border border-autumn-200 rounded-2xl shadow-sm p-5">
          <h3 className="text-base font-semibold text-autumn-800 mb-1">Étkezési igények</h3>
          {noMeal > 0 && (
            <p className="text-xs text-stone-400 mb-3">{noMeal} vendégnél nincs étkezés megjelölve</p>
          )}
          {mealData.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-12">Még nincs adat</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={mealData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8d9c8" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#78716c' }} />
                <YAxis tick={{ fontSize: 12, fill: '#78716c' }} allowDecimals={false} />
                <BarTooltip content={<MealTooltip />} />
                <Bar dataKey="value" name="Vendég" fill="#C4A07A" radius={[6, 6, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Accommodation fill ── */}
      {accFill.length > 0 && (
        <div className="bg-[#FFFCF8] border border-autumn-200 rounded-2xl shadow-sm p-5">
          <h3 className="text-base font-semibold text-autumn-800 mb-4">
            Szálláskihasználtság
            <span className="ml-2 text-xs font-normal text-stone-400">({totalRooms} szoba összesen)</span>
          </h3>
          <div className="space-y-3">
            {accFill.map((acc) => {
              const pctFill = acc.kapacitas > 0 ? Math.min(100, Math.round((acc.foglalt / acc.kapacitas) * 100)) : 0;
              const barColor = pctFill >= 90 ? 'bg-red-400' : pctFill >= 60 ? 'bg-amber-400' : 'bg-emerald-400';
              return (
                <div key={acc.name}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium text-stone-700 truncate max-w-[60%]">{acc.name}</span>
                    <span className="text-xs text-stone-500 shrink-0 ml-2">
                      {acc.foglalt}{acc.kapacitas > 0 ? ` / ${acc.kapacitas} fő` : ' fő'}
                    </span>
                  </div>
                  {acc.kapacitas > 0 && (
                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${pctFill}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
