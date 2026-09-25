import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactElement } from "react";

interface LicenseEntry {
  readonly name: string;
  readonly author: string;
  readonly license: string;
  readonly url: string;
  readonly note?: string;
}

interface LicenseGroup {
  readonly title: string;
  readonly entries: readonly LicenseEntry[];
}

const DESCRIPTION =
  "Licenses and credits for the open-source libraries, typefaces, and services used by Tattoo Atelier. Appointment-only custom linework studio in Saint Paul.";

const GROUPS: readonly LicenseGroup[] = [
  {
    title: "Typefaces",
    entries: [
      {
        name: "Coming Soon",
        author: "Open Window",
        license: "SIL Open Font License 1.1",
        url: "https://fonts.google.com/specimen/Coming+Soon",
        note: "The handwritten type every question and note is set in.",
      },
      {
        name: "JetBrains Mono",
        author: "JetBrains",
        license: "SIL Open Font License 1.1",
        url: "https://fonts.google.com/specimen/JetBrains+Mono",
        note: "The mono face used for labels, codes, and ledger stamps.",
      },
    ],
  },
  {
    title: "Framework & tooling",
    entries: [
      {
        name: "React",
        author: "Meta Platforms, Inc. and contributors",
        license: "MIT",
        url: "https://github.com/facebook/react/blob/main/LICENSE",
        note: "The UI library every page is built with.",
      },
      {
        name: "TanStack Start & Router",
        author: "Tanner Linsley and contributors",
        license: "MIT",
        url: "https://github.com/TanStack/router/blob/main/LICENSE",
        note: "Routing, server rendering, and server functions.",
      },
      {
        name: "TanStack Query",
        author: "Tanner Linsley and contributors",
        license: "MIT",
        url: "https://github.com/TanStack/query/blob/main/LICENSE",
        note: "Data fetching and caching wired into the router.",
      },
      {
        name: "Vite",
        author: "Evan You and Vite contributors",
        license: "MIT",
        url: "https://github.com/vitejs/vite/blob/main/LICENSE",
        note: "Dev server and production bundler.",
      },
      {
        name: "TypeScript",
        author: "Microsoft Corporation",
        license: "Apache-2.0",
        url: "https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt",
        note: "Every source file on this site is typed.",
      },
      {
        name: "Tailwind CSS",
        author: "Tailwind Labs, Inc.",
        license: "MIT",
        url: "https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE",
        note: "Utility styling layer under the paper and ink.",
      },
      {
        name: "Zod",
        author: "Colin McDonnell and contributors",
        license: "MIT",
        url: "https://github.com/colinhacks/zod/blob/main/LICENSE",
        note: "Schema validation for booking data.",
      },
      {
        name: "anime.js",
        author: "Julian Garnier and contributors",
        license: "MIT",
        url: "https://github.com/juliangarnier/anime/blob/master/LICENSE.md",
        note: "The line-boil, sketch-draw, and step-artwork animations.",
      },
    ],
  },
  {
    title: "Platform",
    entries: [
      {
        name: "Lovable Cloud",
        author: "Lovable",
        license: "Hosted platform",
        url: "https://lovable.dev",
        note: "Database, authentication, and transactional email behind the booking ledger.",
      },
      {
        name: "Paddle",
        author: "Paddle.com Market Ltd.",
        license: "Hosted checkout",
        url: "https://www.paddle.com",
        note: "Runs the $1 test checkout that locks in a slot.",
      },
    ],
  },
  {
    title: "Studio",
    entries: [
      {
        name: "A Thousand Pansies",
        author: "A Thousand Pansies project",
        license: "Donation recipient",
        url: "https://www.npr.org/2022/11/25/1138996633/pansy-tattoos-nonbinary-artist-trans-activism",
        note: "The $1 donation that locks in every session supports this project.",
      },
      {
        name: "Needle logo & step sketches",
        author: "Drawn for Tattoo Atelier",
        license: "All rights reserved",
        url: "/",
        note: "The boiling needle mark and the field-note drawings above each step.",
      },
    ],
  },
];

interface TestLink {
  readonly href: string;
  readonly label: string;
  readonly note: string;
}

