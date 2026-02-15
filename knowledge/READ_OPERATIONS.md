# Sevdesk Read Operations (GET)

This file is generated from the OpenAPI-derived operation catalog shipped with this CLI (`src/data/operations.json` in the repo, `dist/data/operations.json` in the published package).
Generator: `sevdesk-agent docs read-ops --output knowledge/READ_OPERATIONS.md`.

## Global Usage Rules
- Discover operations: `sevdesk-agent ops list --read-only`
- Inspect params and quirks: `sevdesk-agent op-show <operationId>`
- Provide params via repeated flags: `--path key=value` and `--query key=value`
- Quote bracket params in shells: `--query 'contact[id]=123'`
- If the server returns a non-JSON binary content-type (pdf/xml/zip/csv), the CLI prints metadata, not the raw bytes (see per-op notes).

## Runtime Quirks (Known)

| OperationId | Quirk |
|---|---|
| `contactCustomerNumberAvailabilityCheck` | runtimeRequiredQuery=customerNumber - Without customerNumber, endpoint can return HTTP 500 although spec marks it optional. |
| `forAccountNumber` | coerceObjectsArray - objects can be object instead of expected array. |
| `getContactTabsItemCountById` | unwrapObjects - Actual payload is wrapped in data.objects while spec shows direct fields. |
| `getLetterpapersWithThumb` | unwrapObjects - Response is wrapped in data.objects instead of result/letterpapers top-level fields. |
| `getTemplates` | unwrapObjects - Response is wrapped in data.objects instead of result/templates top-level fields. |
| `invoiceGetPdf` | unwrapObjects - Response is wrapped in data.objects instead of top-level document fields. |
| `orderGetPdf` | unwrapObjects - Response is wrapped in data.objects instead of top-level document fields. |
| `partGetStock` | coerceObjectsNumber - objects is returned as numeric string instead of integer. |

## Operations By Tag

### AccountingContact

| OperationId | Path |
|---|---|
| `getAccountingContact` | `/AccountingContact` |
| `getAccountingContactById` | `/AccountingContact/{accountingContactId}` |

### Basics

| OperationId | Path |
|---|---|
| `bookkeepingSystemVersion` | `/Tools/bookkeepingSystemVersion` |

### CheckAccount

| OperationId | Path |
|---|---|
| `getBalanceAtDate` | `/CheckAccount/{checkAccountId}/getBalanceAtDate` |
| `getCheckAccountById` | `/CheckAccount/{checkAccountId}` |
| `getCheckAccounts` | `/CheckAccount` |

### CheckAccountTransaction

| OperationId | Path |
|---|---|
| `getCheckAccountTransactionById` | `/CheckAccountTransaction/{checkAccountTransactionId}` |
| `getTransactions` | `/CheckAccountTransaction` |

### CommunicationWay

| OperationId | Path |
|---|---|
| `getCommunicationWayById` | `/CommunicationWay/{communicationWayId}` |
| `getCommunicationWayKeys` | `/CommunicationWayKey` |
| `getCommunicationWays` | `/CommunicationWay` |

### Contact

| OperationId | Path |
|---|---|
| `contactCustomerNumberAvailabilityCheck` | `/Contact/Mapper/checkCustomerNumberAvailability` |
| `findContactsByCustomFieldValue` | `/Contact/Factory/findContactsByCustomFieldValue` |
| `getContactById` | `/Contact/{contactId}` |
| `getContacts` | `/Contact` |
| `getContactTabsItemCountById` | `/Contact/{contactId}/getTabsItemCount` |
| `getNextCustomerNumber` | `/Contact/Factory/getNextCustomerNumber` |

### ContactAddress

| OperationId | Path |
|---|---|
| `contactAddressId` | `/ContactAddress/{contactAddressId}` |
| `getContactAddresses` | `/ContactAddress` |

### ContactField

| OperationId | Path |
|---|---|
| `getContactFields` | `/ContactCustomField` |
| `getContactFieldsById` | `/ContactCustomField/{contactCustomFieldId}` |
| `getContactFieldSettingById` | `/ContactCustomFieldSetting/{contactCustomFieldSettingId}` |
| `getContactFieldSettings` | `/ContactCustomFieldSetting` |
| `getPlaceholder` | `/Textparser/fetchDictionaryEntriesByType` |
| `getReferenceCount` | `/ContactCustomFieldSetting/{contactCustomFieldSettingId}/getReferenceCount` |

### CreditNote

| OperationId | Path |
|---|---|
| `creditNoteGetPdf` | `/CreditNote/{creditNoteId}/getPdf` |
| `getcreditNoteById` | `/CreditNote/{creditNoteId}` |
| `getCreditNotes` | `/CreditNote` |
| `sendCreditNoteByPrinting` | `/CreditNote/{creditNoteId}/sendByWithRender` |

### CreditNotePos

