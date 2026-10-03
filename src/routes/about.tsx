import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_ORIGIN } from "@/lib/studio-location";
import { OG_IMAGE_URL } from "@/lib/social";

export const Route = createFileRoute("/about")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "About the studio — Fresh Ink: Book your session" },
      { name: "description", content: "Fresh Ink is an appointment-only custom linework tattoo studio in Saint Paul, Minnesota. Book a session online or through your AI assistant." },
      { property: "og:title", content: "About the studio — Fresh Ink: Book your session" },
      { property: "og:description", content: "Appointment-only custom linework tattoo studio in Saint Paul, Minnesota." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${APP_ORIGIN}/about` },
      { property: "og:image", content: OG_IMAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${APP_ORIGIN}/about` }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="sketchbook-canvas relative min-h-dvh px-4 py-6 sm:px-6 sm:py-10">
      <div className="paper-fiber" aria-hidden="true" />
      <main className="relative z-10 mx-auto w-full max-w-3xl">
        <Link to="/" className="group inline-flex items-center gap-1.5 font-hand text-lg text-ink-pencil transition-colors hover:text-foreground">
          <span className="font-mono text-sm transition-transform group-hover:-translate-x-1">←</span>
          <span className="underline decoration-ink-dim/40 underline-offset-4">Back to the booking desk</span>
        </Link>
        <header className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-pencil/70">Field Notes // The Studio</p>
          <h1 className="mt-2 font-hand text-4xl font-bold text-foreground sm:text-5xl">About Fresh Ink</h1>
          <p className="mt-3 max-w-xl font-hand text-lg text-ink-pencil">
            An appointment-only custom linework tattoo studio at 332 Minnesota St Ste N201, Saint Paul, MN 55101.
          </p>
        </header>
        <section className="mt-8 space-y-4 font-hand text-lg leading-relaxed text-ink-pencil">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-ink-pencil/70">How booking works</h2>
          <p>
            Pick a day on the booking desk, choose a time, and lock in your slot. You'll get a private
            session pass by email with your booking details, a calendar invite, and free rescheduling up
            to 24 hours before your session.
          </p>
          <p>
            Fresh Ink is currently in a free proof of concept: there is no payment step right now, and
            holds lock in directly. If paid booking launches later, pricing will be published on the{" "}
            <Link to="/pricing" className="underline decoration-cyan-draft/60 underline-offset-2 hover:text-foreground">pricing page</Link>.
          </p>
        </section>
        <section className="mt-8 space-y-4 font-hand text-lg leading-relaxed text-ink-pencil">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-ink-pencil/70">For AI assistants</h2>
          <p>
            Assistants like ChatGPT and Claude can check open times and hold a session for their user
            through the MCP connector, then hand the user a checkout link to lock it in themselves.
            Start at the <Link to="/agents" className="underline decoration-cyan-draft/60 underline-offset-2 hover:text-foreground">agent docs</Link> or
            the <Link to="/developers" className="underline decoration-cyan-draft/60 underline-offset-2 hover:text-foreground">developer portal</Link>.
          </p>
        </section>
        <section className="mt-8 space-y-4 font-hand text-lg leading-relaxed text-ink-pencil">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-ink-pencil/70">Who makes it</h2>
          <p>
            Fresh Ink is a project by Mike Demopoulos (MikeDemo). The site is open source at{" "}
            <a href="https://github.com/Mike-Demo/charm-project-place" target="_blank" rel="noopener noreferrer" className="underline decoration-cyan-draft/60 underline-offset-2 hover:text-foreground">
              github.com/Mike-Demo/charm-project-place
            </a>. Questions? Write to <a href="mailto:studio@freshink.art" className="underline decoration-cyan-draft/60 underline-offset-2 hover:text-foreground">studio@freshink.art</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
