import { fromDateKey, slotMinutes, type Appointment } from "./atelier";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toIcsStamp(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`
  );
}

export function appointmentStart(appointment: Appointment): Date {
  const base = fromDateKey(appointment.booking_date);
  const minutes = slotMinutes(appointment.time_slot);
  base.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return base;
}

const SESSION_MINUTES = 90;

export function appointmentEnd(appointment: Appointment): Date {
  const end = appointmentStart(appointment);
  end.setMinutes(end.getMinutes() + SESSION_MINUTES);
  return end;
}

export function buildIcs(appointments: readonly Appointment[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fresh Ink//Booking//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const appointment of appointments) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${appointment.id}@tattoo-atelier`,
      `DTSTAMP:${toIcsStamp(new Date(appointment.created_at))}`,
      `DTSTART:${toIcsStamp(appointmentStart(appointment))}`,
      `DTEND:${toIcsStamp(appointmentEnd(appointment))}`,
      `SUMMARY:Tattoo session — ${appointment.client_name}`,
      `DESCRIPTION:${appointment.phone} / ${appointment.email}`,
      `STATUS:${appointment.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function googleCalendarUrl(appointment: Appointment): string {
  const start = toIcsStamp(appointmentStart(appointment));
  const end = toIcsStamp(appointmentEnd(appointment));
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Tattoo session — ${appointment.client_name}`,
    dates: `${start}/${end}`,
    details: `${appointment.phone} / ${appointment.email}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(appointments: readonly Appointment[], filename: string): void {
  const blob = new Blob([buildIcs(appointments)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
