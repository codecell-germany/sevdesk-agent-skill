# Operation Catalog

Generated from `src/data/operations.json`.

Total operations: **154**

You can always list operations via the CLI:

```bash
sevdesk-agent ops list
sevdesk-agent ops list --read-only
sevdesk-agent ops list --json
```

## AccountingContact (5)

| operationId | method | path |
|---|---|---|
| `deleteAccountingContact` | `DELETE` | `/AccountingContact/{accountingContactId}` |
| `getAccountingContact` | `GET` | `/AccountingContact` |
| `getAccountingContactById` | `GET` | `/AccountingContact/{accountingContactId}` |
| `createAccountingContact` | `POST` | `/AccountingContact` |
| `updateAccountingContact` | `PUT` | `/AccountingContact/{accountingContactId}` |

## Basics (1)

| operationId | method | path |
|---|---|---|
| `bookkeepingSystemVersion` | `GET` | `/Tools/bookkeepingSystemVersion` |

## CheckAccount (7)

| operationId | method | path |
|---|---|---|
| `deleteCheckAccount` | `DELETE` | `/CheckAccount/{checkAccountId}` |
| `getCheckAccounts` | `GET` | `/CheckAccount` |
| `getCheckAccountById` | `GET` | `/CheckAccount/{checkAccountId}` |
| `getBalanceAtDate` | `GET` | `/CheckAccount/{checkAccountId}/getBalanceAtDate` |
| `createClearingAccount` | `POST` | `/CheckAccount/Factory/clearingAccount` |
| `createFileImportAccount` | `POST` | `/CheckAccount/Factory/fileImportAccount` |
| `updateCheckAccount` | `PUT` | `/CheckAccount/{checkAccountId}` |

## CheckAccountTransaction (6)

| operationId | method | path |
|---|---|---|
| `deleteCheckAccountTransaction` | `DELETE` | `/CheckAccountTransaction/{checkAccountTransactionId}` |
| `getTransactions` | `GET` | `/CheckAccountTransaction` |
| `getCheckAccountTransactionById` | `GET` | `/CheckAccountTransaction/{checkAccountTransactionId}` |
| `createTransaction` | `POST` | `/CheckAccountTransaction` |
| `updateCheckAccountTransaction` | `PUT` | `/CheckAccountTransaction/{checkAccountTransactionId}` |
| `checkAccountTransactionEnshrine` | `PUT` | `/CheckAccountTransaction/{checkAccountTransactionId}/enshrine` |

## CommunicationWay (6)

| operationId | method | path |
|---|---|---|
| `deleteCommunicationWay` | `DELETE` | `/CommunicationWay/{communicationWayId}` |
| `getCommunicationWays` | `GET` | `/CommunicationWay` |
| `getCommunicationWayById` | `GET` | `/CommunicationWay/{communicationWayId}` |
| `getCommunicationWayKeys` | `GET` | `/CommunicationWayKey` |
| `createCommunicationWay` | `POST` | `/CommunicationWay` |
| `UpdateCommunicationWay` | `PUT` | `/CommunicationWay/{communicationWayId}` |

## Contact (9)

| operationId | method | path |
|---|---|---|
| `deleteContact` | `DELETE` | `/Contact/{contactId}` |
| `getContacts` | `GET` | `/Contact` |
| `getContactById` | `GET` | `/Contact/{contactId}` |
| `getContactTabsItemCountById` | `GET` | `/Contact/{contactId}/getTabsItemCount` |
| `findContactsByCustomFieldValue` | `GET` | `/Contact/Factory/findContactsByCustomFieldValue` |
| `getNextCustomerNumber` | `GET` | `/Contact/Factory/getNextCustomerNumber` |
| `contactCustomerNumberAvailabilityCheck` | `GET` | `/Contact/Mapper/checkCustomerNumberAvailability` |
| `createContact` | `POST` | `/Contact` |
| `updateContact` | `PUT` | `/Contact/{contactId}` |

## ContactAddress (5)