const TEST_LINKS: readonly TestLink[] = [
  {
    href: "/?replay=1",
    label: "/?replay=1",
    note: "Replays the sketch loading animation and the studio-draft entrance, as many times as you like.",
  },
  {
    href: "/?intro=1",
    label: "/?intro=1",
    note: "Same as above — an alias. “?sketch=1” works too, on any page address.",
  },
  {
    href: "/licenses?replay=1",
    label: "/licenses?replay=1",
    note: "The same trick on this page, so you can see the entrance over any screen.",
  },
  {
    href: "/auth",
    label: "/auth",
    note: "Studio ledger sign-in — the only way into the admin view.",
  },
  {
    href: "/admin",
    label: "/admin",
    note: "Booking ledger and calendar. Locked until you sign in through the link above.",
  },
];

export const Route = createFileRoute("/licenses")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Open Source & Credits — Fresh Ink: Book your session" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Open Source & Credits — Fresh Ink: Book your session" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Licenses,
});

function Licenses(): ReactElement {
  return (
    <div className="sketchbook-canvas relative min-h-dvh px-4 py-6 sm:px-6 sm:py-10">
      <div className="paper-fiber" aria-hidden="true" />
      <main className="relative z-10 mx-auto w-full max-w-3xl">
        <Link
          to="/"
          className="group inline-flex items-center gap-1.5 font-hand text-lg text-ink-pencil transition-colors hover:text-foreground"
        >
          <span className="font-mono text-sm transition-transform group-hover:-translate-x-1">←</span>
          <span className="underline decoration-ink-dim/40 underline-offset-4">Back to the booking desk</span>
        </Link>

        <header className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-pencil/70">
            Field Notes // Colophon
          </p>
          <h1 className="mt-2 font-hand text-4xl font-bold text-foreground sm:text-5xl">
            Open source &amp; credits
          </h1>
          <p className="mt-3 max-w-xl font-hand text-lg text-ink-pencil">
            This atelier is built on freely licensed software and typefaces.
            Every library and service it relies on is credited below.
          </p>
        </header>

        <section className="mt-10" aria-labelledby="proof-of-concept">
          <h2
            id="proof-of-concept"
            className="font-hand text-2xl font-bold text-foreground underline decoration-cyan-draft/50 decoration-wavy underline-offset-8"
          >
            Proof of concept
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <article className="sketch-card p-4">
              <h3 className="font-hand text-xl font-bold text-foreground">Phone verification code</h3>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                Demo only · no real texts
              </p>
              <p className="mt-2 font-hand text-base text-ink-pencil">
                The six-digit code step is simulated. Nothing is sent to your phone — the code is
                shown on screen so you can try the flow.
              </p>
            </article>
            <article className="sketch-card p-4">
              <h3 className="font-hand text-xl font-bold text-foreground">$1 donation checkout</h3>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                Test mode · no money moves
              </p>
              <p className="mt-2 font-hand text-base text-ink-pencil">
                Checkout runs in test mode with test card numbers only. No real card is charged and
                no donation is collected yet.
              </p>
            </article>
            <article className="sketch-card p-4 sm:col-span-2">
              <h3 className="font-hand text-xl font-bold text-foreground">Test links</h3>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                Try the flow yourself
              </p>
              <ul className="mt-3 space-y-3">
                {TEST_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="font-mono text-xs text-cyan-draft underline decoration-cyan-draft/40 underline-offset-4 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                    <p className="mt-1 font-hand text-base text-ink-pencil">{link.note}</p>
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <p className="mt-5 font-hand text-lg text-ink-pencil">
            Studio artist?{" "}
            <Link
              to="/auth"
              className="font-mono text-sm text-cyan-draft underline decoration-cyan-draft/40 underline-offset-4 transition-colors hover:text-foreground"
            >
              Sign in to the booking ledger →
            </Link>
          </p>
        </section>

        {GROUPS.map((group) => {
          const headingId = `license-${group.title.replaceAll(" ", "-").toLowerCase()}`;
          return (
            <section key={group.title} className="mt-10" aria-labelledby={headingId}>
              <h2
                id={headingId}
                className="font-hand text-2xl font-bold text-foreground underline decoration-cyan-draft/50 decoration-wavy underline-offset-8"
              >
                {group.title}
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {group.entries.map((entry) => (
                  <article key={`${group.title}-${entry.name}`} className="sketch-card doodle-hover p-4">
                    <h3 className="font-hand text-xl font-bold text-foreground">{entry.name}</h3>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                      {entry.author} · {entry.license}
                    </p>
                    {entry.note ? (
                      <p className="mt-2 font-hand text-base text-ink-pencil">{entry.note}</p>
                    ) : null}
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block font-mono text-xs text-cyan-draft underline decoration-cyan-draft/40 underline-offset-4 transition-colors hover:text-foreground"
                    >
                      License source ↗<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
