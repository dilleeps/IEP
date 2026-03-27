import { describe, it, expect } from 'vitest';
import {
  generateRawSlots,
  addMinutes,
  hashSlot,
  pad2,
} from '../../../../src/modules/consultation/consultation.slots.js';

// ─── pad2 ─────────────────────────────────────────────────────────────────────

describe('pad2', () => {
  it('pads single-digit numbers', () => {
    expect(pad2(0)).toBe('00');
    expect(pad2(5)).toBe('05');
    expect(pad2(9)).toBe('09');
  });

  it('leaves double-digit numbers as-is', () => {
    expect(pad2(10)).toBe('10');
    expect(pad2(23)).toBe('23');
  });
});

// ─── addMinutes ───────────────────────────────────────────────────────────────

describe('addMinutes', () => {
  it('adds minutes within the same hour', () => {
    expect(addMinutes('17:00', 30)).toBe('17:30');
  });

  it('crosses hour boundaries', () => {
    expect(addMinutes('17:30', 30)).toBe('18:00');
  });

  it('handles multi-hour additions', () => {
    expect(addMinutes('09:00', 120)).toBe('11:00');
  });
});

// ─── hashSlot ─────────────────────────────────────────────────────────────────

describe('hashSlot', () => {
  it('returns a value between 0 and 1', () => {
    const val = hashSlot('2026-03-14', '17:00');
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(1);
  });

  it('is deterministic — same inputs give same output', () => {
    const a = hashSlot('2026-03-14', '17:00');
    const b = hashSlot('2026-03-14', '17:00');
    expect(a).toBe(b);
  });

  it('produces different values for different inputs', () => {
    const a = hashSlot('2026-03-14', '17:00');
    const b = hashSlot('2026-03-14', '17:30');
    expect(a).not.toBe(b);
  });
});

// ─── generateRawSlots ─────────────────────────────────────────────────────────

describe('generateRawSlots', () => {
  // ── Sunday: no slots ────────────────────────────────────────────────────
  it('returns empty array for Sunday', () => {
    // 2026-03-08 is a Sunday
    const slots = generateRawSlots('2026-03-08');
    expect(slots).toHaveLength(0);
  });

  // ── Weekday (Mon-Fri): 5 PM – 9 PM, 30-min each ───────────────────────
  it('generates 8 slots for a weekday (5 PM–9 PM, 30-min)', () => {
    // 2026-03-09 is a Monday
    const slots = generateRawSlots('2026-03-09');
    expect(slots).toHaveLength(8);

    // First slot: 5:00 PM
    expect(slots[0].startTime).toBe('17:00');
    expect(slots[0].endTime).toBe('17:30');
    expect(slots[0].durationMinutes).toBe(30);

    // Last slot: 8:30 PM
    expect(slots[7].startTime).toBe('20:30');
    expect(slots[7].endTime).toBe('21:00');
  });

  it('generates correct weekday slots for Tuesday through Friday', () => {
    // 2026-03-10 Tue, 2026-03-11 Wed, 2026-03-12 Thu, 2026-03-13 Fri
    for (const day of ['2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13']) {
      const slots = generateRawSlots(day);
      expect(slots).toHaveLength(8);
      expect(slots[0].startTime).toBe('17:00');
      expect(slots[slots.length - 1].endTime).toBe('21:00');
    }
  });

  // ── Saturday: 9 AM – 5 PM, skip 12 PM – 1 PM lunch ────────────────────
  it('generates Saturday slots with lunch gap', () => {
    // 2026-03-14 is a Saturday
    const slots = generateRawSlots('2026-03-14');

    // Morning: 09:00–12:00 = 6 slots
    // Afternoon: 13:00–17:00 = 8 slots
    // Total: 14
    expect(slots).toHaveLength(14);

    // First slot
    expect(slots[0].startTime).toBe('09:00');
    expect(slots[0].endTime).toBe('09:30');

    // Last morning slot
    expect(slots[5].startTime).toBe('11:30');
    expect(slots[5].endTime).toBe('12:00');

    // First afternoon slot (after lunch gap)
    expect(slots[6].startTime).toBe('13:00');
    expect(slots[6].endTime).toBe('13:30');

    // Last slot
    expect(slots[13].startTime).toBe('16:30');
    expect(slots[13].endTime).toBe('17:00');

    // No slots during 12:00-13:00
    const lunchSlots = slots.filter(
      (s) => s.startTime >= '12:00' && s.startTime < '13:00',
    );
    expect(lunchSlots).toHaveLength(0);
  });

  // ── Slot format ─────────────────────────────────────────────────────────
  it('uses auto:date:time ID format', () => {
    const slots = generateRawSlots('2026-03-09');
    expect(slots[0].id).toBe('auto:2026-03-09:17:00');
    expect(slots[1].id).toBe('auto:2026-03-09:17:30');
  });

  it('marks all slots as available', () => {
    const slots = generateRawSlots('2026-03-09');
    for (const slot of slots) {
      expect(slot.isAvailable).toBe(true);
    }
  });

  it('sets correct date on all slots', () => {
    const slots = generateRawSlots('2026-03-14');
    for (const slot of slots) {
      expect(slot.date).toBe('2026-03-14');
    }
  });

  // ── Edge: each weekday of the week ──────────────────────────────────────
  it('returns 0 slots for every Sunday in March 2026', () => {
    // Sundays: Mar 1, 8, 15, 22, 29
    for (const d of ['2026-03-01', '2026-03-08', '2026-03-15', '2026-03-22', '2026-03-29']) {
      expect(generateRawSlots(d)).toHaveLength(0);
    }
  });
});

// ─── Validation schema for auto slot IDs ──────────────────────────────────────

describe('auto slot ID format', () => {
  const autoIdRegex = /^auto:\d{4}-\d{2}-\d{2}:\d{2}:\d{2}$/;

  it('all generated slot IDs match the expected regex', () => {
    const weekday = generateRawSlots('2026-03-09');
    const saturday = generateRawSlots('2026-03-14');

    for (const slot of [...weekday, ...saturday]) {
      expect(slot.id).toMatch(autoIdRegex);
    }
  });
});