| operationId | method | path |
|---|---|---|
| `deleteContactAddress` | `DELETE` | `/ContactAddress/{contactAddressId}` |
| `getContactAddresses` | `GET` | `/ContactAddress` |
| `contactAddressId` | `GET` | `/ContactAddress/{contactAddressId}` |
| `createContactAddress` | `POST` | `/ContactAddress` |
| `updateContactAddress` | `PUT` | `/ContactAddress/{contactAddressId}` |

## ContactField (12)

| operationId | method | path |
|---|---|---|
| `deleteContactCustomFieldId` | `DELETE` | `/ContactCustomField/{contactCustomFieldId}` |
| `deleteContactFieldSetting` | `DELETE` | `/ContactCustomFieldSetting/{contactCustomFieldSettingId}` |
| `getContactFields` | `GET` | `/ContactCustomField` |
| `getContactFieldsById` | `GET` | `/ContactCustomField/{contactCustomFieldId}` |
| `getContactFieldSettings` | `GET` | `/ContactCustomFieldSetting` |
| `getContactFieldSettingById` | `GET` | `/ContactCustomFieldSetting/{contactCustomFieldSettingId}` |
| `getReferenceCount` | `GET` | `/ContactCustomFieldSetting/{contactCustomFieldSettingId}/getReferenceCount` |
| `getPlaceholder` | `GET` | `/Textparser/fetchDictionaryEntriesByType` |
| `createContactField` | `POST` | `/ContactCustomField` |
| `createContactFieldSetting` | `POST` | `/ContactCustomFieldSetting` |
| `updateContactfield` | `PUT` | `/ContactCustomField/{contactCustomFieldId}` |
| `updateContactFieldSetting` | `PUT` | `/ContactCustomFieldSetting/{contactCustomFieldSettingId}` |

## CreditNote (15)

| operationId | method | path |
|---|---|---|
| `deletecreditNote` | `DELETE` | `/CreditNote/{creditNoteId}` |
| `getCreditNotes` | `GET` | `/CreditNote` |
| `getcreditNoteById` | `GET` | `/CreditNote/{creditNoteId}` |
| `creditNoteGetPdf` | `GET` | `/CreditNote/{creditNoteId}/getPdf` |
| `sendCreditNoteByPrinting` | `GET` | `/CreditNote/{creditNoteId}/sendByWithRender` |
| `sendCreditNoteViaEMail` | `POST` | `/CreditNote/{creditNoteId}/sendViaEmail` |
| `createCreditNoteFromInvoice` | `POST` | `/CreditNote/Factory/createFromInvoice` |
| `createCreditNoteFromVoucher` | `POST` | `/CreditNote/Factory/createFromVoucher` |
| `createcreditNote` | `POST` | `/CreditNote/Factory/saveCreditNote` |
| `updatecreditNote` | `PUT` | `/CreditNote/{creditNoteId}` |
| `bookCreditNote` | `PUT` | `/CreditNote/{creditNoteId}/bookAmount` |
| `creditNoteEnshrine` | `PUT` | `/CreditNote/{creditNoteId}/enshrine` |
| `creditNoteResetToDraft` | `PUT` | `/CreditNote/{creditNoteId}/resetToDraft` |
| `creditNoteResetToOpen` | `PUT` | `/CreditNote/{creditNoteId}/resetToOpen` |
| `creditNoteSendBy` | `PUT` | `/CreditNote/{creditNoteId}/sendBy` |

## CreditNotePos (1)

| operationId | method | path |
|---|---|---|
| `getcreditNotePositions` | `GET` | `/CreditNotePos` |

## Export (14)

