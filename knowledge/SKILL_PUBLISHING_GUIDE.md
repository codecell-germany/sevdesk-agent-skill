# Skill Publishing Guide (GitHub + npm/npx)

This is a practical checklist for a coding agent to prepare a Codex-style skill repository and publish it so users can install it via `npx`.
Additionally, the skills.sh ecosystem supports installing skills directly from GitHub repos via the `skills` CLI (`npx skills add owner/repo`).

## Target Architecture

1. A skill payload that can be copied into a Codex skills folder:
   - `skills/<skill-name>/SKILL.md`
   - optional: `skills/<skill-name>/references/**`, `skills/<skill-name>/agents/**`
2. A CLI that agents can run:
   - published binary via npm package `bin` (works with `npx -p <pkg> <bin> ...`)
3. An installer CLI that copies the skill payload into `~/.codex/skills/<skill-name>`:
   - published binary via npm package `bin` (works with `npx <pkg> install`)

## Repo Layout (Recommended)

1. `skills/<skill-name>/SKILL.md`
1. `src/` for TypeScript sources
1. `dist/` generated build output (gitignored)
1. `knowledge/` for user-facing docs that should ship with the npm package
1. `.gitignore` includes local-only folders:
   - `Plans/` (planning files must stay local)
   - `dist/`

## CLI Design Rules

1. Keep read-only operations safe by default.
1. Gate any destructive operations behind explicit human-confirmed flags.
1. Prefer machine-readable output and stable schemas.
1. If an endpoint response is "weird in the wild", codify it as a documented quirk with tests.

## npm Package Setup (npx-ready)

In `package.json`:

1. Set a publishable name and scope, e.g. `@your-scope/your-skill`.
1. Ensure the package is not private:
   - `"private": false`
1. Expose binaries:
   - `"bin": { "<cli-bin>": "dist/index.js", "<installer-bin>": "dist/installer.js" }`
1. Ship only what users need:
   - use `"files": [...]` to whitelist `dist/**`, `skills/**`, and `knowledge/**`
1. For scoped public packages, ensure:
   - `"publishConfig": { "access": "public" }`
1. Use `prepack` to build and (optionally) generate docs so the tarball is always consistent:
   - example: `"prepack": "npm run build && node dist/index.js docs ..."`

## Installer CLI (Skill Copy)

Minimum behavior:

1. Determine Codex home:
   - `CODEX_HOME` if set, otherwise `~/.codex`
1. Install path:
   - `${CODEX_HOME}/skills/<skill-name>/`
1. Implement:
   - `install` (copy payload, support `--force`)
   - `uninstall`
   - `doctor` (print what will be used and what is installed)

Important edge case:

1. `npx <pkg> install` can fail with `command not found` when executed from inside a repo that has its own `node_modules`.
1. Document this and recommend running `npx` from a different directory (e.g. `cd ~`).

## Local Verification (Before Publishing)

Run all of these from a clean state:

1. Tests:
   - `npm test`
1. Build:
   - `npm run build`
1. Pack and smoke-test like a user:
   - `npm pack`
   - `TMP=$(mktemp -d) && cd "$TMP" && npx -y ./<tarball>.tgz install --codex-home "$TMP/codex"`
   - verify files exist: `$TMP/codex/skills/<skill-name>/SKILL.md`
1. Verify `npx -p` execution:
   - `TMP=$(mktemp -d) && cd "$TMP" && npx -y -p <pkg> <cli-bin> --help`

## GitHub Publishing Checklist

1. Ensure README has:
   - quick start
   - npx installation examples
   - command overview (short list)
   - agent installation instructions
1. Ensure docs are consistent and regenerated if generated:
   - run the doc generator (or `prepack`) locally and commit generated docs if you intend to keep them in git
1. Commit changes and push.

## skills.sh Publishing / Discovery Checklist

skills.sh does not require a separate publish step. A repo becomes discoverable on skills.sh through anonymous install telemetry from the `skills` CLI.

1. Ensure the repo contains `skills/<skill-name>/SKILL.md` files (with YAML frontmatter).
1. Add README instructions that use:
   - `npx skills add <owner>/<repo> -g --skill <skill-name> -a '*' -y`
   - or `npx skills add <owner>/<repo> -g --all`
1. Validate the install path manually:
   - `npx skills add <owner>/<repo> -l`
   - then install to at least one agent to confirm it appears in that agent's skill registry.
1. Optional: document telemetry opt-out:
   - `DISABLE_TELEMETRY=1 npx skills add ...`

## npm Publish Checklist

1. `npm login`
1. Ensure 2FA is enabled for publishing (npm may require it).
1. Bump version (`patch` recommended for doc fixes).
1. `npm publish`
1. Verify:
   - `npm view <pkg> version`
   - `TMP=$(mktemp -d) && cd "$TMP" && npx -y <pkg> --help`
   - `TMP=$(mktemp -d) && cd "$TMP" && npx -y <pkg> install --codex-home "$TMP/codex"`

## Post-Publish "Reality Checks"

1. Confirm that the published package actually contains the updated skill payload:
   - install into a temp `CODEX_HOME` and inspect the installed `SKILL.md`
1. Confirm the README instructions still work verbatim.
1. If you ship generated docs (`knowledge/**`), verify that `prepack` keeps them up to date.
