# OpenAPI -> CLI Coverage Checklist

Generated: 2026-02-27T08:43:08.461Z

## Summary

- Total OpenAPI operations: 154
- Supported in CLI: 153
- Supported with caveat: 1
- Missing in CLI: 0

Method split:
- GET: 79
- POST: 28
- PUT: 34
- DELETE: 13

## Checklist (per operation)

### AccountingContact (5)

- [x] `createAccountingContact` (`POST` `/AccountingContact`) -> SUPPORTED via `sevdesk-agent write createAccountingContact`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `deleteAccountingContact` (`DELETE` `/AccountingContact/{accountingContactId}`) -> SUPPORTED via `sevdesk-agent write deleteAccountingContact`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `getAccountingContact` (`GET` `/AccountingContact`) -> SUPPORTED via `sevdesk-agent read getAccountingContact`
- [x] `getAccountingContactById` (`GET` `/AccountingContact/{accountingContactId}`) -> SUPPORTED via `sevdesk-agent read getAccountingContactById`
- [x] `updateAccountingContact` (`PUT` `/AccountingContact/{accountingContactId}`) -> SUPPORTED via `sevdesk-agent write updateAccountingContact`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.

### Basics (1)

- [x] `bookkeepingSystemVersion` (`GET` `/Tools/bookkeepingSystemVersion`) -> SUPPORTED via `sevdesk-agent read bookkeepingSystemVersion`

### CheckAccount (7)

- [x] `createClearingAccount` (`POST` `/CheckAccount/Factory/clearingAccount`) -> SUPPORTED via `sevdesk-agent write createClearingAccount`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `createFileImportAccount` (`POST` `/CheckAccount/Factory/fileImportAccount`) -> SUPPORTED via `sevdesk-agent write createFileImportAccount`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `deleteCheckAccount` (`DELETE` `/CheckAccount/{checkAccountId}`) -> SUPPORTED via `sevdesk-agent write deleteCheckAccount`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `getBalanceAtDate` (`GET` `/CheckAccount/{checkAccountId}/getBalanceAtDate`) -> SUPPORTED via `sevdesk-agent read getBalanceAtDate`
- [x] `getCheckAccountById` (`GET` `/CheckAccount/{checkAccountId}`) -> SUPPORTED via `sevdesk-agent read getCheckAccountById`
- [x] `getCheckAccounts` (`GET` `/CheckAccount`) -> SUPPORTED via `sevdesk-agent read getCheckAccounts`
- [x] `updateCheckAccount` (`PUT` `/CheckAccount/{checkAccountId}`) -> SUPPORTED via `sevdesk-agent write updateCheckAccount`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.

### CheckAccountTransaction (6)

- [x] `checkAccountTransactionEnshrine` (`PUT` `/CheckAccountTransaction/{checkAccountTransactionId}/enshrine`) -> SUPPORTED via `sevdesk-agent write checkAccountTransactionEnshrine`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `createTransaction` (`POST` `/CheckAccountTransaction`) -> SUPPORTED via `sevdesk-agent write createTransaction`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `deleteCheckAccountTransaction` (`DELETE` `/CheckAccountTransaction/{checkAccountTransactionId}`) -> SUPPORTED via `sevdesk-agent write deleteCheckAccountTransaction`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `getCheckAccountTransactionById` (`GET` `/CheckAccountTransaction/{checkAccountTransactionId}`) -> SUPPORTED via `sevdesk-agent read getCheckAccountTransactionById`
- [x] `getTransactions` (`GET` `/CheckAccountTransaction`) -> SUPPORTED via `sevdesk-agent read getTransactions`
- [x] `updateCheckAccountTransaction` (`PUT` `/CheckAccountTransaction/{checkAccountTransactionId}`) -> SUPPORTED via `sevdesk-agent write updateCheckAccountTransaction`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.

### CommunicationWay (6)

- [x] `createCommunicationWay` (`POST` `/CommunicationWay`) -> SUPPORTED via `sevdesk-agent write createCommunicationWay`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `deleteCommunicationWay` (`DELETE` `/CommunicationWay/{communicationWayId}`) -> SUPPORTED via `sevdesk-agent write deleteCommunicationWay`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `getCommunicationWayById` (`GET` `/CommunicationWay/{communicationWayId}`) -> SUPPORTED via `sevdesk-agent read getCommunicationWayById`
- [x] `getCommunicationWayKeys` (`GET` `/CommunicationWayKey`) -> SUPPORTED via `sevdesk-agent read getCommunicationWayKeys`
- [x] `getCommunicationWays` (`GET` `/CommunicationWay`) -> SUPPORTED via `sevdesk-agent read getCommunicationWays`
- [x] `UpdateCommunicationWay` (`PUT` `/CommunicationWay/{communicationWayId}`) -> SUPPORTED via `sevdesk-agent write UpdateCommunicationWay`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.

