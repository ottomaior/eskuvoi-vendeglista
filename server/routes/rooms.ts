import { Router } from 'express';
import pool from '../db.js';
import { broadcast } from './sse.js';

const router = Router();

// ── GET /api/rooms ────────────────────────────────────────────────────────────

router.get('/', async (_req, res) => {
  const result = await pool.query('SELECT * FROM rooms ORDER BY acc_name, name');
  const rooms: Record<string, { id: string; name: string; capacity: number }[]> = {};
  for (const row of result.rows) {
    if (!rooms[row.acc_name]) rooms[row.acc_name] = [];
    rooms[row.acc_name].push({ id: row.id, name: row.name, capacity: row.capacity });
  }
  res.json(rooms);
});

// ── PUT /api/rooms/:accName (replace all rooms for one accommodation) ─────────

router.put('/:accName', async (req, res) => {
  const accName = decodeURIComponent(req.params.accName);
  const newRooms = req.body as { id: string; name: string; capacity: number }[];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM rooms WHERE acc_name = $1', [accName]);
    for (const r of newRooms) {
      await client.query(
        'INSERT INTO rooms (id, acc_name, name, capacity) VALUES ($1, $2, $3, $4)',
        [r.id, accName, r.name, r.capacity]
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

export default router;
