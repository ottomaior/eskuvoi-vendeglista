import { useEffect, useRef, useState } from 'react';
import type { Guest } from '../types';

interface StatsBarProps {
  guests: Guest[];
  szallasCount: number;
}

// ── Animated counter ──────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = to;
    if (from === to) return;

    let start: number | null = null;
    function step(ts: number) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

interface StatCard {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

export default function StatsBar({ guests, szallasCount }: StatsBarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('eskuvoi-stats-collapsed') === 'true'; } catch { return false; }
  });

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('eskuvoi-stats-collapsed', String(next)); } catch { /* noop */ }
  }

  const total = guests.length;
  const igen = guests.filter((g) => g.visszajelzes?.toLowerCase().trim() === 'igen').length;
  const nem = guests.filter((g) => {
    const v = g.visszajelzes?.toLowerCase().trim();
    return v === 'nem' || v === 'talán' || v === 'talan' || v === 'várakozás' || v === 'varakozas' || !v;
  }).length;

  const animTotal = useCountUp(total);
  const animIgen = useCountUp(igen);
  const animNem = useCountUp(nem);
  const animSzallas = useCountUp(szallasCount);

  const cards: StatCard[] = [
    {
      label: 'Vendég',
      value: animTotal,
      color: 'text-autumn-700',
      bgColor: 'bg-autumn-50',
      borderColor: 'border-autumn-200',
      icon: (
        <svg className="w-5 h-5 text-autumn-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Visszajelzett',
      value: animIgen,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      icon: (
        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Várakozik / Nem',
      value: animNem,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: (
        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Szállást igényel',
      value: animSzallas,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mb-5">
      {/* Collapse toggle */}
      <button
        onClick={toggleCollapse}
        className="w-full flex items-center justify-between text-xs text-stone-400 hover:text-autumn-600 transition-colors py-1 mb-2 group"
      >
        <span className="font-medium group-hover:text-autumn-600">
          {collapsed
            ? `${animTotal} vendég · ${animIgen} visszajelzett · ${animSzallas} szállás`
            : 'Összefoglaló'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Cards */}
      {!collapsed && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm shadow-autumn-200/20 ${card.bgColor} ${card.borderColor} bg-[#FFFCF8]`}
            >
              <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${card.bgColor}`}>
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className={`text-2xl font-semibold leading-none tabular-nums ${card.color}`}>{card.value}</p>
                <p className="text-xs text-stone-500 mt-0.5 leading-tight line-clamp-2">{card.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