### Contact (9)

- [x] `contactCustomerNumberAvailabilityCheck` (`GET` `/Contact/Mapper/checkCustomerNumberAvailability`) -> SUPPORTED via `sevdesk-agent read contactCustomerNumberAvailabilityCheck`
  Note: Runtime-required query params: customerNumber
- [x] `createContact` (`POST` `/Contact`) -> SUPPORTED via `sevdesk-agent write createContact`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `deleteContact` (`DELETE` `/Contact/{contactId}`) -> SUPPORTED via `sevdesk-agent write deleteContact`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `findContactsByCustomFieldValue` (`GET` `/Contact/Factory/findContactsByCustomFieldValue`) -> SUPPORTED via `sevdesk-agent read findContactsByCustomFieldValue`
- [x] `getContactById` (`GET` `/Contact/{contactId}`) -> SUPPORTED via `sevdesk-agent read getContactById`
- [x] `getContacts` (`GET` `/Contact`) -> SUPPORTED via `sevdesk-agent read getContacts`
- [x] `getContactTabsItemCountById` (`GET` `/Contact/{contactId}/getTabsItemCount`) -> SUPPORTED via `sevdesk-agent read getContactTabsItemCountById`
  Note: Runtime normalization: unwrapObjects
- [x] `getNextCustomerNumber` (`GET` `/Contact/Factory/getNextCustomerNumber`) -> SUPPORTED via `sevdesk-agent read getNextCustomerNumber`
- [x] `updateContact` (`PUT` `/Contact/{contactId}`) -> SUPPORTED via `sevdesk-agent write updateContact`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.

### ContactAddress (5)

- [x] `contactAddressId` (`GET` `/ContactAddress/{contactAddressId}`) -> SUPPORTED via `sevdesk-agent read contactAddressId`
- [x] `createContactAddress` (`POST` `/ContactAddress`) -> SUPPORTED via `sevdesk-agent write createContactAddress`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `deleteContactAddress` (`DELETE` `/ContactAddress/{contactAddressId}`) -> SUPPORTED via `sevdesk-agent write deleteContactAddress`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `getContactAddresses` (`GET` `/ContactAddress`) -> SUPPORTED via `sevdesk-agent read getContactAddresses`
- [x] `updateContactAddress` (`PUT` `/ContactAddress/{contactAddressId}`) -> SUPPORTED via `sevdesk-agent write updateContactAddress`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.

### ContactField (12)

- [x] `createContactField` (`POST` `/ContactCustomField`) -> SUPPORTED via `sevdesk-agent write createContactField`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `createContactFieldSetting` (`POST` `/ContactCustomFieldSetting`) -> SUPPORTED via `sevdesk-agent write createContactFieldSetting`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `deleteContactCustomFieldId` (`DELETE` `/ContactCustomField/{contactCustomFieldId}`) -> SUPPORTED via `sevdesk-agent write deleteContactCustomFieldId`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `deleteContactFieldSetting` (`DELETE` `/ContactCustomFieldSetting/{contactCustomFieldSettingId}`) -> SUPPORTED via `sevdesk-agent write deleteContactFieldSetting`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `getContactFields` (`GET` `/ContactCustomField`) -> SUPPORTED via `sevdesk-agent read getContactFields`
- [x] `getContactFieldsById` (`GET` `/ContactCustomField/{contactCustomFieldId}`) -> SUPPORTED via `sevdesk-agent read getContactFieldsById`
- [x] `getContactFieldSettingById` (`GET` `/ContactCustomFieldSetting/{contactCustomFieldSettingId}`) -> SUPPORTED via `sevdesk-agent read getContactFieldSettingById`
- [x] `getContactFieldSettings` (`GET` `/ContactCustomFieldSetting`) -> SUPPORTED via `sevdesk-agent read getContactFieldSettings`
- [x] `getPlaceholder` (`GET` `/Textparser/fetchDictionaryEntriesByType`) -> SUPPORTED via `sevdesk-agent read getPlaceholder`
- [x] `getReferenceCount` (`GET` `/ContactCustomFieldSetting/{contactCustomFieldSettingId}/getReferenceCount`) -> SUPPORTED via `sevdesk-agent read getReferenceCount`
- [x] `updateContactfield` (`PUT` `/ContactCustomField/{contactCustomFieldId}`) -> SUPPORTED via `sevdesk-agent write updateContactfield`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `updateContactFieldSetting` (`PUT` `/ContactCustomFieldSetting/{contactCustomFieldSettingId}`) -> SUPPORTED via `sevdesk-agent write updateContactFieldSetting`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.

