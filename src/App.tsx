import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Guest } from './types';
import { FULL_LIST_COLUMNS, SZALLAS_COLUMNS, SHARED_FIELD_KEYS } from './types';
import { parseFile, parseSzallasFile, exportCSV, exportSzallasCSV } from './utils/csv';
import type { RoomDef } from './utils/rooms';
import {
  getToken,
  importGuests,
  addGuest,
  saveGuest,
  clearGuests,
  importSzallas,
  addSzallasGuest,
  saveSzallasGuest,
  clearSzallas,
  saveCapacity,
  addAccommodation,
  renameAccommodation,
  deleteAccommodation,
  saveRoomsForAcc,
} from './utils/api';
import Header from './components/Header';
import TabBar from './components/TabBar';
import type { TabId } from './components/TabBar';
import GuestTable from './components/GuestTable';
import TabToolbar from './components/TabToolbar';
import StatsBar from './components/StatsBar';
import SearchBar from './components/SearchBar';
import AccommodationView from './components/AccommodationView';
import EditModal from './components/EditModal';
import LoginScreen from './components/LoginScreen';

type EditContext = { guest: Guest; source: TabId; isNew?: boolean };
type SzallasViewMode = 'cards' | 'table';

function blankGuest(): Guest {
  return {
    id: uuidv4(),
    letszam: '1',
    vendegNeve: '',
    meghivoElkuldve: '',
    visszajelzes: '',
    telefonszam: '',
    erkezesDatuma: '',
    tavozasDatuma: '',
    szallasTypusa: '',
    szallasNeve: '',
    szobaszam: '',
    etkezes: '',
    etkezesiKorlatozas: '',
    ultetesiRend: '',
    megjegyzes: '',
  };
}

// Full state shape pushed over SSE
interface ServerState {
  guests: Guest[];
  szallasGuests: Guest[];
  capacities: Record<string, number>;
  rooms: Record<string, RoomDef[]>;
}

