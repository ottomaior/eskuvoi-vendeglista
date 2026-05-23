const KEY = 'eskuvoi-kapacitas';

export function loadCapacities(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

export function saveCapacities(caps: Record<string, number>): void {
  localStorage.setItem(KEY, JSON.stringify(caps));
}