### CreditNote (15)

- [x] `bookCreditNote` (`PUT` `/CreditNote/{creditNoteId}/bookAmount`) -> SUPPORTED via `sevdesk-agent write bookCreditNote`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `createcreditNote` (`POST` `/CreditNote/Factory/saveCreditNote`) -> SUPPORTED via `sevdesk-agent write createcreditNote`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `createCreditNoteFromInvoice` (`POST` `/CreditNote/Factory/createFromInvoice`) -> SUPPORTED via `sevdesk-agent write createCreditNoteFromInvoice`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `createCreditNoteFromVoucher` (`POST` `/CreditNote/Factory/createFromVoucher`) -> SUPPORTED via `sevdesk-agent write createCreditNoteFromVoucher`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `creditNoteEnshrine` (`PUT` `/CreditNote/{creditNoteId}/enshrine`) -> SUPPORTED via `sevdesk-agent write creditNoteEnshrine`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `creditNoteGetPdf` (`GET` `/CreditNote/{creditNoteId}/getPdf`) -> SUPPORTED via `sevdesk-agent read creditNoteGetPdf`
- [x] `creditNoteResetToDraft` (`PUT` `/CreditNote/{creditNoteId}/resetToDraft`) -> SUPPORTED via `sevdesk-agent write creditNoteResetToDraft`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `creditNoteResetToOpen` (`PUT` `/CreditNote/{creditNoteId}/resetToOpen`) -> SUPPORTED via `sevdesk-agent write creditNoteResetToOpen`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `creditNoteSendBy` (`PUT` `/CreditNote/{creditNoteId}/sendBy`) -> SUPPORTED via `sevdesk-agent write creditNoteSendBy`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `deletecreditNote` (`DELETE` `/CreditNote/{creditNoteId}`) -> SUPPORTED via `sevdesk-agent write deletecreditNote`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `getcreditNoteById` (`GET` `/CreditNote/{creditNoteId}`) -> SUPPORTED via `sevdesk-agent read getcreditNoteById`
- [x] `getCreditNotes` (`GET` `/CreditNote`) -> SUPPORTED via `sevdesk-agent read getCreditNotes`
- [x] `sendCreditNoteByPrinting` (`GET` `/CreditNote/{creditNoteId}/sendByWithRender`) -> SUPPORTED via `sevdesk-agent read sendCreditNoteByPrinting`
- [x] `sendCreditNoteViaEMail` (`POST` `/CreditNote/{creditNoteId}/sendViaEmail`) -> SUPPORTED via `sevdesk-agent write sendCreditNoteViaEMail`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `updatecreditNote` (`PUT` `/CreditNote/{creditNoteId}`) -> SUPPORTED via `sevdesk-agent write updatecreditNote`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.

### CreditNotePos (1)

- [x] `getcreditNotePositions` (`GET` `/CreditNotePos`) -> SUPPORTED via `sevdesk-agent read getcreditNotePositions`

### Export (14)

- [x] `exportContact` (`GET` `/Export/contactListCsv`) -> SUPPORTED via `sevdesk-agent read exportContact`
- [x] `exportCreditNote` (`GET` `/Export/creditNoteCsv`) -> SUPPORTED via `sevdesk-agent read exportCreditNote`
- [x] `exportDatevCSV` (`GET` `/Export/createDatevCsvZipExportJob`) -> SUPPORTED via `sevdesk-agent read exportDatevCSV`
- [x] `exportDatevDepricated` (`GET` `/Export/datevCSV`) -> SUPPORTED via `sevdesk-agent read exportDatevDepricated`
- [x] `exportDatevXML` (`GET` `/Export/createDatevXmlZipExportJob`) -> SUPPORTED via `sevdesk-agent read exportDatevXML`
- [x] `exportInvoice` (`GET` `/Export/invoiceCsv`) -> SUPPORTED via `sevdesk-agent read exportInvoice`
- [x] `exportInvoiceZip` (`GET` `/Export/invoiceZip`) -> SUPPORTED via `sevdesk-agent read exportInvoiceZip`
- [x] `exportTransactions` (`GET` `/Export/transactionsCsv`) -> SUPPORTED via `sevdesk-agent read exportTransactions`
- [x] `exportVoucher` (`GET` `/Export/voucherListCsv`) -> SUPPORTED via `sevdesk-agent read exportVoucher`
- [x] `exportVoucherZip` (`GET` `/Export/voucherZip`) -> SUPPORTED via `sevdesk-agent read exportVoucherZip`
- [x] `generateDownloadHash` (`GET` `/Progress/generateDownloadHash`) -> SUPPORTED via `sevdesk-agent read generateDownloadHash`
- [x] `getProgress` (`GET` `/Progress/getProgress`) -> SUPPORTED via `sevdesk-agent read getProgress`
- [x] `jobDownloadInfo` (`GET` `/ExportJob/jobDownloadInfo`) -> SUPPORTED via `sevdesk-agent read jobDownloadInfo`
- [x] `updateExportConfig` (`PUT` `/SevClient/{SevClientId}/updateExportConfig`) -> SUPPORTED via `sevdesk-agent write updateExportConfig`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.

