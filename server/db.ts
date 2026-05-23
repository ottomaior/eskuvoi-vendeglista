import pg from 'pg';

const { Pool } = pg;

/** Private URL on Railway; DATABASE_PUBLIC_URL works when *.railway.internal does not resolve. */
export const connectionString =
  process.env.DATABASE_URL?.trim() ||
  process.env.DATABASE_PUBLIC_URL?.trim() ||
  '';

if (!connectionString) {
  throw new Error(
    'DATABASE_URL or DATABASE_PUBLIC_URL environment variable is required'
  );
}

const connectionVia = process.env.DATABASE_URL?.trim()
  ? 'DATABASE_URL'
  : 'DATABASE_PUBLIC_URL';

try {
  const u = new URL(connectionString);
  console.log(
    `Database (${connectionVia}): ${u.hostname}:${u.port || '5432'}${u.pathname}`
  );
} catch {
  console.log(`Database (${connectionVia}): connection string set`);
}

const useSsl =
  !connectionString.includes('localhost') &&
  !connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

export default pool;
