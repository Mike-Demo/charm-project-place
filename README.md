# Book your session

Build this app using the HTML files referenced below. You can hotlink the images referenced in the HTML. The attached images are screenshots of the desired screens. Here are public links to the html of the screens which you should read and use to build the app:

1. https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YzRjY2YyYmQwZGYwN2M0ZWViYzEzMDk5N2ZlEgsSBxDh_pr8qQcYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjYxODQ1NjE0NjkyOTg1MjM4MA&filename=&opi=89354086

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://charm-project-place.lovable.app

This project stays in sync with the [Lovable editor](https://lovable.dev/projects/32bdc8d3-4ce3-43ea-9a80-fe1034eda005).

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
## Environment & secret handling

- Do not commit `.env` files with real credentials. Use `.env.example` as the template for local setup.
- Local secrets should be stored in an untracked `.env` file; deployment secrets should be configured in your hosting/platform secret manager.
- The previously committed live payment client token must be manually rotated or revoked in the payment provider outside this repository.

## Security audit triage — 2026-10-21

Parent: [Mike-Demo/charm-project-place#9](https://github.com/Mike-Demo/charm-project-place/issues/9).
This is the ready-to-file issue backlog fallback because issue creation is unavailable in this session.
No remediation has been applied. The audit used static source inspection only; neither the audit nor this triage probed deployed endpoints.

### Priority and grouping

| Order | Confirmed finding | Severity | Reachability, impact, and fix size |
| --- | --- | --- | --- |
| 1 | `get_booking_token` credential disclosure | high | Anonymous callers who learn a confirmed, paid booking ID can obtain its bearer credential, exposing PII, rescheduling, attendance confirmation, and private idea images. A narrowly scoped authorization migration plus confirmation-flow update addresses the entry point. |
| 2 | `get_confirmed_booking` contact disclosure | medium | The same anonymous, ID-only access exposes confirmed clients' contact details directly. Fix alongside token disclosure so this alternate read path cannot bypass the repair. |
| 3 | `release_pending_appointment` unauthorized release | medium | Anonymous callers who learn a pending booking ID can cancel its hold during the hold window. Adding a secret predicate and threading the secret through callers is small and localized. |
| 4 | Unverified agent API key issuance | low | No booking ID or account is needed: a syntactically valid email suffices, subject to the current write quota. Each key grants a new, higher-limit identity. Impact is quota/resource abuse rather than direct booking access; verification and key lifecycle changes are broader than the RPC fixes. |

The first three findings form **one root-cause group**: `SECURITY DEFINER` booking RPCs cross the appointments authorization boundary using an ID alone, without an owner secret or admin check. File them together at the group's highest severity (high), retaining the individual severities and order above. Booking IDs are not credentials; disclosure is a prerequisite, not a claim that IDs are enumerable. Contact disclosure ranks above hold cancellation because it exposes lasting private information, while cancellation is limited to pending holds. Fix size is a tie-breaker, not a reason to defer credential exposure.

The fourth finding has a separate root cause: activating an elevated quota identity before verifying its owner and bounding its lifetime. The two leads below remain unranked and carry no severity until their missing deployment facts are established.

### Ready-to-file issue 1

**Title:** `[security][high] Require ownership proof for booking RPCs`

**Body:**

Parent audit: https://github.com/Mike-Demo/charm-project-place/issues/9

**Scope and priority:** First remediation group. Three confirmed findings share missing object-level authorization in privileged booking RPCs:

1. **high — `anon-rpc-booking-token-disclosure-by-id`:** [`get_booking_token`, migration 0005, lines 19–23 and 61](https://github.com/Mike-Demo/charm-project-place/blob/3befe00e911d5d1a080eea962fdd658739e3584e/drizzle/migrations/0005_booking_access_token_reschedule.sql#L19-L63) returns `access_token` for a confirmed, paid booking filtered only by ID; `anon` and `authenticated` have EXECUTE. Anyone with the ID can acquire the sole bearer credential for the session pass and access PII, rescheduling, attendance confirmation, and private tattoo-idea images.
2. **medium — `anon-rpc-confirmed-booking-pii-by-id`:** [`get_confirmed_booking`, migration 0004, lines 1–26](https://github.com/Mike-Demo/charm-project-place/blob/3befe00e911d5d1a080eea962fdd658739e3584e/drizzle/migrations/0004_get_confirmed_booking.sql#L1-L26) returns name, phone, email, pronouns, booking date and time for a confirmed, paid booking by ID alone, with EXECUTE granted to `anon` and `authenticated`. It bypasses the admin-only direct-read RLS baseline without re-imposing an owner check.
3. **medium — `anon-rpc-release-any-pending-hold-by-id`:** [`release_pending_appointment`, migration 0002, lines 52–57 and 69](https://github.com/Mike-Demo/charm-project-place/blob/3befe00e911d5d1a080eea962fdd658739e3584e/drizzle/migrations/0002_slot_hold_payments.sql#L52-L70) sets both status and payment status to expired using only ID and pending status, with EXECUTE granted to `anon` and `authenticated`. A caller with another client's pending booking ID can release that slot during its hold window.

**Root cause:** These `SECURITY DEFINER` functions perform privileged reads or updates without verifying the booking's `hold_secret`, current `access_token`, or an authorized admin. An identifier is incorrectly treated as authorization. The [client wrappers, lines 54–77](https://github.com/Mike-Demo/charm-project-place/blob/3befe00e911d5d1a080eea962fdd658739e3584e/src/lib/atelier-service.ts#L54-L77) likewise supply only `p_id`.

**Smallest complete fix:**

- Add a forward migration requiring `p_secret` matching `hold_secret` for the two confirmation RPCs, mirroring `get_hold_for_checkout`; alternatively, require the current access token where appropriate. Thread the holder's secret through confirmation callers. A server confirmation function that verifies the hold secret before invoking service-only RPCs is an alternative.
- Require `p_secret` and `hold_secret = p_secret` for `release_pending_appointment`, mirroring `confirm_free_hold`, and update `releaseAppointment` and every caller to pass it.
- Remove or revoke the old ID-only signatures, including inherited `PUBLIC` EXECUTE and explicit `anon`/`authenticated` grants; adding an overload alone leaves the bypass open. If choosing service-only access, explicitly grant only the required service role and retain secret verification at the server boundary.
- Update generated RPC types and affected flows together. Preserve legitimate paid/free confirmation, token-based session passes, and holder-initiated release; do not merely revoke grants and break checkout. Do not rewrite already-applied migrations.

**Acceptance checklist:**

- [ ] Direct RPC calls as `anon` and `authenticated` with only another booking's ID cannot disclose its token/PII or expire its hold.
- [ ] Missing, incorrect, or another booking's secret fails closed without leaking protected values or changing state; obsolete ID-only signatures are inaccessible.
- [ ] A matching holder secret allows the intended confirmation and pending-hold release; confirmed/paid bookings cannot be released by the pending-hold RPC.
- [ ] Paid and free checkout confirmation, authorized session-pass actions, and any explicitly retained admin/service workflows still work.

### Ready-to-file issue 2

**Title:** `[security][low] Verify agent key owners and bound key lifetimes`

**Body:**

Parent audit: https://github.com/Mike-Demo/charm-project-place/issues/9

**Finding:** `unauthenticated-agent-key-minting-rate-limit-bypass` — confirmed, low; second remediation group.

**Evidence:** [`POST /api/public/agent-keys`, lines 11–43](https://github.com/Mike-Demo/charm-project-place/blob/3befe00e911d5d1a080eea962fdd658739e3584e/src/routes/api/public/agent-keys.ts#L11-L43) accepts a syntactically valid email after the caller's write-rate check, inserts a hashed random key, and returns the usable key without authentication or email-ownership proof. [`identifyCaller` and rate limits, lines 43–89](https://github.com/Mike-Demo/charm-project-place/blob/3befe00e911d5d1a080eea962fdd658739e3584e/src/lib/public-api.server.ts#L43-L89) accept each matching stored hash as its own `key:` identity, with higher limits (read 600 versus 60/minute; write 30 versus 5/hour; stream 60 versus 10/minute). No per-email active-key cap, expiry, or revocation is enforced in this path.

**Reachability and impact:** Anyone able to POST can mint keys within the current issuance quota, then accumulate permanent independent higher-quota identities; keyed callers also receive the elevated write quota at issuance. This does not require spoofed IP headers or establish unlimited instantaneous issuance. The confirmed impact is erosion of anonymous rate limits and resource-abuse controls.

**Root cause:** Key issuance promotes an unverified email into a higher-trust quota identity without ownership verification, an active-key cap, or a bounded/revocable lifetime.

**Smallest complete fix:** Use magic-link email confirmation before activation; enforce an atomic active-key cap per verified email; add expiry and revocation fields for `agent_api_keys` and check them in `identifyCaller` before granting keyed status. Rate-limit issuance/verification as well as API use. Existing unverified keys must not be grandfathered into permanent elevated access: expire or revoke them and require verified reissuance. Hashing keys at rest should be preserved.

**Acceptance checklist:**

- [ ] Supplying an email alone never yields an active elevated key; confirmation is single-use, expiring, and bound to that email and issuance request.
- [ ] Concurrent issuance cannot exceed the active-key cap for the verified email.
- [ ] Expired, revoked, pending, and legacy unverified keys cannot obtain keyed limits; valid verified active keys retain intended access.
- [ ] Owners can revoke keys, and new issuance cannot indefinitely multiply independent quota identities.

### Ready-to-file issue 3

**Title:** `[security][needs-validation] Audit leads to validate`

**Body:**

Parent audit: https://github.com/Mike-Demo/charm-project-place/issues/9

These are static-inspection leads, not confirmed vulnerabilities. No severity is assigned. Both missing-fact statements in the parent issue end with an ellipsis; the quotations below preserve them verbatim, without inventing the omitted text. Obtain the full wording from the audit owner if needed. Collect deployment evidence or use an explicitly authorized, controlled environment; do not probe production or metadata services without permission.

- [ ] **Rate-limit and hold-quota identity trusts client-supplied cf-connecting-ip / x-forwarded-for headers**
  - Fingerprint: `spoofable-caller-ip-rate-limit-bypass`.
  - Claimed root cause/evidence: caller identity prefers `cf-connecting-ip`, then the first `x-forwarded-for`, without source-visible edge attestation: [public API, lines 43–55](https://github.com/Mike-Demo/charm-project-place/blob/3befe00e911d5d1a080eea962fdd658739e3584e/src/lib/public-api.server.ts#L43-L55), [agent booking, lines 185–188](https://github.com/Mike-Demo/charm-project-place/blob/3befe00e911d5d1a080eea962fdd658739e3584e/src/lib/agent-booking.server.ts#L185-L188), and [sketch quota, lines 20–27](https://github.com/Mike-Demo/charm-project-place/blob/3befe00e911d5d1a080eea962fdd658739e3584e/src/routes/api/sketch-concept.ts#L20-L27).
  - **Exact missing fact from parent:** “The deployment's edge/header handling is unknown: whether all production traffic passes through Cloudflare (or another trusted proxy) that sets/overwrites cf-connecting-ip on every request and strips or appends-to client-supplied x-forwarded-for, and whether the origin accepts direct traffic that bypasses that edge - i.e. whether a client-supplied…”
  - Validation needed: document all production ingress paths, header overwrite/append behavior and precedence, and whether direct-origin access is blocked. Establish whether an untrusted caller can actually control the identity consumed by these three paths.
  - Close-out evidence: attach ingress configuration/platform guarantees and authorized controlled observations; record confirmed, rejected, or still blocked by missing facts, with rationale.

- [ ] **Unauthenticated webhook subscription lets anyone make the server POST signed booking events to an arbitrary URL**
  - Fingerprint: `unauthenticated-webhook-ssrf`.
  - Claimed root cause/evidence: [subscription creation, lines 8–41](https://github.com/Mike-Demo/charm-project-place/blob/3befe00e911d5d1a080eea962fdd658739e3584e/src/routes/api/public/webhooks.ts#L8-L41) accepts and persists caller-supplied URLs; [delivery, lines 113–129](https://github.com/Mike-Demo/charm-project-place/blob/3befe00e911d5d1a080eea962fdd658739e3584e/src/lib/public-api.server.ts#L113-L129) calls server-side `fetch` without source-visible scheme, IP, DNS-rebinding, or redirect filtering.
  - **Exact missing fact from parent:** “The deployed server runtime's network position and egress policy is unknown: whether fetch() from the deployed Nitro/Cloudflare target can connect to private, loopback, link-local (169.254.169.254) or LAN addresses, whether the platform applies any URL/IP filtering not present in the repo, and whether any internal/metadata service is actually reac…”
  - Validation needed: identify the deployed runtime and egress restrictions, platform URL/IP filtering (including redirects and DNS changes), and whether any internal/metadata target is actually reachable. Arbitrary URL acceptance alone does not establish internal-network access.
  - Close-out evidence: attach runtime/egress configuration and authorized controlled observations; record confirmed, rejected, or still blocked by missing facts, with rationale.
