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

export default router;
