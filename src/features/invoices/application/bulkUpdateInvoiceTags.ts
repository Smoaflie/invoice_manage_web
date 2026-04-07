import { appDb } from "../../../shared/db/appDb";
import type { InvoiceAuditLog } from "../../../shared/types/invoiceAuditLog";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

type BulkTagMode = "add" | "remove";

type BulkUpdateInvoiceTagsInput = {
  invoiceDocumentIds: string[];
  tagsText: string;
  mode: BulkTagMode;
  now: () => string;
};

function parseBulkTags(tagsText: string) {
  return [...new Set(tagsText.split(/\s+/).map((tag) => tag.trim()).filter(Boolean))];
}

function buildNextTags(currentTags: string[], tags: string[], mode: BulkTagMode) {
  if (mode === "add") {
    return [...new Set([...currentTags, ...tags])];
  }

  return currentTags.filter((tag) => !tags.includes(tag));
}

function buildTagAuditLog(document: InvoiceDocument, nextTags: string[], changedAt: string): InvoiceAuditLog {
  return {
    id: globalThis.crypto.randomUUID(),
    invoiceDocumentId: document.id,
    changedAt,
    changeType: "manual_tag_update",
    targetField: "tags",
    beforeValue: JSON.stringify(document.tags),
    afterValue: JSON.stringify(nextTags),
  };
}

export async function bulkUpdateInvoiceTags(input: BulkUpdateInvoiceTagsInput) {
  const tags = parseBulkTags(input.tagsText);
  if (input.invoiceDocumentIds.length === 0 || tags.length === 0) {
    return { updatedCount: 0 };
  }

  const documents = (await appDb.invoiceDocuments.bulkGet(input.invoiceDocumentIds)).filter(Boolean) as InvoiceDocument[];
  const changedAt = input.now();
  const nextDocuments = documents
    .map((document) => {
      const nextTags = buildNextTags(document.tags, tags, input.mode);
      if (JSON.stringify(nextTags) === JSON.stringify(document.tags)) {
        return null;
      }

      return {
        document: {
          ...document,
          tags: nextTags,
          updatedAt: changedAt,
        },
        auditLog: buildTagAuditLog(document, nextTags, changedAt),
      };
    })
    .filter(Boolean) as Array<{ document: InvoiceDocument; auditLog: InvoiceAuditLog }>;

  if (nextDocuments.length === 0) {
    return { updatedCount: 0 };
  }

  await appDb.transaction("rw", appDb.invoiceDocuments, appDb.invoiceAuditLogs, async () => {
    await appDb.invoiceDocuments.bulkPut(nextDocuments.map((item) => item.document));
    await appDb.invoiceAuditLogs.bulkAdd(nextDocuments.map((item) => item.auditLog));
  });

  return { updatedCount: nextDocuments.length };
}
