import { appDb } from "../../../shared/db/appDb";

export async function deleteInvoiceDocuments(invoiceDocumentIds: string[]) {
  if (invoiceDocumentIds.length === 0) {
    return;
  }

  const documents = await appDb.invoiceDocuments.bulkGet(invoiceDocumentIds);
  const handleRefs = documents
    .flatMap((document) => (document?.handleRef ? [document.handleRef] : []))
    .filter((handleRef, index, values) => values.indexOf(handleRef) === index);
  const remainingDocuments = await appDb.invoiceDocuments.toArray();
  const orphanedHandleRefs = handleRefs.filter(
    (handleRef) => !remainingDocuments.some((document) => !invoiceDocumentIds.includes(document.id) && document.handleRef === handleRef),
  );

  await appDb.transaction("rw", appDb.invoiceDocuments, appDb.invoiceAuditLogs, appDb.fileHandles, async () => {
    await appDb.invoiceDocuments.bulkDelete(invoiceDocumentIds);

    await Promise.all([
      ...invoiceDocumentIds.map((invoiceDocumentId) => appDb.invoiceAuditLogs.where("invoiceDocumentId").equals(invoiceDocumentId).delete()),
      ...orphanedHandleRefs.map((handleRef) => appDb.fileHandles.delete(handleRef)),
    ]);
  });
}
