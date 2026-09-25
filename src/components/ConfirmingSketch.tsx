const STATUS_LINES = [
  "Payment received — thank you ✦",
  "Inking your slot into the studio ledger…",
  "Sketching your private session pass…",
] as const;

/** Hand-drawn holding screen shown while the payment confirms. */
export function ConfirmingSketch({ note }: { note?: string | undefined }) {
  return (
    <section
      aria-live="polite"
      className="flex min-h-[420px] flex-col items-center justify-center text-center"
    >
      <svg
        aria-hidden="true"
        className="h-44 w-44 text-foreground"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 200 200"
      >
        {/* ink bottle */}
        <path className="sketch-stroke" style={{ animationDelay: "0ms" }} d="M70 96 h60 a8 8 0 0 1 8 8 v42 a14 14 0 0 1 -14 14 h-48 a14 14 0 0 1 -14 -14 v-42 a8 8 0 0 1 8 -8 z" />
        <path className="sketch-stroke" style={{ animationDelay: "260ms" }} d="M84 96 v-12 h32 v12" />
        <path className="sketch-stroke" style={{ animationDelay: "420ms" }} d="M72 130 c14 8 42 8 56 0 v14 a12 12 0 0 1 -12 12 h-32 a12 12 0 0 1 -12 -12 z" />
        {/* needle dipping in */}
        <path className="sketch-stroke" style={{ animationDelay: "620ms" }} d="M150 22 l-38 66" />
        <path className="sketch-stroke" style={{ animationDelay: "760ms" }} d="M144 20 l12 6 -6 12" />
        {/* ink ripples */}
        <path className="sketch-stroke" style={{ animationDelay: "900ms" }} d="M82 122 c8 6 28 6 36 0" />
        <path className="sketch-stroke" style={{ animationDelay: "1020ms" }} d="M40 66 c6 -8 14 -8 20 0" />
        <path className="sketch-stroke" style={{ animationDelay: "1120ms" }} d="M162 112 c6 -8 14 -8 20 0" />
      </svg>

      <h2 className="mt-4 text-3xl font-normal leading-snug sm:text-4xl">Locking in your session…</h2>
      <p className="mt-2 text-lg text-ink-pencil">Hang tight — don&apos;t close this page.</p>

      <ul className="mt-6 space-y-2 text-left font-mono text-sm text-ink-pencil">
        {STATUS_LINES.map((line, index) => (
          <li
            key={line}
            className="sketch-status flex items-start gap-2"
            style={{ animationDelay: `${index * 420}ms` }}
          >
            <span className="text-cyan-draft">✎</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {note ? <p className="mt-6 max-w-md text-sm text-ink-dim">{note}</p> : null}
    </section>
  );
}