function applyFilters(list: Guest[], search: string, rsvp: string): Guest[] {
  const searchLower = search.trim().toLowerCase();
  return list.filter((g) => {
    if (searchLower && !g.vendegNeve.toLowerCase().includes(searchLower)) return false;
    if (rsvp) {
      const v = g.visszajelzes?.toLowerCase().trim() ?? '';
      if (rsvp === '__empty__') return !v;
      return v === rsvp;
    }
    return true;
  });
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => !!getToken());
  const [guests, setGuests] = useState<Guest[]>([]);
  const [szallasGuests, setSzallasGuests] = useState<Guest[]>([]);
  const [capacities, setCapacities] = useState<Record<string, number>>({});
  const [rooms, setRooms] = useState<Record<string, RoomDef[]>>({});
  const [activeTab, setActiveTab] = useState<TabId>('teljes');
  const [editContext, setEditContext] = useState<EditContext | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [szallasView, setSzallasView] = useState<SzallasViewMode>('cards');

  const [teljesSearch, setTeljesSearch] = useState('');
  const [teljesRsvp, setTeljesRsvp] = useState('');
  const [szallasSearch, setSzallasSearch] = useState('');
  const [szallasRsvp, setSzallasRsvp] = useState('');

  const sseRef = useRef<EventSource | null>(null);

  // ── SSE connection ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!loggedIn) return;
    const token = getToken();
    if (!token) return;

    function connect() {
      const es = new EventSource(`/api/events?token=${encodeURIComponent(token!)}`);
      sseRef.current = es;

      es.onmessage = (e) => {
        const state = JSON.parse(e.data as string) as ServerState;
        setGuests(state.guests);
        setSzallasGuests(state.szallasGuests);
        setCapacities(state.capacities);
        setRooms(state.rooms);
      };

      es.onerror = () => {
        es.close();
        // Reconnect after 3s
        setTimeout(connect, 3000);
      };
    }

    connect();
    return () => sseRef.current?.close();
  }, [loggedIn]);

  // ── Derived state ─────────────────────────────────────────────────────────────

  const filteredGuests = useMemo(
    () => applyFilters(guests, teljesSearch, teljesRsvp),
    [guests, teljesSearch, teljesRsvp]
  );

  const filteredSzallas = useMemo(
    () => applyFilters(szallasGuests, szallasSearch, szallasRsvp),
    [szallasGuests, szallasSearch, szallasRsvp]
  );

  const igenCount = useMemo(
    () => guests.filter((g) => g.visszajelzes?.toLowerCase().trim() === 'igen').length,
    [guests]
  );

  // ── Import handlers ───────────────────────────────────────────────────────────

  async function handleImportGuests(file: File) {
    setImportError(null);
    try {
      const parsed = await parseFile(file);
      await importGuests(parsed);
      // State will be updated via SSE broadcast
    } catch (err) {
      console.error(err);
      setImportError('A fájl betöltése sikertelen. Kérjük ellenőrizze a formátumot.');
    }
  }

  async function handleImportSzallas(file: File) {
    setImportError(null);
    try {
      const { guests: parsed, capacities: importedCaps } = await parseSzallasFile(file);
      await importSzallas(parsed);
      for (const [name, maxSlots] of Object.entries(importedCaps)) {
        await saveCapacity(name, maxSlots);
      }
      // State will be updated via SSE broadcast
    } catch (err) {
      console.error(err);
      setImportError('A fájl betöltése sikertelen. Kérjük ellenőrizze a formátumot.');
    }
  }

  // ── Clear handlers ────────────────────────────────────────────────────────────

  async function handleClearGuests() {
    if (window.confirm('Biztosan törli a Teljes lista összes vendégét?')) {
      await clearGuests();
    }
  }

  async function handleClearSzallas() {
    if (window.confirm('Biztosan törli a Szállás lista összes vendégét?')) {
      await clearSzallas();
    }
  }

  // ── Capacity / rooms change ───────────────────────────────────────────────────

  async function handleCapacityChange(name: string, max: number) {
    await saveCapacity(name, max);
  }

  async function handleRoomsChange(accName: string, updatedRooms: RoomDef[]) {
    await saveRoomsForAcc(accName, updatedRooms);
  }

  async function handleAssignRoom(guestId: string, roomName: string) {
    const guest = szallasGuests.find((g) => g.id === guestId);
    if (!guest) return;
    const updated = { ...guest, szobaszam: roomName };
    await saveSzallasGuest(updated);
    // Also sync to teljes list if a matching guest exists there
    const teljesMatch = guests.find(
      (g) => g.vendegNeve.trim().toLowerCase() === updated.vendegNeve.trim().toLowerCase()
    );
    if (teljesMatch) {
      await saveGuest({ ...teljesMatch, szobaszam: roomName });
    }
  }

  async function handleAddAccommodation(name: string) {
    await addAccommodation(name);
  }

  async function handleRenameAccommodation(oldName: string, newName: string, maxSlots: number) {
    await renameAccommodation(oldName, newName, maxSlots);
  }

  async function handleDeleteAccommodation(name: string) {
    if (window.confirm(`Biztosan törli a(z) „${name}" szálláshelyet? A szálláshoz rendelt vendégek szállása törlődik.`)) {
      await deleteAccommodation(name);
    }
  }

  // ── Save handler ──────────────────────────────────────────────────────────────

  const handleSave = useCallback(async (updated: Guest) => {
    if (!editContext) return;
    const { source, isNew } = editContext;

    if (isNew) {
      if (source === 'teljes') {
        await addGuest(updated);
      } else {
        await addSzallasGuest(updated);
      }
      setEditContext(null);
      return;
    }

    if (source === 'teljes') {
      await saveGuest(updated);
      // Sync to szallas list if matching guest exists
      const szallasMatch = szallasGuests.find(
        (g) => g.vendegNeve.trim().toLowerCase() === updated.vendegNeve.trim().toLowerCase()
      );
      if (szallasMatch) {
        const synced = { ...szallasMatch };
        for (const key of SHARED_FIELD_KEYS) {
          (synced as Record<string, string>)[key] = updated[key] ?? '';
        }
        await saveSzallasGuest(synced);
      }
    } else {
      await saveSzallasGuest(updated);
      const teljesMatch = guests.find(
        (g) => g.vendegNeve.trim().toLowerCase() === updated.vendegNeve.trim().toLowerCase()
      );
      if (teljesMatch) {
        const synced = { ...teljesMatch };
        for (const key of SHARED_FIELD_KEYS) {
          (synced as Record<string, string>)[key] = updated[key] ?? '';
        }
        await saveGuest(synced);
      }
    }

    setEditContext(null);
  }, [editContext, guests, szallasGuests]);

  // ── Login gate ────────────────────────────────────────────────────────────────

  if (!loggedIn) {
    return <LoginScreen onSuccess={() => setLoggedIn(true)} />;
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-autumn-50/60">
      <Header guestCount={guests.length} szallasCount={szallasGuests.length} />
      <TabBar
        activeTab={activeTab}
        onChange={setActiveTab}
        guestCount={guests.length}
        szallasCount={szallasGuests.length}
      />

      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-6">
        {importError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
            <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{importError}</span>
            <button onClick={() => setImportError(null)} className="ml-auto p-1.5 -m-1 rounded text-red-400 hover:text-red-600 hover:bg-red-100 active:bg-red-200 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── TELJES LISTA TAB ── */}
        {activeTab === 'teljes' && (
          guests.length === 0 ? (
            <EmptyState
              onImport={handleImportGuests}
              title="Töltsd fel a vendéglistát"
              hint="Elfogadott formátumok: CSV, XLS, XLSX, ODS — Elvárt oszlopok: Létszám · Vendég neve · Meghívó elküldve? · Visszajelzés · Telefonszám · Érkezés dátuma · Távozás dátuma · Szállás típusa · Szállás neve / helye · Szobaszám · Étkezés · Étkezési korlátozás · Ültetési rend (asztal) · Megjegyzés"
            />
          ) : (
            <>
              <StatsBar guests={guests} szallasCount={szallasGuests.length} />
              <TabToolbar
                count={guests.length}
                igenCount={igenCount}
                onImport={handleImportGuests}
                onExport={() => exportCSV(guests)}
                onClear={handleClearGuests}
                importLabel="CSV betöltése"
                onAddNew={() => setEditContext({ guest: blankGuest(), source: 'teljes', isNew: true })}
              />
              <SearchBar
                search={teljesSearch}
                filterRsvp={teljesRsvp}
                resultCount={filteredGuests.length}
                onSearchChange={setTeljesSearch}
                onFilterChange={setTeljesRsvp}
              />
              <GuestTable
                guests={filteredGuests}
                columns={FULL_LIST_COLUMNS}
                onEditGuest={(g) => setEditContext({ guest: g, source: 'teljes' })}
              />
            </>
          )
        )}

        {/* ── SZÁLLÁS TAB ── */}
        {activeTab === 'szallas' && (
          <>
            <TabToolbar
                count={szallasGuests.length}
                onImport={handleImportSzallas}
                onExport={() => exportSzallasCSV(szallasGuests)}
                onClear={handleClearSzallas}
                importLabel="Szállás CSV betöltése"
                onAddNew={() => setEditContext({ guest: blankGuest(), source: 'szallas', isNew: true })}
              >
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setSzallasView('cards')}
                    title="Kártyás nézet"
                    className={`px-3 py-2.5 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${szallasView === 'cards' ? 'bg-autumn-600 text-white' : 'bg-[#FFFCF8] text-stone-500 hover:bg-stone-50'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSzallasView('table')}
                    title="Táblázatos nézet"
                    className={`px-3 py-2.5 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${szallasView === 'table' ? 'bg-autumn-600 text-white' : 'bg-[#FFFCF8] text-stone-500 hover:bg-stone-50'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </TabToolbar>

              {szallasView === 'cards' ? (
                <AccommodationView
                  guests={szallasGuests}
                  capacities={capacities}
                  onCapacityChange={handleCapacityChange}
                  rooms={rooms}
                  onRoomsChange={handleRoomsChange}
                  onAssignRoom={handleAssignRoom}
                  onEditGuest={(g) => setEditContext({ guest: g, source: 'szallas' })}
                  onAddAccommodation={handleAddAccommodation}
                  onRenameAccommodation={handleRenameAccommodation}
                  onDeleteAccommodation={handleDeleteAccommodation}
                />
              ) : (
                <>
                  <SearchBar
                    search={szallasSearch}
                    filterRsvp={szallasRsvp}
                    resultCount={filteredSzallas.length}
                    onSearchChange={setSzallasSearch}
                    onFilterChange={setSzallasRsvp}
                  />
                  <GuestTable
                    guests={filteredSzallas}
                    columns={SZALLAS_COLUMNS}
                    onEditGuest={(g) => setEditContext({ guest: g, source: 'szallas' })}
                    emptyMessage="Nincsenek szállást igénylő vendégek"
                  />
                </>
              )}
          </>
        )}
      </main>

      <EditModal
        guest={editContext?.guest ?? null}
        source={editContext?.source ?? 'teljes'}
        onSave={handleSave}
        onClose={() => setEditContext(null)}
      />
    </div>
  );
}

// ── Empty state upload widget ─────────────────────────────────────────────────

function EmptyState({
  onImport,
  title,
  hint,
}: {
  onImport: (file: File) => void;
  title: string;
  hint: string;
}) {
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && /\.(csv|xls|xlsx|ods)$/i.test(file.name)) onImport(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { onImport(file); e.target.value = ''; }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh]">
      <label
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center gap-4 w-full max-w-md p-10 rounded-2xl border-2 border-dashed border-autumn-200 bg-[#FFFCF8] cursor-pointer hover:border-autumn-400 hover:bg-autumn-100/60 transition-colors group"
      >
        <div className="w-16 h-16 rounded-full bg-autumn-100 flex items-center justify-center group-hover:bg-autumn-200 transition-colors">
          <svg className="w-8 h-8 text-autumn-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-base font-medium text-gray-700">{title}</p>
          <p className="text-sm text-gray-400 mt-1">Húzd ide a fájlt, vagy kattints a böngészéshez</p>
        </div>
        <span className="px-4 py-2 text-sm font-medium rounded-lg bg-autumn-600 text-white group-hover:bg-autumn-700 transition-colors">
          CSV kiválasztása
        </span>
        <input type="file" accept=".csv,.xls,.xlsx,.ods" className="hidden" onChange={handleFileChange} />
      </label>
      <p className="mt-6 max-w-sm text-center text-xs text-gray-400 leading-relaxed">{hint}</p>
    </div>
  );
}
