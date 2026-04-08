import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

export type InvoiceBundleNamingMode = "invoice_number" | "total_amount";

export type InvoicePdfExportErrorDetails = {
  conflictFileNames: string[];
  unresolvedFileNames: string[];
  missingPdfFileNames: string[];
  missingInvoiceNumberFileNames: string[];
};

export type PreparedInvoicePdfExportEntry = {
  document: InvoiceDocument;
  file: File;
  bundleFileName?: string;
};

export class InvoicePdfExportError extends Error {
  readonly details: InvoicePdfExportErrorDetails;

  constructor(details: InvoicePdfExportErrorDetails) {
    super(buildInvoicePdfExportErrorMessage(details));
    this.name = "InvoicePdfExportError";
    this.details = details;
  }
}

type PrepareInvoicePdfExportInput = {
  loadFile: (invoiceDocumentId: string) => Promise<File>;
  bundleNamingMode?: InvoiceBundleNamingMode;
};

function buildInvoicePdfExportErrorMessage(details: InvoicePdfExportErrorDetails) {
  const lines: string[] = [];

  if (details.conflictFileNames.length > 0) {
    lines.push(`以下发票存在冲突，禁止导出：${details.conflictFileNames.join("、")}`);
  }

  if (details.unresolvedFileNames.length > 0) {
    lines.push(`以下发票未解析且未编辑，禁止导出：${details.unresolvedFileNames.join("、")}`);
  }

  if (details.missingPdfFileNames.length > 0) {
    lines.push(`以下发票缺少可读 PDF 文件，禁止导出：${details.missingPdfFileNames.join("、")}`);
  }

  if (details.missingInvoiceNumberFileNames.length > 0) {
    lines.push(`以下发票缺少发票号码，禁止按发票号码命名导出：${details.missingInvoiceNumberFileNames.join("、")}`);
  }

  return lines.join("\n");
}

function createEmptyDetails(): InvoicePdfExportErrorDetails {
  return {
    conflictFileNames: [],
    unresolvedFileNames: [],
    missingPdfFileNames: [],
    missingInvoiceNumberFileNames: [],
  };
}

function hasBlockingIssues(details: InvoicePdfExportErrorDetails) {
  return Object.values(details).some((items) => items.length > 0);
}

function sanitizeFileStem(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim();
}

function buildBundleFileNames(rows: InvoiceDocument[], bundleNamingMode: InvoiceBundleNamingMode) {
  const counts = new Map<string, number>();

  return rows.map((row) => {
    const baseName = bundleNamingMode === "invoice_number" ? row.invoiceNumber.trim() : String(row.totalAmount);
    const safeBaseName = sanitizeFileStem(baseName);
    const nextCount = (counts.get(safeBaseName) ?? 0) + 1;
    counts.set(safeBaseName, nextCount);
    const suffix = nextCount === 1 ? "" : `_${nextCount}`;

    return `${safeBaseName}${suffix}.pdf`;
  });
}

export async function prepareInvoicePdfExport(rows: InvoiceDocument[], input: PrepareInvoicePdfExportInput): Promise<{ entries: PreparedInvoicePdfExportEntry[] }> {
  const details = createEmptyDetails();

  for (const row of rows) {
    if (row.conflictStatus !== "none") {
      details.conflictFileNames.push(row.fileName);
    }

    if (row.parseStatus !== "parsed" && !row.edited) {
      details.unresolvedFileNames.push(row.fileName);
    }

    if (input.bundleNamingMode === "invoice_number" && row.invoiceNumber.trim().length === 0) {
      details.missingInvoiceNumberFileNames.push(row.fileName);
    }
  }

  if (hasBlockingIssues(details)) {
    throw new InvoicePdfExportError(details);
  }

  const loadedEntries = await Promise.all(
    rows.map(async (row) => {
      try {
        return {
          document: row,
          file: await input.loadFile(row.id),
        };
      } catch {
        details.missingPdfFileNames.push(row.fileName);
        return null;
      }
    }),
  );

  if (details.missingPdfFileNames.length > 0) {
    throw new InvoicePdfExportError(details);
  }

  const bundleFileNames = input.bundleNamingMode ? buildBundleFileNames(rows, input.bundleNamingMode) : [];

  return {
    entries: loadedEntries
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .map((entry, index) => ({
        ...entry,
        bundleFileName: input.bundleNamingMode ? bundleFileNames[index] : undefined,
      })),
  };
}
