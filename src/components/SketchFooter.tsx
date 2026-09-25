import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactElement } from "react";
import { STUDIO_ADDRESS, STUDIO_HOURS, STUDIO_MAP_URL } from "@/lib/studio-location";

interface SocialLink {
  /** Accessible label, e.g. "MikeDemo on LinkedIn". */
  readonly label: string;
  /** Absolute URL, opened in a new tab. */
  readonly href: string;
  /** Visible text next to the icon. */
  readonly text: string;
  /** Hand-drawn pencil glyph for the link. */
  readonly glyph: string;
}

const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    label: "MikeDemo on LinkedIn",
    href: "https://www.linkedin.com/in/mikedemopoulos",
    text: "LinkedIn",
    glyph: "✎",
  },
  {
    label: "MikeDemo on X",
    href: "https://x.com/mike_demo",
    text: "X",
    glyph: "✗",
  },
  {
    label: "@demo on tweet.app",
    href: "https://app.tweet.app/post/92206629-1525-4a74-8f51-39e226fc9e75",
    text: "tweet.app",
    glyph: "✉",
  },
  {
    label: "MikeDemo on Threads",
    href: "https://www.threads.com/@mdemop",
    text: "Threads",
    glyph: "❋",
  },
];

/**
 * Sketchbook site footer: studio attribution, copyright, open-source credits
 * link, and social links. The year resolves after hydration so prerendered
 * pages never mismatch.
 */
export function SketchFooter(): ReactElement {
  const [year, setYear] = useState<number | undefined>(undefined);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-4 border-t border-ink-dim/20 px-4 pb-6 pt-5 text-xs text-ink-pencil">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">
          Tattoo Atelier // Novo // P. 02
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-pencil/70">
          Atelier Session Protocol // Ink &amp; Needle
        </span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 font-mono text-[11px] leading-relaxed text-ink-pencil">
        <a href={STUDIO_MAP_URL} target="_blank" rel="noopener noreferrer" className="underline decoration-ink-dim/40 underline-offset-4 hover:text-foreground">
          {STUDIO_ADDRESS}<span className="sr-only"> (opens in a new tab)</span>
        </a>
        <span>Hours: {STUDIO_HOURS}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 font-hand text-sm text-ink-pencil">
          <span>Made by MikeDemo</span>
          {year === undefined ? null : <span aria-label={`Copyright ${year}`}>© {year}</span>}
        </div>

        <nav aria-label="Legal links">
          <Link
            to="/licenses"
            className="group inline-flex items-center gap-1.5 font-hand text-sm text-ink-pencil underline decoration-ink-dim/40 underline-offset-4 transition-colors hover:text-foreground"
          >
            <span aria-hidden="true" className="text-cyan-draft transition-transform group-hover:-rotate-12">
              ✦
            </span>
            Open Source
          </Link>
        </nav>

        <nav aria-label="Social links" className="flex flex-wrap items-center gap-3">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.label} (opens in new tab)`}
              className="group inline-flex items-center gap-1 font-mono text-[11px] text-ink-dim underline decoration-ink-dim/30 underline-offset-4 transition-colors hover:text-foreground"
            >
              <span aria-hidden="true" className="text-cyan-draft transition-transform group-hover:-translate-y-0.5">
                {link.glyph}
              </span>
              {link.text}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
