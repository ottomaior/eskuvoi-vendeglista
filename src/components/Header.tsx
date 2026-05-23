interface HeaderProps {
  guestCount: number;
  szallasCount: number;
}

export default function Header({ guestCount, szallasCount }: HeaderProps) {
  return (
    <header className="bg-[#FFFCF8] border-b border-autumn-200 shadow-sm shadow-autumn-200/30">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
        <span className="text-2xl select-none">💍</span>
        <div>
          <h1 className="font-display text-xl font-semibold text-autumn-800 leading-tight">
              Esküvői vendéglista
            </h1>
          {(guestCount > 0 || szallasCount > 0) && (
            <p className="text-sm text-autumn-600 leading-tight">
              {guestCount > 0 && <span>{guestCount} vendég</span>}
              {guestCount > 0 && szallasCount > 0 && <span className="mx-1.5">·</span>}
              {szallasCount > 0 && <span>{szallasCount} szállást igényel</span>}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
