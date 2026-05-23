import { Router } from 'express';
import pool from '../db.js';
import { broadcast } from './sse.js';

const router = Router();

// ── GET /api/capacities ───────────────────────────────────────────────────────

router.get('/', async (_req, res) => {
  const result = await pool.query('SELECT name, max_slots FROM capacities');
  const caps: Record<string, number> = {};
  for (const row of result.rows) caps[row.name] = row.max_slots;
  res.json(caps);
});

// ── PUT /api/capacities (upsert one) ─────────────────────────────────────────

router.put('/', async (req, res) => {
  const { name, maxSlots } = req.body as { name: string; maxSlots: number };
  await pool.query(
    `INSERT INTO capacities (name, max_slots) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET max_slots = $2`,
    [name, maxSlots]
  );
  await broadcast();
  res.json({ ok: true });
});

// ── PATCH /api/capacities/:name (rename + optional maxSlots update) ───────────

router.patch('/:name', async (req, res) => {
  const oldName = decodeURIComponent(req.params.name);
  const { newName, maxSlots } = req.body as { newName: string; maxSlots?: number };
  if (!newName?.trim()) { res.status(400).json({ error: 'newName required' }); return; }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Insert new capacity entry
    await client.query(
      `INSERT INTO capacities (name, max_slots)
       VALUES ($1, COALESCE($2, (SELECT max_slots FROM capacities WHERE name = $3)))
       ON CONFLICT (name) DO UPDATE SET max_slots = EXCLUDED.max_slots`,
      [newName, maxSlots ?? null, oldName]
    );
    // Update rooms
    await client.query('UPDATE rooms SET acc_name = $1 WHERE acc_name = $2', [newName, oldName]);
    // Update guests in both lists
    await client.query("UPDATE guests SET szallas_neve = $1 WHERE szallas_neve = $2", [newName, oldName]);
    // Remove old capacity entry (if different name)
    if (newName !== oldName) {
      await client.query('DELETE FROM capacities WHERE name = $1', [oldName]);
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

// ── DELETE /api/capacities/:name ──────────────────────────────────────────────

router.delete('/:name', async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM capacities WHERE name = $1', [name]);
    await client.query('DELETE FROM rooms WHERE acc_name = $1', [name]);
    // Clear szallas_neve on guests that pointed here (keeps the guest rows intact)
    await client.query("UPDATE guests SET szallas_neve = '' WHERE szallas_neve = $1", [name]);
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

export default router;
