/**
 * Pure helper functions for auto-generating consultation time slots.
 * Separated from the service layer to allow unit testing without
 * database or config dependencies.
 */

/** Simple deterministic hash for scarcity — returns 0..1 */
export function hashSlot(date: string, time: string): number {
  let h = 0;
  const str = `${date}:${time}:askiep`;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h % 100) / 100;
}

export interface VirtualSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isAvailable: boolean;
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

/**
 * Generate all possible 30-min consultation slots for a given date.
 * Rules (all times EST):
 *   Mon-Fri  → 17:00 – 21:00  (5 PM – 9 PM)
 *   Saturday → 09:00 – 17:00  (9 AM – 5 PM, skip 12:00-13:00 lunch)
 *   Sunday   → none
 */
export function generateRawSlots(dateStr: string): VirtualSlot[] {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay(); // 0=Sun, 6=Sat

  if (dayOfWeek === 0) return []; // Sunday — no slots

  const DURATION = 30;
  let ranges: Array<{ start: string; end: string }>;

  if (dayOfWeek === 6) {
    // Saturday: 9 AM–12 PM, 1 PM–5 PM (skip lunch 12-1)
    ranges = [
      { start: '09:00', end: '12:00' },
      { start: '13:00', end: '17:00' },
    ];
  } else {
    // Weekday: 5 PM–9 PM
    ranges = [{ start: '17:00', end: '21:00' }];
  }

  const slots: VirtualSlot[] = [];

  for (const range of ranges) {
    let cursor = range.start;
    while (cursor < range.end) {
      const endTime = addMinutes(cursor, DURATION);
      if (endTime > range.end) break;

      slots.push({
        id: `auto:${dateStr}:${cursor}`,
        date: dateStr,
        startTime: cursor,
        endTime,
        durationMinutes: DURATION,
        isAvailable: true,
      });
      cursor = endTime;
    }
  }

  return slots;
}