| operationId | method | path |
|---|---|---|
| `exportContact` | `GET` | `/Export/contactListCsv` |
| `exportDatevCSV` | `GET` | `/Export/createDatevCsvZipExportJob` |
| `exportDatevXML` | `GET` | `/Export/createDatevXmlZipExportJob` |
| `exportCreditNote` | `GET` | `/Export/creditNoteCsv` |
| `exportDatevDepricated` | `GET` | `/Export/datevCSV` |
| `exportInvoice` | `GET` | `/Export/invoiceCsv` |
| `exportInvoiceZip` | `GET` | `/Export/invoiceZip` |
| `exportTransactions` | `GET` | `/Export/transactionsCsv` |
| `exportVoucher` | `GET` | `/Export/voucherListCsv` |
| `exportVoucherZip` | `GET` | `/Export/voucherZip` |
| `jobDownloadInfo` | `GET` | `/ExportJob/jobDownloadInfo` |
| `generateDownloadHash` | `GET` | `/Progress/generateDownloadHash` |
| `getProgress` | `GET` | `/Progress/getProgress` |
| `updateExportConfig` | `PUT` | `/SevClient/{SevClientId}/updateExportConfig` |

## Invoice (17)

| operationId | method | path |
|---|---|---|
| `getInvoices` | `GET` | `/Invoice` |
| `getInvoiceById` | `GET` | `/Invoice/{invoiceId}` |
| `getIsInvoicePartiallyPaid` | `GET` | `/Invoice/{invoiceId}/getIsPartiallyPaid` |
| `invoiceGetPdf` | `GET` | `/Invoice/{invoiceId}/getPdf` |
| `getInvoicePositionsById` | `GET` | `/Invoice/{invoiceId}/getPositions` |
| `invoiceGetXml` | `GET` | `/Invoice/{invoiceId}/getXml` |
| `cancelInvoice` | `POST` | `/Invoice/{invoiceId}/cancelInvoice` |
| `invoiceRender` | `POST` | `/Invoice/{invoiceId}/render` |
| `sendInvoiceViaEMail` | `POST` | `/Invoice/{invoiceId}/sendViaEmail` |
| `createInvoiceFromOrder` | `POST` | `/Invoice/Factory/createInvoiceFromOrder` |
| `createInvoiceReminder` | `POST` | `/Invoice/Factory/createInvoiceReminder` |
| `createInvoiceByFactory` | `POST` | `/Invoice/Factory/saveInvoice` |
| `bookInvoice` | `PUT` | `/Invoice/{invoiceId}/bookAmount` |
| `invoiceEnshrine` | `PUT` | `/Invoice/{invoiceId}/enshrine` |
| `invoiceResetToDraft` | `PUT` | `/Invoice/{invoiceId}/resetToDraft` |
| `invoiceResetToOpen` | `PUT` | `/Invoice/{invoiceId}/resetToOpen` |
| `invoiceSendBy` | `PUT` | `/Invoice/{invoiceId}/sendBy` |

## InvoicePos (1)

| operationId | method | path |
|---|---|---|
| `getInvoicePos` | `GET` | `/InvoicePos` |

## Layout (5)

| operationId | method | path |
|---|---|---|
| `getLetterpapersWithThumb` | `GET` | `/DocServer/getLetterpapersWithThumb` |
| `getTemplates` | `GET` | `/DocServer/getTemplatesWithThumb` |
| `updateCreditNoteTemplate` | `PUT` | `/CreditNote/{creditNoteId}/changeParameter` |
| `updateInvoiceTemplate` | `PUT` | `/Invoice/{invoiceId}/changeParameter` |
| `updateOrderTemplate` | `PUT` | `/Order/{orderId}/changeParameter` |

## Order (13)

| operationId | method | path |
|---|---|---|
| `deleteOrder` | `DELETE` | `/Order/{orderId}` |
| `getOrders` | `GET` | `/Order` |
| `getOrderById` | `GET` | `/Order/{orderId}` |
| `getDiscounts` | `GET` | `/Order/{orderId}/getDiscounts` |
| `orderGetPdf` | `GET` | `/Order/{orderId}/getPdf` |
| `getOrderPositionsById` | `GET` | `/Order/{orderId}/getPositions` |
| `getRelatedObjects` | `GET` | `/Order/{orderId}/getRelatedObjects` |
| `sendorderViaEMail` | `POST` | `/Order/{orderId}/sendViaEmail` |
| `createContractNoteFromOrder` | `POST` | `/Order/Factory/createContractNoteFromOrder` |
| `createPackingListFromOrder` | `POST` | `/Order/Factory/createPackingListFromOrder` |
| `createOrder` | `POST` | `/Order/Factory/saveOrder` |
| `updateOrder` | `PUT` | `/Order/{orderId}` |
| `orderSendBy` | `PUT` | `/Order/{orderId}/sendBy` |

