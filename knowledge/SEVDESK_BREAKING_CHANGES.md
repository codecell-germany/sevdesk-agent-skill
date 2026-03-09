# sevdesk-agent-cli Breaking Changes / Behavior Notes

This file tracks user-visible CLI behavior changes that can affect agent runbooks.

## 2026-03-05 (planned release: `0.1.3`)

### Added / Changed
- `read find-contact` now works as alias for top-level `find-contact`.
  - Before: `find-contact` only as top-level command.
  - Now: both variants supported.
- `read` aliases expanded for helper workflows:
  - `read resolve-billing-contact --query term=...`
  - `read find-invoice --query term=... [--query deepScan=true]`
- New helper commands:
  - `resolve-billing-contact`
  - `find-invoice` (alias: `search-invoices`)
  - `create-invoice-installment` (alias: `createInvoiceInstallment`)
  - `invoice clone`
  - `doctor` (alias: `self-check`)
- `createInvoiceByFactory` preflight now validates date consistency:
  - checks `invoiceDate`, `deliveryDate`, `deliveryDateUntil`
  - optional auto-fix via `--auto-fix-delivery-date`
- `createInvoiceByFactory` preflight now also validates core payload completeness:
  - `invoice.contact.id`, `invoice.invoiceType`, `invoice.status`
  - position fields (`quantity`, `price`, `taxRate`) per line.
- Write error output may include `remediationHints` for known 4xx patterns.

### Compatibility
- No existing command removed.
- Existing top-level `find-contact` remains unchanged.
- New behavior is additive except for stronger preflight validation when enabled (default on).
