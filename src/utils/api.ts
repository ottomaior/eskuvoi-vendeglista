import type { Guest } from '../types';
import type { RoomDef } from './rooms';

const TOKEN_KEY = 'eskuvoi-token';

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

// ── Fetch wrapper ─────────────────────────────────────────────────────────────

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    window.location.reload();
  }
  return res;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(password: string): Promise<boolean> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) return false;
  const { token } = await res.json() as { token: string };
  setToken(token);
  return true;
}

// ── Guests ────────────────────────────────────────────────────────────────────

export async function importGuests(guests: Guest[]): Promise<void> {
  await apiFetch('/api/guests', { method: 'POST', body: JSON.stringify(guests) });
}

export async function saveGuest(guest: Guest): Promise<void> {
  await apiFetch(`/api/guests/${guest.id}`, { method: 'PUT', body: JSON.stringify(guest) });
}

export async function clearGuests(): Promise<void> {
  await apiFetch('/api/guests', { method: 'DELETE' });
}

// ── Szállás guests ────────────────────────────────────────────────────────────

export async function importSzallas(guests: Guest[]): Promise<void> {
  await apiFetch('/api/szallas', { method: 'POST', body: JSON.stringify(guests) });
}

export async function saveSzallasGuest(guest: Guest): Promise<void> {
  await apiFetch(`/api/szallas/${guest.id}`, { method: 'PUT', body: JSON.stringify(guest) });
}

export async function clearSzallas(): Promise<void> {
  await apiFetch('/api/szallas', { method: 'DELETE' });
}

// ── Capacities ────────────────────────────────────────────────────────────────

export async function saveCapacity(name: string, maxSlots: number): Promise<void> {
  await apiFetch('/api/capacities', { method: 'PUT', body: JSON.stringify({ name, maxSlots }) });
}

// ── Rooms ─────────────────────────────────────────────────────────────────────

export async function saveRoomsForAcc(accName: string, rooms: RoomDef[]): Promise<void> {
  await apiFetch(`/api/rooms/${encodeURIComponent(accName)}`, {
    method: 'PUT',
    body: JSON.stringify(rooms),
  });
}
