export interface Guest {
  id: string;
  letszam: string;
  vendegNeve: string;
  meghivoElkuldve: string;
  visszajelzes: string;
  telefonszam: string;
  erkezesDatuma: string;
  tavozasDatuma: string;
  szallasTypusa: string;
  szallasNeve: string;
  szobaszam: string;
  etkezes: string;
  etkezesiKorlatozas: string;
  ultetesiRend: string;
  megjegyzes: string;
}

export interface ColumnDef {
  key: keyof Omit<Guest, 'id'>;
  label: string;
  width?: string;
}

export const FULL_LIST_COLUMNS: ColumnDef[] = [
  { key: 'letszam', label: 'Létszám', width: 'w-16' },
  { key: 'vendegNeve', label: 'Vendég neve', width: 'w-48' },
  { key: 'meghivoElkuldve', label: 'Meghívó elküldve?', width: 'w-36' },
  { key: 'visszajelzes', label: 'Visszajelzés', width: 'w-32' },
  { key: 'telefonszam', label: 'Telefonszám', width: 'w-36' },
  { key: 'erkezesDatuma', label: 'Érkezés dátuma', width: 'w-36' },
  { key: 'tavozasDatuma', label: 'Távozás dátuma', width: 'w-36' },
  { key: 'szallasTypusa', label: 'Szállás típusa', width: 'w-36' },
  { key: 'szallasNeve', label: 'Szállás neve / helye', width: 'w-48' },
  { key: 'szobaszam', label: 'Szobaszám', width: 'w-28' },
  { key: 'etkezes', label: 'Étkezés', width: 'w-28' },
  { key: 'etkezesiKorlatozas', label: 'Étkezési korlátozás', width: 'w-44' },
  { key: 'ultetesiRend', label: 'Ültetési rend (asztal)', width: 'w-40' },
  { key: 'megjegyzes', label: 'Megjegyzés', width: 'w-48' },
];

export const SZALLAS_COLUMNS: ColumnDef[] = [
  { key: 'letszam', label: 'Létszám', width: 'w-16' },
  { key: 'vendegNeve', label: 'Vendég neve', width: 'w-48' },
  { key: 'telefonszam', label: 'Telefonszám', width: 'w-36' },
  { key: 'erkezesDatuma', label: 'Érkezés dátuma', width: 'w-36' },
  { key: 'tavozasDatuma', label: 'Távozás dátuma', width: 'w-36' },
  { key: 'szallasTypusa', label: 'Szállás típusa', width: 'w-36' },
  { key: 'szallasNeve', label: 'Szállás neve / helye', width: 'w-48' },
  { key: 'szobaszam', label: 'Szobaszám', width: 'w-28' },
  { key: 'etkezes', label: 'Étkezés', width: 'w-28' },
  { key: 'etkezesiKorlatozas', label: 'Étkezési korlátozás', width: 'w-44' },
  { key: 'megjegyzes', label: 'Megjegyzés', width: 'w-48' },
];

export const CSV_HEADER_MAP: Record<string, keyof Omit<Guest, 'id'>> = {
  'Létszám': 'letszam',
  'Vendég neve': 'vendegNeve',
  'Meghívó elküldve?': 'meghivoElkuldve',
  'Visszajelzés': 'visszajelzes',
  'Telefonszám': 'telefonszam',
  'Érkezés dátuma': 'erkezesDatuma',
  'Távozás dátuma': 'tavozasDatuma',
  'Szállás típusa': 'szallasTypusa',
  'Szállás neve / helye': 'szallasNeve',
  'Szobaszám': 'szobaszam',
  'Étkezés': 'etkezes',
  'Étkezési korlátozás': 'etkezesiKorlatozas',
  'Ültetési rend (asztal)': 'ultetesiRend',
  'Megjegyzés': 'megjegyzes',
};

export const CSV_REVERSE_MAP: Record<keyof Omit<Guest, 'id'>, string> = {
  letszam: 'Létszám',
  vendegNeve: 'Vendég neve',
  meghivoElkuldve: 'Meghívó elküldve?',
  visszajelzes: 'Visszajelzés',
  telefonszam: 'Telefonszám',
  erkezesDatuma: 'Érkezés dátuma',
  tavozasDatuma: 'Távozás dátuma',
  szallasTypusa: 'Szállás típusa',
  szallasNeve: 'Szállás neve / helye',
  szobaszam: 'Szobaszám',
  etkezes: 'Étkezés',
  etkezesiKorlatozas: 'Étkezési korlátozás',
  ultetesiRend: 'Ültetési rend (asztal)',
  megjegyzes: 'Megjegyzés',
};

/**
 * Fields that exist in both the full list CSV and the Szállás CSV.
 * These are kept in sync when a guest is saved in either tab.
 */
export const SHARED_FIELD_KEYS: (keyof Omit<Guest, 'id'>)[] = [
  'letszam', 'vendegNeve', 'telefonszam',
  'erkezesDatuma', 'tavozasDatuma', 'szallasTypusa', 'szallasNeve',
  'szobaszam', 'etkezes', 'etkezesiKorlatozas', 'megjegyzes',
];
