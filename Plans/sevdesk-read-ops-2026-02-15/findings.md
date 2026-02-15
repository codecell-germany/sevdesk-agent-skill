# Findings

## 2026-02-15
- `getInvoices` date filtering: `startDate`/`endDate` work as Unix timestamps (seconds). Using `YYYY-MM-DD` can return empty results.
- Bracket query params like `contact[id]` should be shell-quoted: `--query 'contact[id]=123'`.
- Some endpoints return binary content-types (pdf/xml/zip/csv); the current client surfaces metadata (`binary`, `bytes`, `contentType`) instead of raw bytes.
- New CLI docs helper: `sevdesk-agent docs read-ops --output knowledge/READ_OPERATIONS.md`
- New CLI docs helper: `sevdesk-agent docs usage`
