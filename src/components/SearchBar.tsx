interface SearchBarProps {
  search: string;
  filterRsvp: string;
  resultCount: number;
  onSearchChange: (v: string) => void;
  onFilterChange: (v: string) => void;
}

const RSVP_OPTIONS = [
  { value: '', label: 'Összes' },
  { value: 'igen', label: 'Igen' },
  { value: 'nem', label: 'Nem' },
  { value: 'várakozás', label: 'Várakozás' },
  { value: '__empty__', label: 'Nincs visszajelzés' },
];

export default function SearchBar({ search, filterRsvp, resultCount, onSearchChange, onFilterChange }: SearchBarProps) {
  const hasFilter = search !== '' || filterRsvp !== '';

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 mb-3">
      {/* Search input */}
      <div className="relative flex-1 min-w-0">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Keresés név szerint…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border border-stone-200 bg-[#FFFCF8] text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-autumn-300 focus:border-autumn-400 transition-shadow min-h-[44px]"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* RSVP filter */}
        <select
          value={filterRsvp}
          onChange={(e) => onFilterChange(e.target.value)}
          className="flex-1 sm:flex-none px-3 py-2.5 text-sm rounded-lg border border-stone-200 bg-[#FFFCF8] text-stone-700 focus:outline-none focus:ring-2 focus:ring-autumn-300 focus:border-autumn-400 transition-shadow min-h-[44px]"
        >
          {RSVP_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Result count */}
        <span className="text-sm text-gray-500 whitespace-nowrap">
          <span className="font-medium text-gray-700">{resultCount}</span> vendég
        </span>

        {hasFilter && (
          <button
            onClick={() => { onSearchChange(''); onFilterChange(''); }}
            className="text-sm px-3 py-2 rounded-lg text-autumn-600 hover:bg-autumn-50 border border-autumn-200 transition-colors whitespace-nowrap min-h-[44px]"
          >
            Törlés
          </button>
        )}
      </div>
    </div>
  );
}