## OrderPos (4)

| operationId | method | path |
|---|---|---|
| `deleteOrderPos` | `DELETE` | `/OrderPos/{orderPosId}` |
| `getOrderPositions` | `GET` | `/OrderPos` |
| `getOrderPositionById` | `GET` | `/OrderPos/{orderPosId}` |
| `updateOrderPosition` | `PUT` | `/OrderPos/{orderPosId}` |

## Part (5)

| operationId | method | path |
|---|---|---|
| `getParts` | `GET` | `/Part` |
| `getPartById` | `GET` | `/Part/{partId}` |
| `partGetStock` | `GET` | `/Part/{partId}/getStock` |
| `createPart` | `POST` | `/Part` |
| `updatePart` | `PUT` | `/Part/{partId}` |

## PrivateTransactionRule (3)

| operationId | method | path |
|---|---|---|
| `deletePrivateTransactionRule` | `DELETE` | `/PrivateTransactionRule/{id}` |
| `listPrivateTransactionRules` | `GET` | `/PrivateTransactionRule` |
| `createPrivateTransactionRule` | `POST` | `/PrivateTransactionRule` |

## Report (4)

| operationId | method | path |
|---|---|---|
| `reportContact` | `GET` | `/Report/contactlist` |
| `reportInvoice` | `GET` | `/Report/invoicelist` |
| `reportOrder` | `GET` | `/Report/orderlist` |
| `reportVoucher` | `GET` | `/Report/voucherlist` |

## Tag (6)

| operationId | method | path |
|---|---|---|
| `deleteTag` | `DELETE` | `/Tag/{tagId}` |
| `getTags` | `GET` | `/Tag` |
| `getTagById` | `GET` | `/Tag/{tagId}` |
| `getTagRelations` | `GET` | `/TagRelation` |
| `createTag` | `POST` | `/Tag/Factory/create` |
| `updateTag` | `PUT` | `/Tag/{tagId}` |

## Voucher (14)

| operationId | method | path |
|---|---|---|
| `forAccountNumber` | `GET` | `/ReceiptGuidance/forAccountNumber` |
| `forAllAccounts` | `GET` | `/ReceiptGuidance/forAllAccounts` |
| `forExpense` | `GET` | `/ReceiptGuidance/forExpense` |
| `forRevenue` | `GET` | `/ReceiptGuidance/forRevenue` |
| `forTaxRule` | `GET` | `/ReceiptGuidance/forTaxRule` |
| `getVouchers` | `GET` | `/Voucher` |
| `getVoucherById` | `GET` | `/Voucher/{voucherId}` |
| `voucherFactorySaveVoucher` | `POST` | `/Voucher/Factory/saveVoucher` |
| `voucherUploadFile` | `POST` | `/Voucher/Factory/uploadTempFile` |
| `updateVoucher` | `PUT` | `/Voucher/{voucherId}` |
| `bookVoucher` | `PUT` | `/Voucher/{voucherId}/bookAmount` |
| `voucherEnshrine` | `PUT` | `/Voucher/{voucherId}/enshrine` |
| `voucherResetToDraft` | `PUT` | `/Voucher/{voucherId}/resetToDraft` |
| `voucherResetToOpen` | `PUT` | `/Voucher/{voucherId}/resetToOpen` |

## VoucherPos (1)

| operationId | method | path |
|---|---|---|
| `getVoucherPositions` | `GET` | `/VoucherPos` |

