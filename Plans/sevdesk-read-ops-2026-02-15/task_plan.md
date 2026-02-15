# Task Plan: Sevdesk Read Ops Usage Knowledge + CLI Help

## Goal
Document how to use all read-only (GET) operations exposed by `sevdesk-agent`, capture learned quirks, and surface that knowledge in:
- `skills/sevdesk-agent-cli/SKILL.md` (high-signal rules + links)
- a dedicated usage doc under `knowledge/`
- the CLI help (`sevdesk-agent --help`, `sevdesk-agent read --help`, and a new `sevdesk-agent docs ...` command)

## Non-goals
- Do not execute write operations.
- Do not exhaustively call every GET endpoint against the live API (many require IDs). Prefer static analysis + targeted probes.

## Plan
| Step | Status | Notes |
|---|---|---|
| 1. Inventory read-only operations and their params | completed | Generated from `src/data/operations.json` |
| 2. Collect known runtime quirks | completed | Included from `src/data/runtime-quirks.json` |
| 3. Generate `knowledge/READ_OPERATIONS.md` | completed | Generated via `sevdesk-agent docs read-ops` |
| 4. Update `skills/sevdesk-agent-cli/SKILL.md` | completed | Added doc generation hint + key date-filter note |
| 5. Add CLI `docs` command and improve `--help` text | completed | Added `sevdesk-agent docs read-ops` + `sevdesk-agent docs usage` |
| 6. Run typecheck/tests | completed | `npm run typecheck` + `npm test` |

## Decisions
- Prefer generating docs from `src/data/operations.json` to keep it deterministic and reviewable.
