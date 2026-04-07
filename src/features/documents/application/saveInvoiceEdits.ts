import { appDb } from "../../../shared/db/appDb";
import type { InvoiceAuditChangeType, InvoiceAuditLog } from "../../../shared/types/invoiceAuditLog";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

interface BuildAuditEntriesInput {
  invoiceDocumentId: string;
  before: Partial<InvoiceDocument>;
  after: Partial<InvoiceDocument>;
  changeType: InvoiceAuditChangeType;
  changedAt: string;
}

interface SaveInvoiceEditsInput {
  invoiceDocumentId: string;
  nextValues: Partial<InvoiceDocument>;
  changeType: InvoiceAuditChangeType;
  now: () => string;
}

const NON_AUDIT_FIELDS = new Set<keyof InvoiceDocument>(["edited", "updatedAt"]);

function serializeValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return typeof value === "string" ? value : JSON.stringify(value);
}

export function buildAuditEntries(input: BuildAuditEntriesInput): InvoiceAuditLog[] {
  const changedKeys = Object.keys(input.after).filter((key) => {
    if (NON_AUDIT_FIELDS.has(key as keyof InvoiceDocument)) {
      return false;
    }

    const beforeValue = serializeValue(input.before[key as keyof InvoiceDocument]);
    const afterValue = serializeValue(input.after[key as keyof InvoiceDocument]);
    return beforeValue !== afterValue;
  });

  return changedKeys.map((key) => ({
    id: globalThis.crypto.randomUUID(),
    invoiceDocumentId: input.invoiceDocumentId,
    changedAt: input.changedAt,
    changeType: input.changeType,
    targetField: key,
    beforeValue: serializeValue(input.before[key as keyof InvoiceDocument]),
    afterValue: serializeValue(input.after[key as keyof InvoiceDocument]),
  }));
}

export async function saveInvoiceEdits(input: SaveInvoiceEditsInput): Promise<InvoiceDocument> {
  const current = await appDb.invoiceDocuments.get(input.invoiceDocumentId);

  if (!current) {
    throw new Error(`Invoice document not found: ${input.invoiceDocumentId}`);
  }

  const timestamp = input.now();
  const shouldMarkEdited = input.changeType !== "manual_create" && current.sourceType !== "manual";
  const nextDocument: InvoiceDocument = {
    ...current,
    ...input.nextValues,
    edited: shouldMarkEdited ? true : current.edited,
    updatedAt: timestamp,
  };

  const auditEntries = buildAuditEntries({
    invoiceDocumentId: input.invoiceDocumentId,
    before: current,
    after: nextDocument,
    changeType: input.changeType,
    changedAt: timestamp,
  });

  await appDb.transaction("rw", appDb.invoiceDocuments, appDb.invoiceAuditLogs, async () => {
    await appDb.invoiceDocuments.put(nextDocument);

    if (auditEntries.length > 0) {
      await appDb.invoiceAuditLogs.bulkAdd(auditEntries);
    }
  });

  return nextDocument;
}
