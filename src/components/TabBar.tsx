export type TabId = 'teljes' | 'szallas' | 'osszesito' | 'kanban' | 'ultetesi';

interface TabBarProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  guestCount: number;
  szallasCount: number;
}

const TABS: { id: TabId; label: string; shortLabel: string }[] = [
  { id: 'teljes',    label: 'Teljes lista',  shortLabel: 'Lista'     },
  { id: 'szallas',   label: 'Szállás',       shortLabel: 'Szállás'   },
  { id: 'kanban',    label: 'RSVP tábla',    shortLabel: 'Kanban'    },
  { id: 'ultetesi',  label: 'Ültetési rend', shortLabel: 'Ültetés'   },
  { id: 'osszesito', label: 'Összesítő',     shortLabel: 'Összesítő' },
];

const MOBILE_TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'teljes',    label: 'Lista',     icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { id: 'szallas',   label: 'Szállás',  icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'kanban',    label: 'Kanban',   icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'ultetesi',  label: 'Ültetés', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'osszesito', label: 'Statisztika', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

export default function TabBar({ activeTab, onChange, guestCount, szallasCount }: TabBarProps) {
  const counts: Partial<Record<TabId, number>> = { teljes: guestCount, szallas: szallasCount, kanban: guestCount };

  return (
    <>
      {/* ── Desktop tab bar ── */}
      <div className="bg-[#FFFCF8] border-b border-autumn-200 hidden sm:block">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-0" role="tablist">
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              const count = counts[tab.id];
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onChange(tab.id)}
                  className={`
                    relative px-5 py-3 text-sm font-medium transition-colors border-b-2
                    ${isActive
                      ? 'border-autumn-500 text-autumn-700'
                      : 'border-transparent text-stone-500 hover:text-autumn-700 hover:border-autumn-200'
                    }
                  `}
                >
                  {tab.label}
                  {count !== undefined && count > 0 && (
                    <span className={`ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs rounded-full font-medium
                      ${isActive ? 'bg-autumn-100 text-autumn-700' : 'bg-stone-100 text-stone-600'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFCF8] border-t border-autumn-200 safe-area-bottom shadow-lg shadow-autumn-900/10">
        <div className="flex">
          {MOBILE_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px] ${
                  isActive ? 'text-autumn-600' : 'text-stone-400'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 1.8} d={tab.icon} />
                </svg>
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Spacer so content isn't hidden behind mobile nav */}
      <div className="sm:hidden h-14" aria-hidden />
    </>
  );
}
