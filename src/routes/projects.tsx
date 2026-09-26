import { Link, createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { PROJECTS } from "@/lib/projects";
import { APP_ORIGIN } from "@/lib/studio-location";
import { OG_IMAGE_URL } from "@/lib/social";

const DESCRIPTION =
  "Project showcase for Mike Demo, including Fresh Ink — an appointment-only custom linework booking experience built with TypeScript and TanStack Router.";

export const Route = createFileRoute("/projects")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Projects — Mike Demo" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Projects — Mike Demo" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${APP_ORIGIN}/projects` },
      { property: "og:image", content: OG_IMAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE_URL },
    ],
    links: [{ rel: "canonical", href: `${APP_ORIGIN}/projects` }],
  }),
  component: ProjectsPage,
});

function ProjectsPage(): ReactElement {
  return (
    <div className="sketchbook-canvas relative min-h-dvh px-4 py-6 sm:px-6 sm:py-10">
      <div className="paper-fiber" aria-hidden="true" />
      <main className="relative z-10 mx-auto w-full max-w-3xl">
        <Link
          to="/"
          className="group inline-flex items-center gap-1.5 font-hand text-lg text-ink-pencil transition-colors hover:text-foreground"
        >
          <span className="font-mono text-sm transition-transform group-hover:-translate-x-1">←</span>
          <span className="underline decoration-ink-dim/40 underline-offset-4">Back to Fresh Ink</span>
        </Link>

        <header className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-pencil/70">Field Notes // Projects</p>
          <h1 className="mt-2 font-hand text-4xl font-bold text-foreground sm:text-5xl">Selected projects</h1>
          <p className="mt-3 max-w-xl font-hand text-lg text-ink-pencil">
            A look at live products and experiments, built with the same sketchbook-first craft used on Fresh Ink.
          </p>
        </header>

        <section className="mt-10 grid gap-4" aria-label="Projects list">
          {PROJECTS.map((project) => (
            <article key={project.slug} className="sketch-card doodle-hover p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-hand text-2xl font-bold text-foreground">{project.name}</h2>
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">{project.status}</span>
              </div>
              <p className="mt-2 font-hand text-base text-ink-pencil">{project.summary}</p>
              <p className="mt-3 font-hand text-base text-ink-pencil">{project.blurb}</p>
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
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Link
                  to={project.projectPath}
                  className="font-mono text-xs text-cyan-draft underline decoration-cyan-draft/40 underline-offset-4 transition-colors hover:text-foreground"
                >
                  Case study →
                </Link>
                <a
                  href={project.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-cyan-draft underline decoration-cyan-draft/40 underline-offset-4 transition-colors hover:text-foreground"
                >
                  Visit site ↗<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
