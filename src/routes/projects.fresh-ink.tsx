import { Link, createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { getProjectBySlug } from "@/lib/projects";
import { APP_ORIGIN } from "@/lib/studio-location";
import { OG_IMAGE_URL } from "@/lib/social";

const DESCRIPTION =
  "Fresh Ink project case study: appointment-only custom linework booking flow built with TypeScript, TanStack Router, and Supabase.";

export const Route = createFileRoute("/projects/fresh-ink")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Fresh Ink — Project" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Fresh Ink — Project" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${APP_ORIGIN}/projects/fresh-ink` },
      { property: "og:image", content: OG_IMAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE_URL },
    ],
    links: [{ rel: "canonical", href: `${APP_ORIGIN}/projects/fresh-ink` }],
  }),
  component: FreshInkProjectPage,
});

function FreshInkProjectPage(): ReactElement {
  const project = getProjectBySlug("fresh-ink");

  if (!project) {
    return (
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Field notes // projects</p>
        <h1 className="mt-2 font-hand text-4xl font-bold text-foreground">Project not found</h1>
        <Link to="/projects" className="mt-6 inline-flex font-mono text-xs text-cyan-draft underline decoration-cyan-draft/40 underline-offset-4">
          ← Back to projects
        </Link>
      </main>
    );
  }

  return (
    <div className="sketchbook-canvas relative min-h-dvh px-4 py-6 sm:px-6 sm:py-10">
      <div className="paper-fiber" aria-hidden="true" />
      <main className="relative z-10 mx-auto w-full max-w-3xl">
        <Link
          to="/projects"
          className="group inline-flex items-center gap-1.5 font-hand text-lg text-ink-pencil transition-colors hover:text-foreground"
        >
          <span className="font-mono text-sm transition-transform group-hover:-translate-x-1">←</span>
          <span className="underline decoration-ink-dim/40 underline-offset-4">Back to projects</span>
        </Link>

        <header className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-pencil/70">Field Notes // Case Study</p>
          <h1 className="mt-2 font-hand text-4xl font-bold text-foreground sm:text-5xl">{project.name}</h1>
          <p className="mt-3 max-w-xl font-hand text-lg text-ink-pencil">{project.summary}</p>
        </header>

        <section className="mt-10 grid gap-4 sm:grid-cols-2" aria-label="Project details">
          <article className="sketch-card p-4">
            <h2 className="font-hand text-xl font-bold text-foreground">Overview</h2>
            <p className="mt-2 font-hand text-base text-ink-pencil">{project.blurb}</p>
          </article>

          <article className="sketch-card p-4">
            <h2 className="font-hand text-xl font-bold text-foreground">Production link</h2>
            <a
              href={project.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-mono text-xs text-cyan-draft underline decoration-cyan-draft/40 underline-offset-4 transition-colors hover:text-foreground"
            >
              {project.externalUrl} ↗<span className="sr-only"> (opens in a new tab)</span>
            </a>
            <p className="mt-3 font-hand text-base text-ink-pencil">
              Live booking flow for Fresh Ink: choose a day and slot, verify details, and receive a digital session pass.
            </p>
          </article>

          <article className="sketch-card p-4 sm:col-span-2">
            <h2 className="font-hand text-xl font-bold text-foreground">Highlights</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 font-hand text-base text-ink-pencil">
              <li>Step-based booking flow with animated paper interactions and shared step artwork.</li>
              <li>Route-level SEO metadata declared directly in each page&apos;s <code className="font-mono text-xs">head()</code> block.</li>
              <li>Server-side handling for idea uploads and AI-assisted booking tools via MCP routes.</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-ink-dim/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-dim"
                >
                  {tech}
                </span>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
