import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../middleware/auth.js';
import pool from '../db.js';

type SseClient = { res: Response; id: number };

let clients: SseClient[] = [];
let nextId = 1;

// ── Connect a new SSE client ──────────────────────────────────────────────────

export function sseHandler(req: Request, res: Response): void {
  const token = req.query.token as string | undefined;
  try {
    jwt.verify(token ?? '', getJwtSecret());
  } catch {
    res.status(401).end();
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  const clientId = nextId++;
  clients.push({ res, id: clientId });

  // Send current full state immediately on connect
  loadFullState()
    .then((state) => sendToClient(res, state))
    .catch(console.error);

  // Keep-alive ping every 25s
  const ping = setInterval(() => {
    res.write(': ping\n\n');
  }, 25_000);

  req.on('close', () => {
    clearInterval(ping);
    clients = clients.filter((c) => c.id !== clientId);
  });
}

// ── Broadcast full state to all connected clients ─────────────────────────────

export async function broadcast(): Promise<void> {
  if (clients.length === 0) return;
  const state = await loadFullState();
  clients.forEach(({ res }) => sendToClient(res, state));
}

function sendToClient(res: Response, data: unknown): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ── Load full DB state ────────────────────────────────────────────────────────

export async function loadFullState() {
  // Order by letszam numerically (CSV row number); fall back to created_at for non-numeric entries
  const numericOrder = `
    CASE WHEN letszam ~ '^[0-9]+$' THEN letszam::int ELSE 999999 END,
    created_at
  `;
  const [guestsRes, szallasRes, capsRes, roomsRes] = await Promise.all([
    pool.query(`SELECT * FROM guests WHERE source = $1 ORDER BY ${numericOrder}`, ['teljes']),
    pool.query(`SELECT * FROM guests WHERE source = $1 ORDER BY ${numericOrder}`, ['szallas']),
    pool.query('SELECT * FROM capacities'),
    pool.query('SELECT * FROM rooms'),
  ]);

  const mapGuest = (row: Record<string, string>) => ({
    id: row.id,
    letszam: row.letszam,
    vendegNeve: row.vendeg_neve,
    meghivoElkuldve: row.meghivo_elkuldve,
    visszajelzes: row.visszajelzes,
    telefonszam: row.telefonszam,
    erkezesDatuma: row.erkezes_datuma,
    tavozasDatuma: row.tavozas_datuma,
    szallasTypusa: row.szallas_typusa,
    szallasNeve: row.szallas_neve,
    szobaszam: row.szobaszam,
    etkezes: row.etkezes,
    etkezesiKorlatozas: row.etkezesi_korlatozas,
    ultetesiRend: row.ultetesi_rend,
    megjegyzes: row.megjegyzes,
    csoportNev: row.csoport_nev ?? '',
  });

  const capacities: Record<string, number> = {};
  for (const row of capsRes.rows) {
    capacities[row.name] = row.max_slots;
  }

  const rooms: Record<string, { id: string; name: string; capacity: number }[]> = {};
  for (const row of roomsRes.rows) {
    if (!rooms[row.acc_name]) rooms[row.acc_name] = [];
    rooms[row.acc_name].push({ id: row.id, name: row.name, capacity: row.capacity });
  }

  return {
    guests: guestsRes.rows.map(mapGuest),
    szallasGuests: szallasRes.rows.map(mapGuest),
    capacities,
    rooms,
  };
}
