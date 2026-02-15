---
name: sevdesk-agent-cli
description: Use the local sevdesk-agent TypeScript CLI to query sevdesk safely (read-first), run guarded write operations when explicitly confirmed, and generate a reusable context snapshot for agent handoffs.
---

# sevdesk-agent-cli

## When to use
Use this skill when tasks involve sevdesk API access from this workspace, especially when an agent must:
- inspect business/accounting state via read-only endpoints,
- execute write endpoints with explicit guard confirmations,
- produce a context snapshot for later agent runs.

## Preconditions
- CLI has been built: `npm run build`
- API token is available in env:
  - `SEVDESK_API_TOKEN=<token>`
- Optional env:
  - `SEVDESK_BASE_URL` (default `https://my.sevdesk.de/api/v1`)
  - `SEVDESK_USER_AGENT`
  - `SEVDESK_ALLOW_WRITE=true` (required for write execution)

## Core workflow
1. Discover operation ids:
   - `sevdesk-agent ops list --read-only`
   - `sevdesk-agent op-show <operationId>`
   - `sevdesk-agent ops-quirks`
2. Run read calls first:
   - `sevdesk-agent read <operationId> --query key=value`
   - by default, read responses are normalized for known live API quirks
3. For write calls, only with explicit confirmation:
   - `sevdesk-agent write <operationId> --execute --confirm-execute yes --allow-write ...`
4. Persist agent handoff context:
   - stdout (default): `sevdesk-agent context snapshot`
   - optional file export: `sevdesk-agent context snapshot --output .context/sevdesk-context-snapshot.json`

## Guardrails
- Default behavior is safe: non-GET calls are blocked unless all write guards are set.
- In production workflows, prefer read-only tests and read-only probes first.
- For binary outputs (pdf/xml/zip), preserve metadata and avoid accidental destructive follow-ups.
- Runtime-required query quirks are enforced for selected operations (e.g. `contactCustomerNumberAvailabilityCheck` requires `customerNumber` at runtime).
- Use `op-show` or `ops-quirks` to see operation-specific runtime quirks.

## References
- Command cheat sheet: `references/command-cheatsheet.md`
