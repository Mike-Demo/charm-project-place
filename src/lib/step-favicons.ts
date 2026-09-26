/**
 * Tiny sketch favicons, one per booking step, encoded as SVG data URIs so the
 * tab icon swaps instantly with no extra network requests.
 */

const PAPER = "#FBF2DD";
const INK = "#262320";
const ACCENT = "#1F7A8C";

const wrap = (body: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${PAPER}"/><g fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

/** Index 0 matches step 1. */
const STEP_MARKS: ReadonlyArray<string> = [
  // 1 — Name: inkwell and dipping quill
  wrap(`<path d="M7 20h10v4a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z"/><path d="M8 20l2-3h4l2 3"/><path d="M26 5L15 16"/><path d="M22 5h4v4" stroke="${ACCENT}"/>`),
  // 2 — Pronouns: folio tag
  wrap(`<path d="M17 5H8a3 3 0 0 0-3 3v9l11 11 11-11z"/><circle cx="10" cy="11" r="1.6" fill="${INK}"/><path d="M18 17l3 3" stroke="${ACCENT}"/>`),
  // 3 — Day: pocket datebook
  wrap(`<rect x="5" y="8" width="22" height="19" rx="3"/><path d="M5 14h22"/><path d="M11 5v6M21 5v6"/><path d="M11 20h5" stroke="${ACCENT}"/>`),
  // 4 — Date & time: pocket watch
  wrap(`<circle cx="16" cy="18" r="10"/><path d="M16 12v6l4 3" stroke="${ACCENT}"/><path d="M13 5h6M16 5v3"/>`),
  // 5 — Phone: handset
  wrap(`<path d="M8 5c2 0 3 1 4 4l-2 3c1 4 4 7 8 8l3-2c3 1 4 2 4 4s-2 5-5 5C13 27 5 19 5 10c0-3 2-5 3-5z"/>`),
  // 6 — Verify: stamped envelope
  wrap(`<rect x="4" y="8" width="24" height="17" rx="3"/><path d="M4 11l12 8 12-8"/><path d="M21 21h4" stroke="${ACCENT}"/>`),
  // 7 — Email: paper stencil in flight
  wrap(`<path d="M27 6L5 15l8 3 3 8z"/><path d="M27 6L13 18" stroke="${ACCENT}"/>`),
  // 8 — Idea: sketched bulb
  wrap(`<path d="M16 4a8 8 0 0 1 5 14v3h-10v-3a8 8 0 0 1 5-14z"/><path d="M13 25h6M14 28h4" stroke="${ACCENT}"/>`),
  // 9 — Review: pressed wax seal
  wrap(`<circle cx="16" cy="14" r="8"/><path d="M12 14l3 3 5-6" stroke="${ACCENT}"/><path d="M11 21l-2 8 7-4 7 4-2-8"/>`),
];

export const DEFAULT_FAVICON = "/favicon.png";

export const faviconForStep = (step: number): string => {
  const mark = STEP_MARKS[step - 1] ?? STEP_MARKS[0];
  return mark;
};


/** Swap the document favicon; returns nothing on the server. */
export const setFavicon = (href: string): void => {
  if (typeof document === "undefined") return;
  const existing = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  const link = existing ?? document.createElement("link");
  link.rel = "icon";
  link.type = href.startsWith("data:image/svg") ? "image/svg+xml" : "image/png";
  link.href = href;
  if (!existing) document.head.appendChild(link);
};
