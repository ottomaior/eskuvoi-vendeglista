import { Router } from 'express';
import pool from '../db.js';

export const logsRouter = Router();

// ── GET /api/logs (latest 200 entries) ───────────────────────────────────────

logsRouter.get('/', async (_req, res) => {
  const result = await pool.query(
    'SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200'
  );
  res.json(result.rows);
});

// ── POST /api/logs ─────────────────────────────────────────────────────────────

logsRouter.post('/', async (req, res) => {
  const { action, guestName, field, oldValue, newValue } = req.body as {
    action: string;
    guestName: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
  };
  await pool.query(
    `INSERT INTO audit_log (action, guest_name, field, old_value, new_value)
     VALUES ($1, $2, $3, $4, $5)`,
    [action, guestName ?? '', field ?? '', oldValue ?? '', newValue ?? '']
  );
  res.json({ ok: true });
});

// ── DELETE /api/logs (clear all) ─────────────────────────────────────────────

logsRouter.delete('/', async (_req, res) => {
  await pool.query('DELETE FROM audit_log');
  res.json({ ok: true });
});

// ── Helper used from other routes ─────────────────────────────────────────────

export async function addLog(
  action: string,
  guestName: string,
  field = '',
  oldValue = '',
  newValue = ''
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_log (action, guest_name, field, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5)`,
      [action, guestName, field, oldValue, newValue]
    );
  } catch {
    // Non-critical — do not throw
  }
}
