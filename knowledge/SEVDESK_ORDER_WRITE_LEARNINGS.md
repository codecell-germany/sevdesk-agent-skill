# sevDesk Offer/Order Write Learnings

Date tested: 2026-02-19

This document captures live API behavior learned while creating an offer (`orderType=AN`) and exporting its PDF.

## 1. Contact lookup

- `getContacts` can be used without query params and returns all contacts in `data.objects`.
- Practical workflow:
1. Run `sevdesk-agent read getContacts --output json`
2. Filter locally by `name`, `familyname`, `surename`, or `name2`

## 2. `createOrder` payload that worked (live)

The following structure worked with:
`sevdesk-agent write createOrder --execute --confirm-execute yes --allow-write --body-file <file>`

```json
{
  "order": {
    "objectName": "Order",
    "mapAll": true,
    "contact": { "id": "CONTACT_ID", "objectName": "Contact" },
    "contactPerson": { "id": 339952, "objectName": "SevUser" },
    "orderNumber": "AN-EXAMPLE-001",
    "orderDate": "2026-02-19",
    "status": 100,
    "header": "Angebot: hello world schreiben",
    "orderType": "AN",
    "currency": "EUR",
    "taxRate": 19,
    "taxRule": { "id": "1", "objectName": "TaxRule" },
    "taxText": "Umsatzsteuer",
    "taxType": "default",
    "addressCountry": { "id": 1, "objectName": "StaticCountry" },
    "version": 0
  },
  "orderPosSave": [
    {
      "objectName": "OrderPos",
      "mapAll": "true",
      "quantity": 1,
      "price": 1,
      "name": "hello world schreiben",
      "text": "Beschreibung egal",
      "unity": { "id": 1, "objectName": "Unity" },
      "taxRate": 19
    }
  ]
}
```

Response was `201` with created order id in `data.objects.order.id`.

## 3. Common error patterns (misleading at first glance)

During invalid payload experiments, the API returned these messages:

- `order expected array with 'id' and 'objectName'. array given`
- `orderPosSave expected array with 'id' and 'objectName'. array given`
- `orderPosSave expected array with 'id' and 'objectName'. integer given`
- `Currency is required.`
- `The given document must have at least one position`

Important note:
- These errors can appear even when the field is present, if nested payload shape is not exactly what the endpoint parser expects.

## 4. PDF export behavior

`orderGetPdf` returns JSON-wrapped base64 content:

- `filename`
- `mimetype`
- `base64Encoded`
- `content` (base64)

The CLI does not auto-write binary output. Decode manually, e.g.:

```bash
jq -r '.normalizedData.content' /tmp/order-pdf.json | base64 --decode > output/order.pdf
```

## 5. Observed status side effect after PDF fetch

Observed in live test:
- Immediately after `createOrder`, response status was `100` (draft).
- After calling `orderGetPdf` without extra query params, `getOrderById` showed status `200`.

Recommendation:
- Use `orderGetPdf` with `preventSendBy` when you want to avoid changing send/status semantics:
`sevdesk-agent read orderGetPdf --path orderId=<id> --query preventSendBy=1 --output json`

## 6. Session notes (2026-02-20): New company + person contact, then offer

### Contact creation sequence that worked
1. Create company contact (`createContact`) with explicit `customerNumber`.
2. Create company address (`createContactAddress`) with:
   - `country: { id: 1, objectName: "StaticCountry" }`
   - `category: { id: 43, objectName: "Category" }`
3. Create person contact (`createContact`) with `parent` pointing to the company.

### Important caveat
- In this live run, the person contact initially got the same `customerNumber` as the company, even though a different number was provided in the create payload.
- Safe pattern: immediately verify via `getContactById` and correct with `updateContact` if needed.

### Offer recipient behavior
- To make the person the real recipient, set:
  - `order.contact.id` to the person contact id.
- Also set `order.address` explicitly with both company and person lines to stabilize PDF addressing:
  - Company
  - Contact person
  - Street / ZIP / City / Country

### CLI invocation fallback
- If shell wrapper `sevdesk-agent` is not executable (`permission denied`), run the same commands via:
  - `node dist/index.js <command> ...`

## 7. Standard process (must-use) for "new contact + new offer"

Use this exact order to avoid follow-up fixes:

1. Discovery (read-only)
- `ops list --read-only`
- `op-show createContact`
- `op-show createOrder`
- `ops-quirks`

2. Check existing data
- Search contacts by name/person.
- Read next customer number.
- Check order number availability (or derive next AN number from history).

3. Create recipient structure
- Create company contact.
- Create company address.
- Create person contact with `parent` = company.
- Verify person `customerNumber`; fix via `updateContact` if duplicated.

4. Create offer
- `order.contact.id` must be the intended recipient contact (person if requested).
- Set `order.address` explicitly (`company + person + street + zip + city + country`).
- Use complete `order` required fields and valid `orderPosSave[]`.

5. Verify and finalize
- Read order + positions and confirm recipient id.
- Render PDF; prefer `preventSendBy=1` if draft/send status must stay unchanged.
- Write context snapshot for handoff.

## 8. CLI improvements shipped (2026-02-20)

The following workflow hardening is now built into the CLI:

1. Safe PDF mode by default
- `read orderGetPdf` / `read invoiceGetPdf` now auto-apply `preventSendBy=1` unless already set.
- disable only when needed: `--no-safe-pdf`.

2. Local preflight for risky writes
- `write createContact` and `write createOrder` run local payload checks before API execution.
- typical missing fields now fail early with concrete messages.

3. Post-write verify mode
- `write ... --verify` runs read-only verification checks and returns a compact summary.
- `createContact`: checks `customerNumber`, `parent`, and address count.
- `createOrder`: checks recipient contact id, positions, status, and `sumNet` (when derivable).

4. Local contact finder
- `find-contact <term>` performs reproducible local matching from full contact list.
- scoring uses `name`, `name2`, `surename`, `familyname`, `customerNumber`.

5. One-command PDF output
- `read orderGetPdf|invoiceGetPdf --decode-pdf output/file.pdf` writes a usable PDF directly.

6. Startup fallback
- If the wrapper is not executable, CLI error output suggests:
  - `node dist/index.js <command> ...`