### Invoice (17)

- [x] `bookInvoice` (`PUT` `/Invoice/{invoiceId}/bookAmount`) -> SUPPORTED via `sevdesk-agent write bookInvoice`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `cancelInvoice` (`POST` `/Invoice/{invoiceId}/cancelInvoice`) -> SUPPORTED via `sevdesk-agent write cancelInvoice`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `createInvoiceByFactory` (`POST` `/Invoice/Factory/saveInvoice`) -> SUPPORTED via `sevdesk-agent write createInvoiceByFactory`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `createInvoiceFromOrder` (`POST` `/Invoice/Factory/createInvoiceFromOrder`) -> SUPPORTED via `sevdesk-agent write createInvoiceFromOrder`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `createInvoiceReminder` (`POST` `/Invoice/Factory/createInvoiceReminder`) -> SUPPORTED via `sevdesk-agent write createInvoiceReminder`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `getInvoiceById` (`GET` `/Invoice/{invoiceId}`) -> SUPPORTED via `sevdesk-agent read getInvoiceById`
- [x] `getInvoicePositionsById` (`GET` `/Invoice/{invoiceId}/getPositions`) -> SUPPORTED via `sevdesk-agent read getInvoicePositionsById`
- [x] `getInvoices` (`GET` `/Invoice`) -> SUPPORTED via `sevdesk-agent read getInvoices`
- [x] `getIsInvoicePartiallyPaid` (`GET` `/Invoice/{invoiceId}/getIsPartiallyPaid`) -> SUPPORTED via `sevdesk-agent read getIsInvoicePartiallyPaid`
- [x] `invoiceEnshrine` (`PUT` `/Invoice/{invoiceId}/enshrine`) -> SUPPORTED via `sevdesk-agent write invoiceEnshrine`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `invoiceGetPdf` (`GET` `/Invoice/{invoiceId}/getPdf`) -> SUPPORTED via `sevdesk-agent read invoiceGetPdf`
  Note: Runtime normalization: unwrapObjects
- [x] `invoiceGetXml` (`GET` `/Invoice/{invoiceId}/getXml`) -> SUPPORTED via `sevdesk-agent read invoiceGetXml`
- [x] `invoiceRender` (`POST` `/Invoice/{invoiceId}/render`) -> SUPPORTED via `sevdesk-agent write invoiceRender`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `invoiceResetToDraft` (`PUT` `/Invoice/{invoiceId}/resetToDraft`) -> SUPPORTED via `sevdesk-agent write invoiceResetToDraft`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `invoiceResetToOpen` (`PUT` `/Invoice/{invoiceId}/resetToOpen`) -> SUPPORTED via `sevdesk-agent write invoiceResetToOpen`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `invoiceSendBy` (`PUT` `/Invoice/{invoiceId}/sendBy`) -> SUPPORTED via `sevdesk-agent write invoiceSendBy`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `sendInvoiceViaEMail` (`POST` `/Invoice/{invoiceId}/sendViaEmail`) -> SUPPORTED via `sevdesk-agent write sendInvoiceViaEMail`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.

### InvoicePos (1)

- [x] `getInvoicePos` (`GET` `/InvoicePos`) -> SUPPORTED via `sevdesk-agent read getInvoicePos`

### Layout (5)

- [x] `getLetterpapersWithThumb` (`GET` `/DocServer/getLetterpapersWithThumb`) -> SUPPORTED via `sevdesk-agent read getLetterpapersWithThumb`
  Note: Runtime normalization: unwrapObjects
