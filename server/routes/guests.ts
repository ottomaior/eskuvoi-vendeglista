import { Router } from 'express';
import pool from '../db.js';
import { broadcast } from './sse.js';

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function guestToColumns(g: Record<string, string>) {
  return {
    id: g.id,
    source: g.source ?? 'teljes',
    letszam: g.letszam ?? '',
    vendeg_neve: g.vendegNeve ?? '',
    meghivo_elkuldve: g.meghivoElkuldve ?? '',
    visszajelzes: g.visszajelzes ?? '',
    telefonszam: g.telefonszam ?? '',
    erkezes_datuma: g.erkezesDatuma ?? '',
    tavozas_datuma: g.tavozasDatuma ?? '',
    szallas_typusa: g.szallasTypusa ?? '',
    szallas_neve: g.szallasNeve ?? '',
    szobaszam: g.szobaszam ?? '',
    etkezes: g.etkezes ?? '',
    etkezesi_korlatozas: g.etkezesiKorlatozas ?? '',
    ultetesi_rend: g.ultetesiRend ?? '',
    megjegyzes: g.megjegyzes ?? '',
  };
}

// ── GET /api/guests (all teljes) ──────────────────────────────────────────────

router.get('/', async (_req, res) => {
  const result = await pool.query(
    "SELECT * FROM guests WHERE source = 'teljes' ORDER BY created_at"
  );
  res.json(result.rows);
});

// ── POST /api/guests (bulk replace) ──────────────────────────────────────────

router.post('/', async (req, res) => {
  const guests = req.body as Record<string, string>[];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("DELETE FROM guests WHERE source = 'teljes'");
    for (const g of guests) {
      const c = guestToColumns(g);
      await client.query(
        `INSERT INTO guests (id, source, letszam, vendeg_neve, meghivo_elkuldve, visszajelzes,
          telefonszam, erkezes_datuma, tavozas_datuma, szallas_typusa, szallas_neve,
          szobaszam, etkezes, etkezesi_korlatozas, ultetesi_rend, megjegyzes)
         VALUES ($1,'teljes',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [c.id, c.letszam, c.vendeg_neve, c.meghivo_elkuldve, c.visszajelzes,
         c.telefonszam, c.erkezes_datuma, c.tavozas_datuma, c.szallas_typusa, c.szallas_neve,
         c.szobaszam, c.etkezes, c.etkezesi_korlatozas, c.ultetesi_rend, c.megjegyzes]
      );
    }
    await client.query('COMMIT');
    await broadcast();
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// ── PUT /api/guests/:id ───────────────────────────────────────────────────────

router.put('/:id', async (req, res) => {
  const c = guestToColumns({ ...req.body as Record<string, string>, id: req.params.id });
  await pool.query(
    `UPDATE guests SET letszam=$1, vendeg_neve=$2, meghivo_elkuldve=$3, visszajelzes=$4,
      telefonszam=$5, erkezes_datuma=$6, tavozas_datuma=$7, szallas_typusa=$8, szallas_neve=$9,
      szobaszam=$10, etkezes=$11, etkezesi_korlatozas=$12, ultetesi_rend=$13, megjegyzes=$14
     WHERE id=$15`,
    [c.letszam, c.vendeg_neve, c.meghivo_elkuldve, c.visszajelzes,
     c.telefonszam, c.erkezes_datuma, c.tavozas_datuma, c.szallas_typusa, c.szallas_neve,
     c.szobaszam, c.etkezes, c.etkezesi_korlatozas, c.ultetesi_rend, c.megjegyzes, c.id]
  );
  await broadcast();
  res.json({ ok: true });
});

// ── DELETE /api/guests (clear all teljes) ─────────────────────────────────────

router.delete('/', async (_req, res) => {
  await pool.query("DELETE FROM guests WHERE source = 'teljes'");
  await broadcast();
  res.json({ ok: true });
});

export default router;
