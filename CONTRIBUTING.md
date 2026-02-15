# Contributing

Thanks for contributing.

## Development setup
Requirements:
- Node.js >= 20

Install + build:
```bash
npm install
npm run build
```

Run tests:
```bash
npm test
```

Live tests (read-only, opt-in):
```bash
SEVDESK_LIVE_TESTS=1 SEVDESK_API_TOKEN="..." npm run test:live
```

## Guidelines
- Keep the CLI stdout-first and machine-readable (`--output json`).
- Do not add tests that write to real sevdesk accounts.
- For any potentially destructive action, keep the existing guard pattern (`--execute`, `--confirm-execute yes`, allow-write flag).
- Prefer small PRs with clear scope.

## Submitting changes
- Open a PR with a clear description and rationale.
- Include or update tests where applicable.
- Update documentation if user-facing behavior changes.