- [x] `getTemplates` (`GET` `/DocServer/getTemplatesWithThumb`) -> SUPPORTED via `sevdesk-agent read getTemplates`
  Note: Runtime normalization: unwrapObjects
- [x] `updateCreditNoteTemplate` (`PUT` `/CreditNote/{creditNoteId}/changeParameter`) -> SUPPORTED via `sevdesk-agent write updateCreditNoteTemplate`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `updateInvoiceTemplate` (`PUT` `/Invoice/{invoiceId}/changeParameter`) -> SUPPORTED via `sevdesk-agent write updateInvoiceTemplate`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `updateOrderTemplate` (`PUT` `/Order/{orderId}/changeParameter`) -> SUPPORTED via `sevdesk-agent write updateOrderTemplate`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.

### Order (13)

- [x] `createContractNoteFromOrder` (`POST` `/Order/Factory/createContractNoteFromOrder`) -> SUPPORTED via `sevdesk-agent write createContractNoteFromOrder`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `createOrder` (`POST` `/Order/Factory/saveOrder`) -> SUPPORTED via `sevdesk-agent write createOrder`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `createPackingListFromOrder` (`POST` `/Order/Factory/createPackingListFromOrder`) -> SUPPORTED via `sevdesk-agent write createPackingListFromOrder`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `deleteOrder` (`DELETE` `/Order/{orderId}`) -> SUPPORTED via `sevdesk-agent write deleteOrder`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `getDiscounts` (`GET` `/Order/{orderId}/getDiscounts`) -> SUPPORTED via `sevdesk-agent read getDiscounts`
- [x] `getOrderById` (`GET` `/Order/{orderId}`) -> SUPPORTED via `sevdesk-agent read getOrderById`
- [x] `getOrderPositionsById` (`GET` `/Order/{orderId}/getPositions`) -> SUPPORTED via `sevdesk-agent read getOrderPositionsById`
- [x] `getOrders` (`GET` `/Order`) -> SUPPORTED via `sevdesk-agent read getOrders`
- [x] `getRelatedObjects` (`GET` `/Order/{orderId}/getRelatedObjects`) -> SUPPORTED via `sevdesk-agent read getRelatedObjects`
- [x] `orderGetPdf` (`GET` `/Order/{orderId}/getPdf`) -> SUPPORTED via `sevdesk-agent read orderGetPdf`
  Note: Runtime normalization: unwrapObjects
- [x] `orderSendBy` (`PUT` `/Order/{orderId}/sendBy`) -> SUPPORTED via `sevdesk-agent write orderSendBy`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `sendorderViaEMail` (`POST` `/Order/{orderId}/sendViaEmail`) -> SUPPORTED via `sevdesk-agent write sendorderViaEMail`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `updateOrder` (`PUT` `/Order/{orderId}`) -> SUPPORTED via `sevdesk-agent write updateOrder`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.

### OrderPos (4)

- [x] `deleteOrderPos` (`DELETE` `/OrderPos/{orderPosId}`) -> SUPPORTED via `sevdesk-agent write deleteOrderPos`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `getOrderPositionById` (`GET` `/OrderPos/{orderPosId}`) -> SUPPORTED via `sevdesk-agent read getOrderPositionById`
- [x] `getOrderPositions` (`GET` `/OrderPos`) -> SUPPORTED via `sevdesk-agent read getOrderPositions`
- [x] `updateOrderPosition` (`PUT` `/OrderPos/{orderPosId}`) -> SUPPORTED via `sevdesk-agent write updateOrderPosition`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.

### Part (5)

- [x] `createPart` (`POST` `/Part`) -> SUPPORTED via `sevdesk-agent write createPart`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `getPartById` (`GET` `/Part/{partId}`) -> SUPPORTED via `sevdesk-agent read getPartById`
- [x] `getParts` (`GET` `/Part`) -> SUPPORTED via `sevdesk-agent read getParts`
- [x] `partGetStock` (`GET` `/Part/{partId}/getStock`) -> SUPPORTED via `sevdesk-agent read partGetStock`
  Note: Runtime normalization: coerceObjectsNumber
- [x] `updatePart` (`PUT` `/Part/{partId}`) -> SUPPORTED via `sevdesk-agent write updatePart`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.

### PrivateTransactionRule (3)

