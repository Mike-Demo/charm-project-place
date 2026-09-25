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
