export interface ProjectEntry {
  readonly slug: string;
  readonly name: string;
  readonly summary: string;
  readonly blurb: string;
  readonly externalUrl: string;
  readonly status: string;
  readonly technologies: readonly string[];
  readonly projectPath: `/projects/${string}`;
}

export const PROJECTS: readonly ProjectEntry[] = [
  {
    slug: "fresh-ink",
    name: "Fresh Ink",
    summary: "Appointment-only tattoo booking experience with a hand-drawn paper UI.",
    blurb:
      "Fresh Ink is a TypeScript/TanStack Router app for booking custom linework tattoo sessions in Saint Paul. It guides clients through day, slot, verification, and pass delivery in one guided flow.",
    externalUrl: "https://freshink.art/",
    status: "Live",
    technologies: ["TypeScript", "TanStack Router", "React", "Tailwind CSS", "Supabase"],
    projectPath: "/projects/fresh-ink",
  },
] as const;

export function getProjectBySlug(slug: string): ProjectEntry | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}