- [x] `createPrivateTransactionRule` (`POST` `/PrivateTransactionRule`) -> SUPPORTED via `sevdesk-agent write createPrivateTransactionRule`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `deletePrivateTransactionRule` (`DELETE` `/PrivateTransactionRule/{id}`) -> SUPPORTED via `sevdesk-agent write deletePrivateTransactionRule`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `listPrivateTransactionRules` (`GET` `/PrivateTransactionRule`) -> SUPPORTED via `sevdesk-agent read listPrivateTransactionRules`

### Report (4)

- [x] `reportContact` (`GET` `/Report/contactlist`) -> SUPPORTED via `sevdesk-agent read reportContact`
- [x] `reportInvoice` (`GET` `/Report/invoicelist`) -> SUPPORTED via `sevdesk-agent read reportInvoice`
- [x] `reportOrder` (`GET` `/Report/orderlist`) -> SUPPORTED via `sevdesk-agent read reportOrder`
- [x] `reportVoucher` (`GET` `/Report/voucherlist`) -> SUPPORTED via `sevdesk-agent read reportVoucher`

### Tag (6)

- [x] `createTag` (`POST` `/Tag/Factory/create`) -> SUPPORTED via `sevdesk-agent write createTag`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `deleteTag` (`DELETE` `/Tag/{tagId}`) -> SUPPORTED via `sevdesk-agent write deleteTag`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `getTagById` (`GET` `/Tag/{tagId}`) -> SUPPORTED via `sevdesk-agent read getTagById`
- [x] `getTagRelations` (`GET` `/TagRelation`) -> SUPPORTED via `sevdesk-agent read getTagRelations`
- [x] `getTags` (`GET` `/Tag`) -> SUPPORTED via `sevdesk-agent read getTags`
- [x] `updateTag` (`PUT` `/Tag/{tagId}`) -> SUPPORTED via `sevdesk-agent write updateTag`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.

### Voucher (14)

- [x] `bookVoucher` (`PUT` `/Voucher/{voucherId}/bookAmount`) -> SUPPORTED via `sevdesk-agent write bookVoucher`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `forAccountNumber` (`GET` `/ReceiptGuidance/forAccountNumber`) -> SUPPORTED via `sevdesk-agent read forAccountNumber`
  Note: Runtime normalization: coerceObjectsArray
- [x] `forAllAccounts` (`GET` `/ReceiptGuidance/forAllAccounts`) -> SUPPORTED via `sevdesk-agent read forAllAccounts`
- [x] `forExpense` (`GET` `/ReceiptGuidance/forExpense`) -> SUPPORTED via `sevdesk-agent read forExpense`
- [x] `forRevenue` (`GET` `/ReceiptGuidance/forRevenue`) -> SUPPORTED via `sevdesk-agent read forRevenue`
- [x] `forTaxRule` (`GET` `/ReceiptGuidance/forTaxRule`) -> SUPPORTED via `sevdesk-agent read forTaxRule`
- [x] `getVoucherById` (`GET` `/Voucher/{voucherId}`) -> SUPPORTED via `sevdesk-agent read getVoucherById`
- [x] `getVouchers` (`GET` `/Voucher`) -> SUPPORTED via `sevdesk-agent read getVouchers`
- [x] `updateVoucher` (`PUT` `/Voucher/{voucherId}`) -> SUPPORTED via `sevdesk-agent write updateVoucher`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `voucherEnshrine` (`PUT` `/Voucher/{voucherId}/enshrine`) -> SUPPORTED via `sevdesk-agent write voucherEnshrine`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `voucherFactorySaveVoucher` (`POST` `/Voucher/Factory/saveVoucher`) -> SUPPORTED via `sevdesk-agent write voucherFactorySaveVoucher`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `voucherResetToDraft` (`PUT` `/Voucher/{voucherId}/resetToDraft`) -> SUPPORTED via `sevdesk-agent write voucherResetToDraft`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `voucherResetToOpen` (`PUT` `/Voucher/{voucherId}/resetToOpen`) -> SUPPORTED via `sevdesk-agent write voucherResetToOpen`
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.
- [x] `voucherUploadFile` (`POST` `/Voucher/Factory/uploadTempFile`) -> CAVEAT via `sevdesk-agent write voucherUploadFile`
  Note: Request body content-type is non-JSON: form-data
  Note: CLI client always sends JSON body (Content-Type: application/json).
  Note: Requires write guards: --execute --confirm-execute yes and SEVDESK_ALLOW_WRITE=true or --allow-write.

### VoucherPos (1)

- [x] `getVoucherPositions` (`GET` `/VoucherPos`) -> SUPPORTED via `sevdesk-agent read getVoucherPositions`