| OperationId | Path |
|---|---|
| `getcreditNotePositions` | `/CreditNotePos` |

### Export

| OperationId | Path |
|---|---|
| `exportContact` | `/Export/contactListCsv` |
| `exportCreditNote` | `/Export/creditNoteCsv` |
| `exportDatevCSV` | `/Export/createDatevCsvZipExportJob` |
| `exportDatevDepricated` | `/Export/datevCSV` |
| `exportDatevXML` | `/Export/createDatevXmlZipExportJob` |
| `exportInvoice` | `/Export/invoiceCsv` |
| `exportInvoiceZip` | `/Export/invoiceZip` |
| `exportTransactions` | `/Export/transactionsCsv` |
| `exportVoucher` | `/Export/voucherListCsv` |
| `exportVoucherZip` | `/Export/voucherZip` |
| `generateDownloadHash` | `/Progress/generateDownloadHash` |
| `getProgress` | `/Progress/getProgress` |
| `jobDownloadInfo` | `/ExportJob/jobDownloadInfo` |

### Invoice

| OperationId | Path |
|---|---|
| `getInvoiceById` | `/Invoice/{invoiceId}` |
| `getInvoicePositionsById` | `/Invoice/{invoiceId}/getPositions` |
| `getInvoices` | `/Invoice` |
| `getIsInvoicePartiallyPaid` | `/Invoice/{invoiceId}/getIsPartiallyPaid` |
| `invoiceGetPdf` | `/Invoice/{invoiceId}/getPdf` |
| `invoiceGetXml` | `/Invoice/{invoiceId}/getXml` |

### InvoicePos

| OperationId | Path |
|---|---|
| `getInvoicePos` | `/InvoicePos` |

### Layout

| OperationId | Path |
|---|---|
| `getLetterpapersWithThumb` | `/DocServer/getLetterpapersWithThumb` |
| `getTemplates` | `/DocServer/getTemplatesWithThumb` |

### Order

| OperationId | Path |
|---|---|
| `getDiscounts` | `/Order/{orderId}/getDiscounts` |
| `getOrderById` | `/Order/{orderId}` |
| `getOrderPositionsById` | `/Order/{orderId}/getPositions` |
| `getOrders` | `/Order` |
| `getRelatedObjects` | `/Order/{orderId}/getRelatedObjects` |
| `orderGetPdf` | `/Order/{orderId}/getPdf` |

### OrderPos

| OperationId | Path |
|---|---|
| `getOrderPositionById` | `/OrderPos/{orderPosId}` |
| `getOrderPositions` | `/OrderPos` |

### Part

| OperationId | Path |
|---|---|
| `getPartById` | `/Part/{partId}` |
| `getParts` | `/Part` |
| `partGetStock` | `/Part/{partId}/getStock` |

### PrivateTransactionRule

| OperationId | Path |
|---|---|
| `listPrivateTransactionRules` | `/PrivateTransactionRule` |

### Report

| OperationId | Path |
|---|---|
| `reportContact` | `/Report/contactlist` |
| `reportInvoice` | `/Report/invoicelist` |
| `reportOrder` | `/Report/orderlist` |
| `reportVoucher` | `/Report/voucherlist` |

### Tag

| OperationId | Path |
|---|---|
| `getTagById` | `/Tag/{tagId}` |
| `getTagRelations` | `/TagRelation` |
| `getTags` | `/Tag` |

### Voucher

| OperationId | Path |
|---|---|
| `forAccountNumber` | `/ReceiptGuidance/forAccountNumber` |
| `forAllAccounts` | `/ReceiptGuidance/forAllAccounts` |
| `forExpense` | `/ReceiptGuidance/forExpense` |
| `forRevenue` | `/ReceiptGuidance/forRevenue` |
| `forTaxRule` | `/ReceiptGuidance/forTaxRule` |
| `getVoucherById` | `/Voucher/{voucherId}` |
| `getVouchers` | `/Voucher` |

### VoucherPos

| OperationId | Path |
|---|---|
| `getVoucherPositions` | `/VoucherPos` |

## Operation Details

### bookkeepingSystemVersion

- Method: `GET`
- Path: `/Tools/bookkeepingSystemVersion`
- Tags: `Basics`

Params:

