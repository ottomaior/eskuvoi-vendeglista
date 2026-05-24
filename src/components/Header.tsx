interface HeaderProps {
  guestCount: number;
  szallasCount: number;
  darkMode: boolean;
  onToggleDark: () => void;
  onOpenLog: () => void;
}

export default function Header({ guestCount, szallasCount, darkMode, onToggleDark, onOpenLog }: HeaderProps) {
  return (
    <header className="bg-[#FFFCF8] dark:bg-stone-900 border-b border-autumn-200 dark:border-stone-700 shadow-sm shadow-autumn-200/30 dark:shadow-stone-900/50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
        <span className="text-2xl select-none">💍</span>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-semibold text-autumn-800 dark:text-autumn-200 leading-tight">
            Esküvői vendéglista
          </h1>
          {(guestCount > 0 || szallasCount > 0) && (
            <p className="text-sm text-autumn-600 dark:text-autumn-400 leading-tight">
              {guestCount > 0 && <span>{guestCount} vendég</span>}
              {guestCount > 0 && szallasCount > 0 && <span className="mx-1.5">·</span>}
              {szallasCount > 0 && <span>{szallasCount} szállást igényel</span>}
            </p>
          )}
        </div>

        {/* Activity log */}
        <button
          onClick={onOpenLog}
          title="Előzmények"
          className="p-2.5 rounded-xl text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 active:bg-stone-200 dark:active:bg-stone-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          title={darkMode ? 'Világos mód' : 'Sötét mód'}
          className="p-2.5 rounded-xl text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 active:bg-stone-200 dark:active:bg-stone-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          {darkMode ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
