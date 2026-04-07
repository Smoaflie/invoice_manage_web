import { appDb } from "../../../shared/db/appDb";
import type { ConflictStatus } from "../../../shared/types/invoiceDocument";

export interface DetectConflictsResult {
  status: ConflictStatus;
}

async function loadConflictGroup(invoiceNumber: string) {
  const normalizedInvoiceNumber = invoiceNumber.trim();

  if (!normalizedInvoiceNumber) {
    const records = (await appDb.invoiceDocuments.toArray()).filter(
      (record) => record.invoiceNumber.trim() === "",
    );

    return { records, status: "none" as ConflictStatus };
  }

  const records = await appDb.invoiceDocuments.where("invoiceNumber").equals(invoiceNumber).toArray();

  if (records.length === 0) {
    return { records, status: "none" as ConflictStatus };
  }

  const contentHashes = new Set(records.map((entry) => entry.contentHash));
  const status: ConflictStatus = contentHashes.size > 1 ? "same_number_diff_hash" : "none";

  return { records, status };
}

async function persistGroup(
  records: Awaited<ReturnType<typeof loadConflictGroup>>["records"],
  status: ConflictStatus,
  invoiceNumber: string,
) {
  const conflictMessage =
    status === "same_number_diff_hash"
      ? `发票号码 ${invoiceNumber} 被多个内容不同的文件共同使用。`
      : "";
  const updatedAt = new Date().toISOString();

  await appDb.transaction("rw", appDb.invoiceDocuments, async () => {
    await Promise.all(
      records.map((record) =>
        appDb.invoiceDocuments.update(record.id, {
          conflictStatus: status,
          conflictMessage,
          updatedAt,
        }),
      ),
    );
  });
}

async function recomputeConflictGroup(invoiceNumber: string) {
  const group = await loadConflictGroup(invoiceNumber);
  await persistGroup(group.records, group.status, invoiceNumber);
  return group.status;
}

export async function detectConflicts(
  invoiceNumber: string,
  previousInvoiceNumber?: string,
): Promise<DetectConflictsResult> {
  const status = await recomputeConflictGroup(invoiceNumber);

  if (
    previousInvoiceNumber !== undefined &&
    previousInvoiceNumber.trim() !== invoiceNumber.trim()
  ) {
    await recomputeConflictGroup(previousInvoiceNumber);
  }

  return { status };
}