_(no params)_

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read bookkeepingSystemVersion --output json
```

### contactAddressId

- Method: `GET`
- Path: `/ContactAddress/{contactAddressId}`
- Tags: `ContactAddress`

Params:

| Name | In | Required |
|---|---|---|
| `contactAddressId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read contactAddressId --path contactAddressId=<contactAddressId> --output json
```

### contactCustomerNumberAvailabilityCheck

- Method: `GET`
- Path: `/Contact/Mapper/checkCustomerNumberAvailability`
- Tags: `Contact`

Params:

| Name | In | Required |
|---|---|---|
| `customerNumber` | `query` | no |

Runtime quirk:

- runtimeRequiredQuery: `customerNumber`
- notes: Without customerNumber, endpoint can return HTTP 500 although spec marks it optional.

Example:

```bash
sevdesk-agent read contactCustomerNumberAvailabilityCheck --output json
```
Optional query params: `customerNumber`.

### creditNoteGetPdf

- Method: `GET`
- Path: `/CreditNote/{creditNoteId}/getPdf`
- Tags: `CreditNote`

Params:

| Name | In | Required |
|---|---|---|
| `creditNoteId` | `path` | yes |
| `download` | `query` | no |
| `preventSendBy` | `query` | no |

Runtime quirk:

_(none)_

Notes:

- `*GetPdf` responses are typically JSON wrapped in `data.objects` (often containing `filename`, `mimetype`, and base64 `content`). The CLI does not automatically write files to disk.
- If an endpoint returns a non-JSON binary content-type (pdf/xml/zip/csv), the CLI prints metadata (`binary`, `bytes`, `contentType`) instead of raw bytes.

Example:

```bash
sevdesk-agent read creditNoteGetPdf --path creditNoteId=<creditNoteId> --output json
```
Optional query params: `download`, `preventSendBy`.

### exportContact

- Method: `GET`
- Path: `/Export/contactListCsv`
- Tags: `Export`

Params:

| Name | In | Required |
|---|---|---|
| `sevQuery` | `query` | yes |
| `download` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read exportContact --query sevQuery=<value> --output json
```
Optional query params: `download`.

### exportCreditNote

- Method: `GET`
- Path: `/Export/creditNoteCsv`
- Tags: `Export`

Params:

| Name | In | Required |
|---|---|---|
| `sevQuery` | `query` | yes |
| `download` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read exportCreditNote --query sevQuery=<value> --output json
```
Optional query params: `download`.

### exportDatevCSV

- Method: `GET`
- Path: `/Export/createDatevCsvZipExportJob`
- Tags: `Export`

Params:

| Name | In | Required |
|---|---|---|
| `endDate` | `query` | yes |
| `scope` | `query` | yes |
| `startDate` | `query` | yes |
| `enshrineDocuments` | `query` | no |
| `exportByPaydate` | `query` | no |
| `includeDocumentImages` | `query` | no |
| `includeEnshrined` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read exportDatevCSV --query startDate=<value> --query endDate=<value> --query scope=<value> --output json
```
Optional query params: `enshrineDocuments`, `exportByPaydate`, `includeDocumentImages`, `includeEnshrined`.

### exportDatevDepricated

- Method: `GET`
- Path: `/Export/datevCSV`
- Tags: `Export`

Params:

| Name | In | Required |
|---|---|---|
| `endDate` | `query` | yes |
| `scope` | `query` | yes |
| `startDate` | `query` | yes |
| `Download` | `query` | no |
| `enshrine` | `query` | no |
| `withEnshrinedDocuments` | `query` | no |
| `withUnpaidDocuments` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read exportDatevDepricated --query startDate=<value> --query endDate=<value> --query scope=<value> --output json
```
Optional query params: `Download`, `enshrine`, `withEnshrinedDocuments`, `withUnpaidDocuments`.

### exportDatevXML

- Method: `GET`
- Path: `/Export/createDatevXmlZipExportJob`
- Tags: `Export`

Params:

| Name | In | Required |
|---|---|---|
| `endDate` | `query` | yes |
| `scope` | `query` | yes |
| `startDate` | `query` | yes |
| `exportByPaydate` | `query` | no |
| `includeDocumentXml` | `query` | no |
| `includeEnshrined` | `query` | no |
| `includeExportedDocuments` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read exportDatevXML --query startDate=<value> --query endDate=<value> --query scope=<value> --output json
```
Optional query params: `exportByPaydate`, `includeDocumentXml`, `includeEnshrined`, `includeExportedDocuments`.

### exportInvoice

- Method: `GET`
- Path: `/Export/invoiceCsv`
- Tags: `Export`

Params:

| Name | In | Required |
|---|---|---|
| `sevQuery` | `query` | yes |
| `download` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read exportInvoice --query sevQuery=<value> --output json
```
Optional query params: `download`.

### exportInvoiceZip

- Method: `GET`
- Path: `/Export/invoiceZip`
- Tags: `Export`

Params:

| Name | In | Required |
|---|---|---|
| `sevQuery` | `query` | yes |
| `download` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read exportInvoiceZip --query sevQuery=<value> --output json
```
Optional query params: `download`.

### exportTransactions

- Method: `GET`
- Path: `/Export/transactionsCsv`
- Tags: `Export`

Params:

