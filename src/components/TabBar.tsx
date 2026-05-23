export type TabId = 'teljes' | 'szallas';

interface TabBarProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  guestCount: number;
  szallasCount: number;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'teljes', label: 'Teljes lista' },
  { id: 'szallas', label: 'Szállás' },
];

export default function TabBar({ activeTab, onChange, guestCount, szallasCount }: TabBarProps) {
  const counts: Record<TabId, number> = { teljes: guestCount, szallas: szallasCount };

  return (
    <div className="bg-[#FFFCF8] border-b border-autumn-200">
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
                {count > 0 && (
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
  );
}
