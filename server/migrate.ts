import pool from './db.js';

export async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS guests (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL DEFAULT 'teljes',
      letszam TEXT NOT NULL DEFAULT '',
      vendeg_neve TEXT NOT NULL DEFAULT '',
      meghivo_elkuldve TEXT NOT NULL DEFAULT '',
      visszajelzes TEXT NOT NULL DEFAULT '',
      telefonszam TEXT NOT NULL DEFAULT '',
      erkezes_datuma TEXT NOT NULL DEFAULT '',
      tavozas_datuma TEXT NOT NULL DEFAULT '',
      szallas_typusa TEXT NOT NULL DEFAULT '',
      szallas_neve TEXT NOT NULL DEFAULT '',
      szobaszam TEXT NOT NULL DEFAULT '',
      etkezes TEXT NOT NULL DEFAULT '',
      etkezesi_korlatozas TEXT NOT NULL DEFAULT '',
      ultetesi_rend TEXT NOT NULL DEFAULT '',
      megjegyzes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS capacities (
      name TEXT PRIMARY KEY,
      max_slots INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      acc_name TEXT NOT NULL,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      action TEXT NOT NULL,
      guest_name TEXT NOT NULL DEFAULT '',
      field TEXT NOT NULL DEFAULT '',
      old_value TEXT NOT NULL DEFAULT '',
      new_value TEXT NOT NULL DEFAULT ''
    );

    ALTER TABLE guests ADD COLUMN IF NOT EXISTS csoport_nev TEXT NOT NULL DEFAULT '';
  `);

  console.log('Database migration complete');
}
