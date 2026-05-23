export interface RoomDef {
  id: string;
  name: string;
  capacity: number;
}

export type AccommodationRooms = Record<string, RoomDef[]>;

const KEY = 'eskuvoi-szobak';

export function loadRooms(): AccommodationRooms {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AccommodationRooms;
  } catch {
    return {};
  }
}

export function saveRooms(rooms: AccommodationRooms): void {
  localStorage.setItem(KEY, JSON.stringify(rooms));
}
