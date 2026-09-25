<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep booking-step header art in `StepArtwork` with a shared SVG coordinate system so transitions never shift the form layout.
- Mount the first-visit preloader in the shared root shell as a fixed overlay so all pages retain their final layout underneath it.
- Tattoo idea photos/sketches live in private bucket `tattoo-ideas`, attached server-side after the slot hold via `attachIdea`; concept sketches stream from `/api/sketch-concept` (image edits) — keeps AI key server-side and avoids orphan uploads.
- Email illustrations use hosted assets with an absolute public URL, because inboxes cannot resolve project-relative image paths.
- Keep studio address and appointment-only hours in one shared location module so website and email copy remain consistent.
- Keep the site title "Fresh Ink: Book your session" and each page's meta description as literal strings inside that route's existing `head()` block (subpages prefix a short page label); no shared metadata module or new head mechanism, so every page's tags stay visible where the page is defined.
- Day-before reminders run from /api/public/hooks/send-reminders, called by pg_cron at 14:00 and 15:00 UTC and gated to 9 AM America/Chicago; the caller is verified against a hashed token in cron_tokens, because this agent can't read vault or LOVABLE_CRON_SECRET.
