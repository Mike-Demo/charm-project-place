export const TIME_SLOTS = [
  "10:00 AM",
  "11:30 AM",
  "1:00 PM",
  "2:30 PM",
  "4:00 PM",
  "6:30 PM",
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];

export type UnavailableKind = "booked" | "blocked";

export interface UnavailableSlot {
  slot_date: string;
  time_slot: string | null;
  kind: string;
}

export interface Appointment {
  id: string;
  client_name: string;
  phone: string;
  email: string;
  booking_date: string;
  time_slot: string;
  status: string;
  payment_status?: string;
  notes: string | null;
  pronouns: string | null;
  created_at: string;
  reschedule_count?: number;
  rescheduled_at?: string | null;
  idea_description?: string | null;
  reference_image_path?: string | null;
  concept_sketch_path?: string | null;
  reminder_sent_at?: string | null;
  client_confirmed_at?: string | null;
  day_of_sent_at?: string | null;
  aftercare_sent_at?: string | null;
  social_sent_at?: string | null;
}

export const PRONOUN_OPTIONS = [
  "they / them",
  "she / her",
  "he / him",
  "she / they",
  "he / they",
] as const;

export interface BlockedSlot {
  id: string;
  blocked_date: string;
  time_slot: string | null;
  reason: string | null;
  created_at: string;
}

export function startOfDay(value: Date): Date {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(value: Date, amount: number): Date {
  const next = startOfDay(value);
  next.setDate(next.getDate() + amount);
  return next;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Local-time YYYY-MM-DD key, safe for `date` columns. */
export function toDateKey(value: Date): string {
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function formatLongDate(value: Date): string {
  return value.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Sortable minute offset for a slot label like "1:00 PM". */
export function slotMinutes(slot: string): number {
  const match = /^(\d+):(\d+)\s*(AM|PM)$/i.exec(slot.trim());
  if (!match) return 0;
  const hour = Number(match[1]) % 12;
  const minute = Number(match[2]);
  const isPm = (match[3] ?? "").toUpperCase() === "PM";
  return (hour + (isPm ? 12 : 0)) * 60 + minute;
}

export interface Availability {
  /** date key -> set of unavailable slot labels */
  slots: Map<string, Set<string>>;
  /** date keys closed for the whole day */
  fullDays: Set<string>;
}

export function buildAvailability(rows: readonly UnavailableSlot[]): Availability {
  const slots = new Map<string, Set<string>>();
  const fullDays = new Set<string>();
  for (const row of rows) {
    if (row.time_slot === null) {
      fullDays.add(row.slot_date);
      continue;
    }
    const existing = slots.get(row.slot_date) ?? new Set<string>();
    existing.add(row.time_slot);
    slots.set(row.slot_date, existing);
  }
  return { slots, fullDays };
}

export function isDayFull(availability: Availability, date: Date): boolean {
  const key = toDateKey(date);
  if (availability.fullDays.has(key)) return true;
  const taken = availability.slots.get(key);
  return taken !== undefined && TIME_SLOTS.every((slot) => taken.has(slot));
}

export function isSlotTaken(
  availability: Availability,
  date: Date,
  slot: string,
): boolean {
  const key = toDateKey(date);
  if (availability.fullDays.has(key)) return true;
  return availability.slots.get(key)?.has(slot) ?? false;
}

/**
 * Formats raw input as a US phone number: (555) 019-2834.
 * Leading country code "1" is dropped; extra digits beyond 10 are ignored.
 */
export function formatPhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("1")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Six-digit studio pass used by the demo SMS verification step. */
export function generateVerificationCode(): string {
  const value = Math.floor(Math.random() * 1_000_000);
  return value.toString().padStart(6, "0");
}
