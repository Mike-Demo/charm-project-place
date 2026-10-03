import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_ORIGIN } from "@/lib/studio-location";
import { OG_IMAGE_URL } from "@/lib/social";

export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Privacy — Fresh Ink: Book your session" },
      { name: "description", content: "What data Fresh Ink collects for bookings, what it does not collect, and how to reach the studio about privacy." },
      { property: "og:title", content: "Privacy — Fresh Ink: Book your session" },
      { property: "og:description", content: "Fresh Ink's data practices: booking details only, no accounts, no data sale." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${APP_ORIGIN}/privacy` },
      { property: "og:image", content: OG_IMAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${APP_ORIGIN}/privacy` }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="sketchbook-canvas relative min-h-dvh px-4 py-6 sm:px-6 sm:py-10">
      <div className="paper-fiber" aria-hidden="true" />
      <main className="relative z-10 mx-auto w-full max-w-3xl">
        <Link to="/" className="group inline-flex items-center gap-1.5 font-hand text-lg text-ink-pencil transition-colors hover:text-foreground">
          <span className="font-mono text-sm transition-transform group-hover:-translate-x-1">←</span>
          <span className="underline decoration-ink-dim/40 underline-offset-4">Back to the booking desk</span>
        </Link>
        <header className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-pencil/70">Field Notes // Fine Print</p>
          <h1 className="mt-2 font-hand text-4xl font-bold text-foreground sm:text-5xl">Privacy</h1>
          <p className="mt-3 max-w-xl font-hand text-lg text-ink-pencil">
            Fresh Ink collects only what a booking needs. No accounts, no advertising profiles, no data sale.
          </p>
        </header>
        <section className="mt-8 space-y-6 font-hand text-lg leading-relaxed text-ink-pencil">
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-ink-pencil/70">What we collect</h2>
            <p className="mt-2">
              When you book: your name, phone number, email address, pronouns (optional), and your tattoo
              idea (optional, text only in this build). Your phone is used for a one-time SMS verification
              code during booking; your email receives your private session pass and booking updates.
              Tattoo idea reference photos are stored privately and attached to your booking only.
            </p>
          </div>
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-ink-pencil/70">What we don't collect</h2>
            <p className="mt-2">
              No accounts or passwords for clients. No payment details — there is no payment step while
              booking is free in proof of concept. We don't sell or share your contact details with
              advertisers or data brokers.
            </p>
          </div>
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-ink-pencil/70">Analytics &amp; rate limiting</h2>
            <p className="mt-2">
              The site uses lightweight, self-hosted analytics for anonymous page views, and per-IP rate
              limiting to keep booking fair for everyone. API agents are identified only by a hashed
              caller fingerprint for abuse prevention.
            </p>
          </div>
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-ink-pencil/70">Your choices</h2>
            <p className="mt-2">
              Write to <a href="mailto:studio@freshink.art" className="underline decoration-cyan-draft/60 underline-offset-2 hover:text-foreground">studio@freshink.art</a> to
              ask what we hold about you, correct it, or delete your booking and contact details.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
