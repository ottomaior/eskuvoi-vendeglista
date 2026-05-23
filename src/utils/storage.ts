import type { Guest } from '../types';

const GUESTS_KEY = 'eskuvoi-vendegek';
const SZALLAS_KEY = 'eskuvoi-szallas';

export function loadGuests(): Guest[] {
  return load(GUESTS_KEY);
}

export function saveGuests(guests: Guest[]): void {
  save(GUESTS_KEY, guests);
}

export function loadSzallasGuests(): Guest[] {
  return load(SZALLAS_KEY);
}

export function saveSzallasGuests(guests: Guest[]): void {
  save(SZALLAS_KEY, guests);
}

function load(key: string): Guest[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as Guest[];
  } catch {
    return [];
  }
}

function save(key: string, guests: Guest[]): void {
  localStorage.setItem(key, JSON.stringify(guests));
}
