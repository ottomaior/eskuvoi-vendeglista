import React, { useRef } from 'react';

interface TabToolbarProps {
  count: number;
  igenCount?: number;
  onImport: (file: File) => void;
  onExport: () => void;
  onClear: () => void;
  importLabel: string;
  children?: React.ReactNode;
}

export default function TabToolbar({ count, igenCount, onImport, onExport, onClear, importLabel, children }: TabToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { onImport(file); e.target.value = ''; }
  }

  const showProgress = typeof igenCount === 'number' && count > 0;
  const pct = showProgress ? Math.round((igenCount! / count) * 100) : 0;

  return (
    <div className="mb-4 space-y-3">
      {/* RSVP progress bar */}
      {showProgress && (
        <div>
          <div className="flex items-center justify-between mb-1 gap-2">
            <span className="text-sm font-medium text-gray-600 min-w-0">
              <span className="text-emerald-700 font-semibold">{igenCount}</span>
              <span className="text-gray-500"> / {count} visszajelzett</span>
            </span>
            <span className={`text-sm font-semibold shrink-0 ${pct >= 75 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
              {pct}%
            </span>
          </div>
          <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct >= 75 ? 'bg-emerald-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!showProgress && (
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{count}</span> vendég
          </p>
        )}
        {showProgress && <div />}

        <div className="flex flex-wrap items-center gap-2">
          {children}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx,.ods"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg bg-autumn-600 text-white hover:bg-autumn-700 active:bg-autumn-800 transition-colors min-h-[44px]"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="hidden sm:inline">{importLabel}</span>
            <span className="sm:hidden">Betöltés</span>
          </button>
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg bg-[#FFFCF8] text-autumn-700 border border-autumn-200 hover:bg-autumn-50 transition-colors min-h-[44px]"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 13l3 3m0 0l3-3m-3 3V7" />
            </svg>
            <span className="hidden sm:inline">CSV exportálás</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-colors min-h-[44px]"
            title="Lista törlése"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">Lista törlése</span>
          </button>
        </div>
      </div>
    </div>
  );
}
