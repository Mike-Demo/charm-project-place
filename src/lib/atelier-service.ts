import { supabase } from "@/integrations/supabase/client";

import {
  toDateKey,
  type Appointment,
  type BlockedSlot,
  type UnavailableSlot,
} from "./atelier";

export async function fetchUnavailableSlots(from: Date, to: Date): Promise<UnavailableSlot[]> {
  const { data, error } = await supabase.rpc("get_unavailable_slots", {
    p_from: toDateKey(from),
    p_to: toDateKey(to),
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as UnavailableSlot[];
}

export interface BookingInput {
  name: string;
  phone: string;
  email: string;
  date: Date;
  timeSlot: string;
  pronouns: string;
}

export async function bookAppointment(input: BookingInput): Promise<string> {
  const { data, error } = await supabase.rpc("book_appointment", {
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email,
    p_date: toDateKey(input.date),
    p_time_slot: input.timeSlot,
    p_pronouns: input.pronouns,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function fetchAppointments(from: Date, to: Date): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .gte("booking_date", toDateKey(from))
    .lte("booking_date", toDateKey(to))
    .order("booking_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Appointment[];
}

export async function fetchBlockedSlots(from: Date, to: Date): Promise<BlockedSlot[]> {
  const { data, error } = await supabase
    .from("blocked_slots")
    .select("*")
    .gte("blocked_date", toDateKey(from))
    .lte("blocked_date", toDateKey(to));
  if (error) throw new Error(error.message);
  return (data ?? []) as BlockedSlot[];
}

export async function setAppointmentStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function blockSlot(date: Date, timeSlot: string | null, reason: string | null): Promise<void> {
  const { error } = await supabase
    .from("blocked_slots")
    .insert({ blocked_date: toDateKey(date), time_slot: timeSlot, reason });
  if (error) throw new Error(error.message);
}

export async function unblockSlot(id: string): Promise<void> {
  const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  return data === true;
}

export async function claimAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("claim_admin");
  if (error) throw new Error(error.message);
  return data === true;
}