| Name | In | Required |
|---|---|---|
| `sevQuery` | `query` | yes |
| `download` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read exportTransactions --query sevQuery=<value> --output json
```
Optional query params: `download`.

### exportVoucher

- Method: `GET`
- Path: `/Export/voucherListCsv`
- Tags: `Export`

Params:

| Name | In | Required |
|---|---|---|
| `sevQuery` | `query` | yes |
| `download` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read exportVoucher --query sevQuery=<value> --output json
```
Optional query params: `download`.

### exportVoucherZip

- Method: `GET`
- Path: `/Export/voucherZip`
- Tags: `Export`

Params:

| Name | In | Required |
|---|---|---|
| `sevQuery` | `query` | yes |
| `download` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read exportVoucherZip --query sevQuery=<value> --output json
```
Optional query params: `download`.

### findContactsByCustomFieldValue

- Method: `GET`
- Path: `/Contact/Factory/findContactsByCustomFieldValue`
- Tags: `Contact`

Params:

| Name | In | Required |
|---|---|---|
| `customFieldName` | `query` | yes |
| `value` | `query` | yes |
| `customFieldSetting[id]` | `query` | no |
| `customFieldSetting[objectName]` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read findContactsByCustomFieldValue --query value=<value> --query customFieldName=<value> --output json
```
Optional query params: `customFieldSetting[id]`, `customFieldSetting[objectName]`.

### forAccountNumber

- Method: `GET`
- Path: `/ReceiptGuidance/forAccountNumber`
- Tags: `Voucher`

Params:

| Name | In | Required |
|---|---|---|
| `accountNumber` | `query` | yes |

Runtime quirk:

- coerceObjectsArray: true
- notes: objects can be object instead of expected array.

Example:

```bash
sevdesk-agent read forAccountNumber --query accountNumber=<value> --output json
```

### forAllAccounts

- Method: `GET`
- Path: `/ReceiptGuidance/forAllAccounts`
- Tags: `Voucher`

Params:

_(no params)_

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read forAllAccounts --output json
```

### forExpense

- Method: `GET`
- Path: `/ReceiptGuidance/forExpense`
- Tags: `Voucher`

Params:

_(no params)_

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read forExpense --output json
```

### forRevenue

- Method: `GET`
- Path: `/ReceiptGuidance/forRevenue`
- Tags: `Voucher`

Params:

_(no params)_

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read forRevenue --output json
```

### forTaxRule

- Method: `GET`
- Path: `/ReceiptGuidance/forTaxRule`
- Tags: `Voucher`

Params:

| Name | In | Required |
|---|---|---|
| `taxRule` | `query` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read forTaxRule --query taxRule=<value> --output json
```

### generateDownloadHash

- Method: `GET`
- Path: `/Progress/generateDownloadHash`
- Tags: `Export`

Params:

| Name | In | Required |
|---|---|---|
| `jobId` | `query` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read generateDownloadHash --query jobId=<value> --output json
```

### getAccountingContact

- Method: `GET`
- Path: `/AccountingContact`
- Tags: `AccountingContact`

Params:

| Name | In | Required |
|---|---|---|
| `contact[id]` | `query` | no |
| `contact[objectName]` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getAccountingContact --output json
```
Optional query params: `contact[id]`, `contact[objectName]`.

### getAccountingContactById

- Method: `GET`
- Path: `/AccountingContact/{accountingContactId}`
- Tags: `AccountingContact`

Params:

| Name | In | Required |
|---|---|---|
| `accountingContactId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getAccountingContactById --path accountingContactId=<accountingContactId> --output json
```

### getBalanceAtDate

- Method: `GET`
- Path: `/CheckAccount/{checkAccountId}/getBalanceAtDate`
- Tags: `CheckAccount`

Params:

| Name | In | Required |
|---|---|---|
| `checkAccountId` | `path` | yes |
| `date` | `query` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getBalanceAtDate --path checkAccountId=<checkAccountId> --query date=<value> --output json
```

### getCheckAccountById

- Method: `GET`
- Path: `/CheckAccount/{checkAccountId}`
- Tags: `CheckAccount`

Params:

| Name | In | Required |
|---|---|---|
| `checkAccountId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getCheckAccountById --path checkAccountId=<checkAccountId> --output json
```

### getCheckAccounts

- Method: `GET`
- Path: `/CheckAccount`
- Tags: `CheckAccount`

Params:

_(no params)_

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getCheckAccounts --output json
```

### getCheckAccountTransactionById

- Method: `GET`
- Path: `/CheckAccountTransaction/{checkAccountTransactionId}`
- Tags: `CheckAccountTransaction`

Params:

| Name | In | Required |
|---|---|---|
| `checkAccountTransactionId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getCheckAccountTransactionById --path checkAccountTransactionId=<checkAccountTransactionId> --output json
```

### getCommunicationWayById

- Method: `GET`
- Path: `/CommunicationWay/{communicationWayId}`
- Tags: `CommunicationWay`

Params:

