# Accessibility basics

## Goal
Fix the warnings from the audit so the site meets everyday WCAG AA expectations, without changing the sketchbook look.

## Fixes
1. **Page heading on the booking page** — add a visually hidden "Book a tattoo session" heading so screen readers get a page title (other pages already have one).
2. **Bigger tap targets on phones** — the numbered step buttons and the calendar's previous/next month arrows grow to at least 44x44px.
3. **Readable pencil text** — darken the faint "dim" ink color slightly so small notes pass contrast against the paper.
4. **Visible keyboard focus** — add a hand-inked focus outline to buttons, links, chips, and code boxes so keyboard users can see where they are.
5. **New-tab warnings** — links that open a new tab (footer socials, A Thousand Pansies, test-mode banner, credits, admin calendar) announce "(opens in a new tab)".
6. **Live updates announced** — validation messages and the SMS code errors read out politely when they change.
7. **Mobile full-height** — swap full-screen height for the mobile-safe version so the phone address bar doesn't crop pages.

## Technical details
- `sr-only` h1 in `src/routes/index.tsx` header; `min-h-11 min-w-11` on `size="icon"` step and month buttons.
- Adjust `--ink-dim` in `src/styles.css`; add a shared `:focus-visible` rule using `--cyan-draft`.
- Append `<span className="sr-only">(opens in a new tab)</span>` to every `target="_blank"` link.
- `aria-live="polite"` on the name/phone/email/code feedback regions.
- `min-h-screen` → `min-h-dvh` in routes and root fallbacks.

## Validation
Playwright pass on desktop and 390px mobile: heading present, tap targets measured at 44px or more, focus ring visible when tabbing, no console errors, clean build.

## Rollback
Presentation-only changes; each can be reverted independently.
