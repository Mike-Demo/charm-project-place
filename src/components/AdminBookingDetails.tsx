import { CalendarPlus, Check, ExternalLink, Mail, Phone, X } from "lucide-react";
import { AdminIdea } from "@/components/IdeaGallery";
import { LifecycleTimeline } from "@/components/LifecycleTimeline";
import { Button } from "@/components/ui/button";
import { fromDateKey, formatLongDate, type Appointment } from "@/lib/atelier";
import { googleCalendarUrl } from "@/lib/ics";

interface Props {
  booking: Appointment | null;
  loading: boolean;
  error: boolean;
  busy: boolean;
  onStatus: (id: string, status: string) => void;
  onClose: () => void;
}

export function AdminBookingDetails({ booking, loading, error, busy, onStatus, onClose }: Props) {
  return (
    <section aria-label="Booking details" className="min-w-0 border-t border-ink-dim/40 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase text-ink-pencil">Session file / details</p>
        {booking && <Button variant="ghost" size="icon" aria-label="Close booking details" title="Close booking details" onClick={onClose}><X className="size-4" /></Button>}
      </div>
      {loading ? <p className="mt-8 text-ink-pencil" role="status">Opening session file…</p> :
       error ? <p className="mt-8 text-pencil-red" role="alert">Could not open this booking. Please try again.</p> :
       !booking ? <p className="mt-8 text-ink-pencil">Select a booking to see the session details.</p> : (
        <div className="mt-4 space-y-6">
          <div className="border-b border-dashed border-ink-dim/50 pb-5">
            <h3 className="text-3xl leading-tight">{booking.client_name}</h3>
            <p className="mt-1 text-ink-pencil">{booking.pronouns || "Pronouns not provided"}</p>
            <p className="mt-3 font-mono text-xs uppercase text-ink-pencil">{booking.status} · Payment {booking.payment_status ?? "unknown"}</p>
          </div>
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div><dt className="font-mono text-[11px] uppercase text-ink-pencil">Date</dt><dd className="mt-1 text-xl">{formatLongDate(fromDateKey(booking.booking_date))}</dd></div>
            <div><dt className="font-mono text-[11px] uppercase text-ink-pencil">Time</dt><dd className="mt-1 text-xl">{booking.time_slot}</dd></div>
            <div className="min-w-0"><dt className="font-mono text-[11px] uppercase text-ink-pencil">Phone</dt><dd className="mt-1 break-words"><a className="inline-flex items-center gap-2 underline underline-offset-4" href={`tel:${booking.phone}`}><Phone className="size-4 shrink-0" />{booking.phone}</a></dd></div>
            <div className="min-w-0"><dt className="font-mono text-[11px] uppercase text-ink-pencil">Email</dt><dd className="mt-1 break-all"><a className="inline-flex items-center gap-2 underline underline-offset-4" href={`mailto:${booking.email}`}><Mail className="size-4 shrink-0" />{booking.email}</a></dd></div>
          </dl>
          <LifecycleTimeline booking={booking} />
          <div className="border-t border-dashed border-ink-dim/50 pt-5">
            <h4 className="text-xl">Tattoo idea</h4>
            {booking.idea_description || booking.reference_image_path || booking.concept_sketch_path ? (
              <AdminIdea id={booking.id} description={booking.idea_description ?? null} referencePath={booking.reference_image_path ?? null} sketchPath={booking.concept_sketch_path ?? null} />
            ) : <p className="mt-2 text-ink-pencil">No idea provided.</p>}
          </div>
          {booking.notes && <div><h4 className="font-mono text-[11px] uppercase text-ink-pencil">Studio notes</h4><p className="mt-2 whitespace-pre-wrap">{booking.notes}</p></div>}
          {booking.rescheduled_at && <p className="border-t border-dashed border-ink-dim/50 pt-4 text-sm text-ink-pencil">Rescheduled {booking.reschedule_count ?? 1} time(s) · Last moved {new Date(booking.rescheduled_at).toLocaleDateString()}</p>}
          <div className="flex flex-wrap gap-2 border-t border-dashed border-ink-dim/50 pt-5">
            {booking.status === "confirmed" && <Button variant="outline" disabled={busy} onClick={() => onStatus(booking.id, "completed")}><Check className="size-4" />Mark completed</Button>}
            {(booking.status === "confirmed" || booking.status === "pending") && <Button variant="outline" disabled={busy} onClick={() => onStatus(booking.id, "cancelled")}><X className="size-4" />Cancel booking</Button>}
            <Button variant="outline" asChild><a href={googleCalendarUrl(booking)} target="_blank" rel="noopener noreferrer"><CalendarPlus className="size-4" />Calendar <ExternalLink className="size-3" /><span className="sr-only"> (opens in a new tab)</span></a></Button>
          </div>
        </div>
      )}
    </section>
  );
}