| Name | In | Required |
|---|---|---|
| `communicationWayId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getCommunicationWayById --path communicationWayId=<communicationWayId> --output json
```

### getCommunicationWayKeys

- Method: `GET`
- Path: `/CommunicationWayKey`
- Tags: `CommunicationWay`

Params:

_(no params)_

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getCommunicationWayKeys --output json
```

### getCommunicationWays

- Method: `GET`
- Path: `/CommunicationWay`
- Tags: `CommunicationWay`

Params:

| Name | In | Required |
|---|---|---|
| `contact[id]` | `query` | no |
| `contact[objectName]` | `query` | no |
| `main` | `query` | no |
| `type` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getCommunicationWays --output json
```
Optional query params: `contact[id]`, `contact[objectName]`, `main`, `type`.

### getContactAddresses

- Method: `GET`
- Path: `/ContactAddress`
- Tags: `ContactAddress`

Params:

_(no params)_

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getContactAddresses --output json
```

### getContactById

- Method: `GET`
- Path: `/Contact/{contactId}`
- Tags: `Contact`

Params:

| Name | In | Required |
|---|---|---|
| `contactId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getContactById --path contactId=<contactId> --output json
```

### getContactFields

- Method: `GET`
- Path: `/ContactCustomField`
- Tags: `ContactField`

Params:

_(no params)_

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getContactFields --output json
```

### getContactFieldsById

- Method: `GET`
- Path: `/ContactCustomField/{contactCustomFieldId}`
- Tags: `ContactField`

Params:

| Name | In | Required |
|---|---|---|
| `contactCustomFieldId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getContactFieldsById --path contactCustomFieldId=<contactCustomFieldId> --output json
```

### getContactFieldSettingById

- Method: `GET`
- Path: `/ContactCustomFieldSetting/{contactCustomFieldSettingId}`
- Tags: `ContactField`

Params:

| Name | In | Required |
|---|---|---|
| `contactCustomFieldSettingId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getContactFieldSettingById --path contactCustomFieldSettingId=<contactCustomFieldSettingId> --output json
```

### getContactFieldSettings

- Method: `GET`
- Path: `/ContactCustomFieldSetting`
- Tags: `ContactField`

Params:

_(no params)_

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getContactFieldSettings --output json
```

### getContacts

- Method: `GET`
- Path: `/Contact`
- Tags: `Contact`

Params:

| Name | In | Required |
|---|---|---|
| `customerNumber` | `query` | no |
| `depth` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getContacts --output json
```
Optional query params: `customerNumber`, `depth`.

### getContactTabsItemCountById

- Method: `GET`
- Path: `/Contact/{contactId}/getTabsItemCount`
- Tags: `Contact`

Params:

| Name | In | Required |
|---|---|---|
| `contactId` | `path` | yes |

Runtime quirk:

- unwrapObjects: true
- notes: Actual payload is wrapped in data.objects while spec shows direct fields.

Example:

```bash
sevdesk-agent read getContactTabsItemCountById --path contactId=<contactId> --output json
```

### getcreditNoteById

- Method: `GET`
- Path: `/CreditNote/{creditNoteId}`
- Tags: `CreditNote`

Params:

| Name | In | Required |
|---|---|---|
| `creditNoteId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getcreditNoteById --path creditNoteId=<creditNoteId> --output json
```

### getcreditNotePositions

- Method: `GET`
- Path: `/CreditNotePos`
- Tags: `CreditNotePos`

Params:

| Name | In | Required |
|---|---|---|
| `creditNote[id]` | `query` | no |
| `creditNote[objectName]` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getcreditNotePositions --output json
```
Optional query params: `creditNote[id]`, `creditNote[objectName]`.

### getCreditNotes

- Method: `GET`
- Path: `/CreditNote`
- Tags: `CreditNote`

Params:

| Name | In | Required |
|---|---|---|
| `contact[id]` | `query` | no |
| `contact[objectName]` | `query` | no |
| `creditNoteNumber` | `query` | no |
| `endDate` | `query` | no |
| `startDate` | `query` | no |
| `status` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getCreditNotes --output json
```
Optional query params: `contact[id]`, `contact[objectName]`, `creditNoteNumber`, `endDate`, `startDate`, `status`.

### getDiscounts

- Method: `GET`
- Path: `/Order/{orderId}/getDiscounts`
- Tags: `Order`

Params:

