import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_ORIGIN } from "@/lib/studio-location";
import { OG_IMAGE_URL } from "@/lib/social";

export const Route = createFileRoute("/contact")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Contact the studio — Fresh Ink: Book your session" },
      { name: "description", content: "Reach Fresh Ink: studio email, street address in Saint Paul, MN, and the maker's profiles." },
      { property: "og:title", content: "Contact the studio — Fresh Ink: Book your session" },
      { property: "og:description", content: "Email, address, and profiles for Fresh Ink tattoo studio." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${APP_ORIGIN}/contact` },
      { property: "og:image", content: OG_IMAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${APP_ORIGIN}/contact` }],
  }),
  component: ContactPage,
});

const rows = [
  { label: "Studio email", value: "studio@freshink.art", href: "mailto:studio@freshink.art", note: "Booking questions, rescheduling help, and general inquiries." },
  { label: "Studio address", value: "332 Minnesota St Ste N201, Saint Paul, MN 55101", href: "https://www.google.com/maps?q=332+Minnesota+St+Ste+N201,+Saint+Paul,+MN+55101", note: "Appointment only — book online before visiting." },
  { label: "GitHub", value: "github.com/Mike-Demo/charm-project-place", href: "https://github.com/Mike-Demo/charm-project-place", note: "The site's public source code; file issues there." },
  { label: "Maker", value: "Mike Demopoulos (MikeDemo)", href: "https://mikedemo.com", note: "Project updates and other work." },
];

function ContactPage() {
  return (
    <div className="sketchbook-canvas relative min-h-dvh px-4 py-6 sm:px-6 sm:py-10">
      <div className="paper-fiber" aria-hidden="true" />
      <main className="relative z-10 mx-auto w-full max-w-3xl">
        <Link to="/" className="group inline-flex items-center gap-1.5 font-hand text-lg text-ink-pencil transition-colors hover:text-foreground">
          <span className="font-mono text-sm transition-transform group-hover:-translate-x-1">←</span>
          <span className="underline decoration-ink-dim/40 underline-offset-4">Back to the booking desk</span>
        </Link>
        <header className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-pencil/70">Field Notes // Say Hello</p>
          <h1 className="mt-2 font-hand text-4xl font-bold text-foreground sm:text-5xl">Contact</h1>
          <p className="mt-3 max-w-xl font-hand text-lg text-ink-pencil">
            Email is fastest for anything about a booking. The studio is appointment-only, so book online before stopping by.
          </p>
        </header>
        <section className="mt-8">
          <ul className="space-y-4">
            {rows.map((row) => (
              <li key={row.label} className="rounded-sm border border-ink-dim/30 bg-card p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-pencil/70">{row.label}</div>
                <a href={row.href} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-hand text-xl text-foreground underline decoration-cyan-draft/60 underline-offset-4 hover:opacity-80">
                  {row.value}
                </a>
                <p className="mt-1 font-hand text-base text-ink-pencil">{row.note}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
