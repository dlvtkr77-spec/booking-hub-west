export const SLOTS = ['오전', '오후-1', '오후-2'] as const;

export const NEED: Record<string, number> = {
  서울: 1,
  내부: 1,
  경기: 2,
  지방: 3,
};

export function requiredSlots(kind: string, wanted: string[]): string[] {
  if (!wanted.length) return [];

  const firstWanted = wanted[0];

  if (kind === '서울' || kind === '내부') {
    return [firstWanted];
  }

  if (kind === '경기') {
    if (firstWanted === '오전') return ['오전', '오후-1'];
    if (firstWanted === '오후-1') return ['오후-1', '오후-2'];
    if (firstWanted === '오후-2') return ['오후-1', '오후-2'];
  }

  if (kind === '지방') {
    return ['오전', '오후-1', '오후-2'];
  }

  return [];
}

interface Booking {
  id?: number;
  date: string;
  decision?: string;
  slot_assigned?: string;
}

export function occupied(date: string, bookings: Booking[]): Set<string> {
  const slots = new Set<string>();
  bookings.forEach((booking) => {
    if (
      booking.date === date &&
      (booking.decision === 'confirmed_auto' || booking.decision === 'confirmed_human') &&
      booking.slot_assigned
    ) {
      booking.slot_assigned.split(',').forEach((s) => slots.add(s.trim()));
    }
  });
  return slots;
}

export function availableSlots(date: string, bookings: Booking[]): Set<string> {
  const occupied_set = occupied(date, bookings);
  const all_slots = new Set(SLOTS);
  return new Set([...all_slots].filter((s) => !occupied_set.has(s)));
}