| Name | In | Required |
|---|---|---|
| `orderId` | `path` | yes |
| `embed` | `query` | no |
| `limit` | `query` | no |
| `offset` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getDiscounts --path orderId=<orderId> --output json
```
Optional query params: `embed`, `limit`, `offset`.

### getInvoiceById

- Method: `GET`
- Path: `/Invoice/{invoiceId}`
- Tags: `Invoice`

Params:

| Name | In | Required |
|---|---|---|
| `invoiceId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getInvoiceById --path invoiceId=<invoiceId> --output json
```

### getInvoicePos

- Method: `GET`
- Path: `/InvoicePos`
- Tags: `InvoicePos`

Params:

| Name | In | Required |
|---|---|---|
| `id` | `query` | no |
| `invoice[id]` | `query` | no |
| `invoice[objectName]` | `query` | no |
| `part[id]` | `query` | no |
| `part[objectName]` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getInvoicePos --output json
```
Optional query params: `id`, `invoice[id]`, `invoice[objectName]`, `part[id]`, `part[objectName]`.

### getInvoicePositionsById

- Method: `GET`
- Path: `/Invoice/{invoiceId}/getPositions`
- Tags: `Invoice`

Params:

| Name | In | Required |
|---|---|---|
| `invoiceId` | `path` | yes |
| `embed` | `query` | no |
| `limit` | `query` | no |
| `offset` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getInvoicePositionsById --path invoiceId=<invoiceId> --output json
```
Optional query params: `embed`, `limit`, `offset`.

### getInvoices

- Method: `GET`
- Path: `/Invoice`
- Tags: `Invoice`

Params:

| Name | In | Required |
|---|---|---|
| `contact[id]` | `query` | no |
| `contact[objectName]` | `query` | no |
| `endDate` | `query` | no |
| `invoiceNumber` | `query` | no |
| `startDate` | `query` | no |
| `status` | `query` | no |

Runtime quirk:

_(none)_

Notes:

- Date filters (observed): in our tests, `startDate`/`endDate` work as Unix timestamps (seconds); ISO dates like `2026-01-01` returned empty results. Example: `startDate=1767225600` and `endDate=1769903999` for January 2026.

Example:

```bash
sevdesk-agent read getInvoices --output json
```
Optional query params: `contact[id]`, `contact[objectName]`, `endDate`, `invoiceNumber`, `startDate`, `status`.

### getIsInvoicePartiallyPaid

- Method: `GET`
- Path: `/Invoice/{invoiceId}/getIsPartiallyPaid`
- Tags: `Invoice`

Params:

| Name | In | Required |
|---|---|---|
| `invoiceId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getIsInvoicePartiallyPaid --path invoiceId=<invoiceId> --output json
```

### getLetterpapersWithThumb

- Method: `GET`
- Path: `/DocServer/getLetterpapersWithThumb`
- Tags: `Layout`

Params:

_(no params)_

Runtime quirk:

- unwrapObjects: true
- notes: Response is wrapped in data.objects instead of result/letterpapers top-level fields.

Example:

```bash
sevdesk-agent read getLetterpapersWithThumb --output json
```

### getNextCustomerNumber

- Method: `GET`
- Path: `/Contact/Factory/getNextCustomerNumber`
- Tags: `Contact`

Params:

_(no params)_

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getNextCustomerNumber --output json
```

### getOrderById

- Method: `GET`
- Path: `/Order/{orderId}`
- Tags: `Order`

Params:

| Name | In | Required |
|---|---|---|
| `orderId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getOrderById --path orderId=<orderId> --output json
```

### getOrderPositionById

- Method: `GET`
- Path: `/OrderPos/{orderPosId}`
- Tags: `OrderPos`

Params:

| Name | In | Required |
|---|---|---|
| `orderPosId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getOrderPositionById --path orderPosId=<orderPosId> --output json
```

### getOrderPositions

- Method: `GET`
- Path: `/OrderPos`
- Tags: `OrderPos`

Params:

| Name | In | Required |
|---|---|---|
| `order[id]` | `query` | no |
| `order[objectName]` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getOrderPositions --output json
```
Optional query params: `order[id]`, `order[objectName]`.

### getOrderPositionsById

- Method: `GET`
- Path: `/Order/{orderId}/getPositions`
- Tags: `Order`

Params:

| Name | In | Required |
|---|---|---|
| `orderId` | `path` | yes |
| `embed` | `query` | no |
| `limit` | `query` | no |
| `offset` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getOrderPositionsById --path orderId=<orderId> --output json
```
Optional query params: `embed`, `limit`, `offset`.

### getOrders

- Method: `GET`
- Path: `/Order`
- Tags: `Order`

Params:

| Name | In | Required |
|---|---|---|
| `contact[id]` | `query` | no |
| `contact[objectName]` | `query` | no |
| `endDate` | `query` | no |
| `orderNumber` | `query` | no |
| `startDate` | `query` | no |
| `status` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getOrders --output json
```
Optional query params: `contact[id]`, `contact[objectName]`, `endDate`, `orderNumber`, `startDate`, `status`.

### getPartById

- Method: `GET`
- Path: `/Part/{partId}`
- Tags: `Part`

Params:

| Name | In | Required |
|---|---|---|
| `partId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getPartById --path partId=<partId> --output json
```

### getParts

- Method: `GET`
- Path: `/Part`
- Tags: `Part`

Params:

| Name | In | Required |
|---|---|---|
| `name` | `query` | no |
| `partNumber` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getParts --output json
```
Optional query params: `name`, `partNumber`.

