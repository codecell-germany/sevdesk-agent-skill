# sevdesk-agent-skill (sevdesk-agent-cli)

Skill and CLI for safely operating the sevdesk API with coding agents.

## Features
- Operation catalog (`ops list`, `op-show`) derived from sevdesk OpenAPI data (checked into `src/data/operations.json`).
- Read-first workflow: `read <operationId>` runs only `GET`.
- Guarded writes: `write <operationId>` is blocked unless you explicitly confirm execution.
- Runtime quirks: `ops-quirks` + optional response normalization for known deviations.
- Agent handoff context: `context snapshot` emits a deterministic JSON snapshot to `stdout` (optional `--output` file).

## Quick Start (works for all agents)
Requirements:
- Node.js >= 20

Install + build:
```bash
npm install
npm run build
```

Set auth token:
```bash
export SEVDESK_API_TOKEN="..."
```

Run a first read call:
```bash
./dist/index.js read bookkeepingSystemVersion --output json
```

## Authentication
This CLI reads the API token from the environment:
- `SEVDESK_API_TOKEN` (required)

Optional:
- `SEVDESK_BASE_URL` (default: `https://my.sevdesk.de/api/v1`)
- `SEVDESK_USER_AGENT`
- `SEVDESK_ALLOW_WRITE=true` (only relevant if you want to run write calls)

Example:
```bash
export SEVDESK_API_TOKEN="..."
sevdesk-agent read bookkeepingSystemVersion --output json
```

## Usage
Run the CLI from this repo:
```bash
./dist/index.js --help
./dist/index.js ops list --read-only
```

Run the CLI via npx (no local checkout/build needed):
```bash
# run from any directory (recommended: not from inside this repo)
npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent --help
npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent ops list --read-only
```

Optional: install as a global CLI for your shell:
```bash
npm link
sevdesk-agent --help
```

### CLI Commands (overview)
- `ops list`: list operations from the OpenAPI-derived catalog (filters: `--read-only`, `--method`, `--tag`, `--json`)
- `ops-quirks`: list known runtime quirks and normalizations
- `op-show <operationId>`: show method/path/params (+ runtime quirk)
- `read <operationId>`: execute GET operation (supports `--path`, `--query`, `--header`, `--normalize`, `--output`, `--save`)
- `write <operationId>`: execute non-GET with guards (`--execute`, `--confirm-execute yes`, `--allow-write`/`SEVDESK_ALLOW_WRITE=true`)
- `docs usage`: short read-only usage guide
- `docs read-ops`: generate `knowledge/READ_OPERATIONS.md` from the catalog
- `context snapshot`: capture a deterministic read-only context snapshot

Full operation catalog (operationId -> HTTP method/path):
- `OPERATIONS.md`

List read-only operations:
```bash
sevdesk-agent ops list --read-only
```

Read an endpoint (GET only):
```bash
sevdesk-agent read getInvoices --output json
```

Generate a full read-only operation reference (Markdown):
```bash
sevdesk-agent docs read-ops --output knowledge/READ_OPERATIONS.md
```

Context snapshot (stdout by default):
```bash
sevdesk-agent context snapshot --include-default --max-objects 20 > snapshot.json
```

Optional: write the snapshot to a file:
```bash
sevdesk-agent context snapshot --include-default --output .context/sevdesk-context-snapshot.json
```

## Safety model for writes
Writes are blocked by default. To execute non-GET operations you must provide all guards:
- `--execute`
- `--confirm-execute yes`
- and either `SEVDESK_ALLOW_WRITE=true` or `--allow-write`

## Tests
Unit tests:
```bash
npm test
```

Live read-only tests (will only run if you opt in):
```bash
SEVDESK_LIVE_TESTS=1 SEVDESK_API_TOKEN="..." npm run test:live
```

## Agent Installation (Codex, Claude Code, Gemini CLI)
This repo contains a reusable agent "skill" prompt and workflow under:
- `skills/sevdesk-agent-cli/SKILL.md`

The key idea for all coding agents is the same:
1. Ensure the `sevdesk-agent` CLI is runnable (recommended: via npx).
2. Provide `SEVDESK_API_TOKEN` in the agent environment.
3. Require that all sevdesk interactions go through `sevdesk-agent` (read-first) and that non-GET calls need explicit human confirmation.

### Install Skill via npx (recommended)
This installs (copies) the skill into your Codex skills folder:
```bash
npx -y @codecell-germany/sevdesk-agent-skill install
```

If you run this from inside this repo folder and see `sevdesk-agent-skill: command not found`,
run the command from a different directory (e.g. `cd ~`) and try again.

Update/overwrite:
```bash
npx -y @codecell-germany/sevdesk-agent-skill install --force
```

### Provide the CLI to agents (recommended: npx)
If the agent can run shell commands, the simplest way is to run `sevdesk-agent` via `npx` without any local checkout:
```bash
npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent ops list --read-only
```

### Codex CLI
1. Build the repo:
```bash
npm install
npm run build
```
2. (Optional) Install global binary:
```bash
npm link
```
3. Ensure token is available:
```bash
export SEVDESK_API_TOKEN="..."
```
4. Use the skill instructions as the agent's operating rules:
- Point the agent at `skills/sevdesk-agent-cli/SKILL.md`.

### Codex App
1. Same build/token steps as above.
2. Install the skill via npx (copies into `~/.codex/skills/sevdesk-agent-cli`):
```bash
npx -y @codecell-germany/sevdesk-agent-skill install
```
3. In Codex App, select/use the `sevdesk-agent-cli` skill for tasks that touch sevdesk.

Update/overwrite:
```bash
npx -y @codecell-germany/sevdesk-agent-skill install --force
```

### Claude Code
Claude Code can use external CLIs. Recommended setup:
1. Provide the CLI:
   Option A (recommended, no checkout): use npx in commands.
   Option B: build the repo and expose the CLI (recommended if you need offline use):
```bash
npm install
npm run build
npm link
```
2. Set token in the shell environment that Claude Code inherits:
```bash
export SEVDESK_API_TOKEN="..."
```
3. Add the contents of `skills/sevdesk-agent-cli/SKILL.md` to Claude Code's project instructions (or a repo-level agent instructions file), and require:
- read-first (`sevdesk-agent read ...`)
- guarded writes only with explicit human confirmation
- context handoff via `sevdesk-agent context snapshot` (stdout)

### Gemini CLI
Gemini CLI can be used with tools/terminal access depending on your setup. Recommended setup:
1. Provide the CLI (recommended: `npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent ...`, or build + `npm link`).
2. Provide `SEVDESK_API_TOKEN` in the environment.
3. Paste/attach `skills/sevdesk-agent-cli/SKILL.md` as the system/project instruction for the session and require all sevdesk interactions to go through `sevdesk-agent`.

## Disclaimer
This project is not affiliated with sevdesk. "sevdesk" is a trademark of its respective owner.

## Credit
If you use or redistribute this project, please keep the `LICENSE` file (required by the MIT license).
Preferred attribution:
- "sevdesk-agent-skill (sevdesk-agent-cli) by Nikolas Gottschol"
