import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { migrate } from './migrate.js';
import { requireAuth } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import guestsRouter from './routes/guests.js';
import szallasRouter from './routes/szallas.js';
import capacitiesRouter from './routes/capacities.js';
import roomsRouter from './routes/rooms.js';
import { sseHandler } from './routes/sse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ── Public routes ─────────────────────────────────────────────────────────────
app.use('/api', authRouter);

// ── SSE (auth via query param) ────────────────────────────────────────────────
app.get('/api/events', sseHandler);

// ── Protected API routes ──────────────────────────────────────────────────────
app.use('/api/guests', requireAuth, guestsRouter);
app.use('/api/szallas', requireAuth, szallasRouter);
app.use('/api/capacities', requireAuth, capacitiesRouter);
app.use('/api/rooms', requireAuth, roomsRouter);

// ── Serve Vite build in production ────────────────────────────────────────────
const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
migrate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