### getPlaceholder

- Method: `GET`
- Path: `/Textparser/fetchDictionaryEntriesByType`
- Tags: `ContactField`

Params:

| Name | In | Required |
|---|---|---|
| `objectName` | `query` | yes |
| `subObjectName` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getPlaceholder --query objectName=<value> --output json
```
Optional query params: `subObjectName`.

### getProgress

- Method: `GET`
- Path: `/Progress/getProgress`
- Tags: `Export`

Params:

| Name | In | Required |
|---|---|---|
| `hash` | `query` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getProgress --query hash=<value> --output json
```

### getReferenceCount

- Method: `GET`
- Path: `/ContactCustomFieldSetting/{contactCustomFieldSettingId}/getReferenceCount`
- Tags: `ContactField`

Params:

| Name | In | Required |
|---|---|---|
| `contactCustomFieldSettingId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getReferenceCount --path contactCustomFieldSettingId=<contactCustomFieldSettingId> --output json
```

### getRelatedObjects

- Method: `GET`
- Path: `/Order/{orderId}/getRelatedObjects`
- Tags: `Order`

Params:

| Name | In | Required |
|---|---|---|
| `orderId` | `path` | yes |
| `embed` | `query` | no |
| `includeItself` | `query` | no |
| `sortByType` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getRelatedObjects --path orderId=<orderId> --output json
```
Optional query params: `embed`, `includeItself`, `sortByType`.

### getTagById

- Method: `GET`
- Path: `/Tag/{tagId}`
- Tags: `Tag`

Params:

| Name | In | Required |
|---|---|---|
| `tagId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getTagById --path tagId=<tagId> --output json
```

### getTagRelations

- Method: `GET`
- Path: `/TagRelation`
- Tags: `Tag`

Params:

_(no params)_

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getTagRelations --output json
```

### getTags

- Method: `GET`
- Path: `/Tag`
- Tags: `Tag`

Params:

| Name | In | Required |
|---|---|---|
| `id` | `query` | no |
| `name` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getTags --output json
```
Optional query params: `id`, `name`.

### getTemplates

- Method: `GET`
- Path: `/DocServer/getTemplatesWithThumb`
- Tags: `Layout`

Params:

| Name | In | Required |
|---|---|---|
| `type` | `query` | no |

Runtime quirk:

- unwrapObjects: true
- notes: Response is wrapped in data.objects instead of result/templates top-level fields.

Example:

```bash
sevdesk-agent read getTemplates --output json
```
Optional query params: `type`.

### getTransactions

- Method: `GET`
- Path: `/CheckAccountTransaction`
- Tags: `CheckAccountTransaction`

Params:

| Name | In | Required |
|---|---|---|
| `checkAccount[id]` | `query` | no |
| `checkAccount[objectName]` | `query` | no |
| `endDate` | `query` | no |
| `isBooked` | `query` | no |
| `onlyCredit` | `query` | no |
| `onlyDebit` | `query` | no |
| `payeePayerName` | `query` | no |
| `paymtPurpose` | `query` | no |
| `startDate` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getTransactions --output json
```
Optional query params: `checkAccount[id]`, `checkAccount[objectName]`, `endDate`, `isBooked`, `onlyCredit`, `onlyDebit`, `payeePayerName`, `paymtPurpose`, `startDate`.

### getVoucherById

- Method: `GET`
- Path: `/Voucher/{voucherId}`
- Tags: `Voucher`

Params:

| Name | In | Required |
|---|---|---|
| `voucherId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getVoucherById --path voucherId=<voucherId> --output json
```

### getVoucherPositions

- Method: `GET`
- Path: `/VoucherPos`
- Tags: `VoucherPos`

Params:

| Name | In | Required |
|---|---|---|
| `voucher[id]` | `query` | no |
| `voucher[objectName]` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getVoucherPositions --output json
```
Optional query params: `voucher[id]`, `voucher[objectName]`.

### getVouchers

- Method: `GET`
- Path: `/Voucher`
- Tags: `Voucher`

Params:

| Name | In | Required |
|---|---|---|
| `contact[id]` | `query` | no |
| `contact[objectName]` | `query` | no |
| `creditDebit` | `query` | no |
| `descriptionLike` | `query` | no |
| `endDate` | `query` | no |
| `startDate` | `query` | no |
| `status` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read getVouchers --output json
```
Optional query params: `contact[id]`, `contact[objectName]`, `creditDebit`, `descriptionLike`, `endDate`, `startDate`, `status`.

### invoiceGetPdf

- Method: `GET`
- Path: `/Invoice/{invoiceId}/getPdf`
- Tags: `Invoice`

Params:

| Name | In | Required |
|---|---|---|
| `invoiceId` | `path` | yes |
| `download` | `query` | no |
| `preventSendBy` | `query` | no |

Runtime quirk:

- unwrapObjects: true
- notes: Response is wrapped in data.objects instead of top-level document fields.

Notes:

- `*GetPdf` responses are typically JSON wrapped in `data.objects` (often containing `filename`, `mimetype`, and base64 `content`). The CLI does not automatically write files to disk.
- If an endpoint returns a non-JSON binary content-type (pdf/xml/zip/csv), the CLI prints metadata (`binary`, `bytes`, `contentType`) instead of raw bytes.

Example:

```bash
sevdesk-agent read invoiceGetPdf --path invoiceId=<invoiceId> --output json
```
Optional query params: `download`, `preventSendBy`.

### invoiceGetXml

- Method: `GET`
- Path: `/Invoice/{invoiceId}/getXml`
- Tags: `Invoice`

Params:

| Name | In | Required |
|---|---|---|
| `invoiceId` | `path` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read invoiceGetXml --path invoiceId=<invoiceId> --output json
```

### jobDownloadInfo

- Method: `GET`
- Path: `/ExportJob/jobDownloadInfo`
- Tags: `Export`

Params:

| Name | In | Required |
|---|---|---|
| `jobId` | `query` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read jobDownloadInfo --query jobId=<value> --output json
```

### listPrivateTransactionRules

- Method: `GET`
- Path: `/PrivateTransactionRule`
- Tags: `PrivateTransactionRule`

Params:

_(no params)_

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read listPrivateTransactionRules --output json
```

### orderGetPdf

- Method: `GET`
- Path: `/Order/{orderId}/getPdf`
- Tags: `Order`

Params:

| Name | In | Required |
|---|---|---|
| `orderId` | `path` | yes |
| `download` | `query` | no |
| `preventSendBy` | `query` | no |

Runtime quirk:

- unwrapObjects: true
- notes: Response is wrapped in data.objects instead of top-level document fields.

Notes:

- `*GetPdf` responses are typically JSON wrapped in `data.objects` (often containing `filename`, `mimetype`, and base64 `content`). The CLI does not automatically write files to disk.
- If an endpoint returns a non-JSON binary content-type (pdf/xml/zip/csv), the CLI prints metadata (`binary`, `bytes`, `contentType`) instead of raw bytes.

Example:

```bash
sevdesk-agent read orderGetPdf --path orderId=<orderId> --output json
```
Optional query params: `download`, `preventSendBy`.

### partGetStock

- Method: `GET`
- Path: `/Part/{partId}/getStock`
- Tags: `Part`

Params:

| Name | In | Required |
|---|---|---|
| `partId` | `path` | yes |

Runtime quirk:

- coerceObjectsNumber: true
- notes: objects is returned as numeric string instead of integer.

Example:

```bash
sevdesk-agent read partGetStock --path partId=<partId> --output json
```

### reportContact

- Method: `GET`
- Path: `/Report/contactlist`
- Tags: `Report`

Params:

| Name | In | Required |
|---|---|---|
| `sevQuery` | `query` | yes |
| `download` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read reportContact --query sevQuery=<value> --output json
```
Optional query params: `download`.

### reportInvoice

- Method: `GET`
- Path: `/Report/invoicelist`
- Tags: `Report`

Params:

| Name | In | Required |
|---|---|---|
| `sevQuery` | `query` | yes |
| `view` | `query` | yes |
| `download` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read reportInvoice --query view=<value> --query sevQuery=<value> --output json
```
Optional query params: `download`.

### reportOrder

- Method: `GET`
- Path: `/Report/orderlist`
- Tags: `Report`

Params:

| Name | In | Required |
|---|---|---|
| `sevQuery` | `query` | yes |
| `view` | `query` | yes |
| `download` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read reportOrder --query view=<value> --query sevQuery=<value> --output json
```
Optional query params: `download`.

### reportVoucher

- Method: `GET`
- Path: `/Report/voucherlist`
- Tags: `Report`

Params:

| Name | In | Required |
|---|---|---|
| `sevQuery` | `query` | yes |
| `download` | `query` | no |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read reportVoucher --query sevQuery=<value> --output json
```
Optional query params: `download`.

### sendCreditNoteByPrinting

- Method: `GET`
- Path: `/CreditNote/{creditNoteId}/sendByWithRender`
- Tags: `CreditNote`

Params:

| Name | In | Required |
|---|---|---|
| `creditNoteId` | `path` | yes |
| `sendType` | `query` | yes |

Runtime quirk:

_(none)_

Example:

```bash
sevdesk-agent read sendCreditNoteByPrinting --path creditNoteId=<creditNoteId> --query sendType=<value> --output json
```

