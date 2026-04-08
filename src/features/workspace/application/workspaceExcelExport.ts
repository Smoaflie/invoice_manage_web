import { Workbook, type Alignment, type CellValue, type Column } from "exceljs";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { formatDisplayDateTime } from "../../../shared/time/formatDisplayTime";
import { getWorkspaceFieldValue } from "./workspaceValueResolver";

type WorkspaceExcelExportInput = {
  invoiceDocuments: InvoiceDocument[];
  fields: WorkspaceFieldDefinition[];
  now?: () => Date;
};

export type WorkspaceExcelExportFile = {
  filename: string;
  mimeType: string;
  content: Uint8Array;
};

type ExportColumnKind = "text" | "timestamp" | "currency";

type ExportColumn = {
  id: string;
  label: string;
  kind: ExportColumnKind;
  width: number;
  pickValue: (row: InvoiceDocument) => unknown;
};

const MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const TEXT_NUMBER_FORMAT = "@";
const CURRENCY_NUMBER_FORMAT = "0.00";
const TEXT_ALIGNMENT: Partial<Alignment> = { vertical: "top", wrapText: true };
const NUMBER_ALIGNMENT: Partial<Alignment> = { vertical: "top" };
const TIMESTAMP_COLUMN_IDS = new Set(["lastModified", "ocrParsedAt", "createdAt", "updatedAt"]);
const CURRENCY_COLUMN_IDS = new Set(["amountWithoutTax", "taxAmount", "totalAmount"]);
const EXTRA_EXPORT_COLUMNS: ExportColumn[] = [
  { id: "id", label: "记录ID", kind: "text", width: 18, pickValue: (row) => row.id },
  { id: "contentHash", label: "内容哈希", kind: "text", width: 22, pickValue: (row) => row.contentHash },
  { id: "fileSize", label: "文件大小", kind: "text", width: 14, pickValue: (row) => row.fileSize },
  { id: "lastModified", label: "最后修改时间戳", kind: "timestamp", width: 18, pickValue: (row) => row.lastModified },
  { id: "relativePath", label: "相对路径", kind: "text", width: 24, pickValue: (row) => row.relativePath ?? "" },
  { id: "proofFiles", label: "证明文件", kind: "text", width: 24, pickValue: (row) => row.proofFiles ?? [] },
  { id: "handleRef", label: "文件句柄", kind: "text", width: 18, pickValue: (row) => row.handleRef },
  { id: "bindingErrorType", label: "绑定错误", kind: "text", width: 16, pickValue: (row) => row.bindingErrorType ?? "" },
  { id: "collaborationStatus", label: "协作状态", kind: "text", width: 16, pickValue: (row) => row.collaborationStatus ?? "" },
  { id: "reviewStatus", label: "审核状态", kind: "text", width: 16, pickValue: (row) => row.reviewStatus ?? "" },
  { id: "submittedBy", label: "提交人", kind: "text", width: 16, pickValue: (row) => row.submittedBy ?? "" },
  { id: "receivedBy", label: "接收人", kind: "text", width: 16, pickValue: (row) => row.receivedBy ?? "" },
  { id: "beneficiary", label: "受益人", kind: "text", width: 16, pickValue: (row) => row.beneficiary ?? "" },
  { id: "lastSubmissionId", label: "最近提交批次", kind: "text", width: 18, pickValue: (row) => row.lastSubmissionId ?? "" },
];

function buildFilename(now: Date) {
  return `invoice-workspace-${now.toISOString().replace(/[:.]/gu, "-")}.xlsx`;
}

function normalizeTextValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean).join("\n");
  }

  return String(value ?? "").trim();
}

function toReadableDateTime(value: unknown) {
  return formatDisplayDateTime(value);
}

function toCurrencyValue(value: unknown): number | string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return "";
    }
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return "";
}

function toWorksheetColumns(columns: ExportColumn[]): Partial<Column>[] {
  const worksheetColumns: Partial<Column>[] = [];

  for (const column of columns) {
    worksheetColumns.push({
      key: column.id,
      header: column.label,
      width: column.width,
      style:
        column.kind === "currency"
          ? {
              numFmt: CURRENCY_NUMBER_FORMAT,
              alignment: NUMBER_ALIGNMENT,
            }
          : {
              numFmt: TEXT_NUMBER_FORMAT,
              alignment: TEXT_ALIGNMENT,
            },
    });

    if (column.kind === "timestamp") {
      worksheetColumns.push({
        key: `${column.id}:readable`,
        header: `${column.label}(易读)`,
        width: 14,
        style: {
          numFmt: TEXT_NUMBER_FORMAT,
          alignment: TEXT_ALIGNMENT,
        },
      });
    }
  }

  return worksheetColumns;
}

function buildRowValues(row: InvoiceDocument, columns: ExportColumn[]) {
  return columns.reduce<Record<string, CellValue>>((accumulator, column) => {
    const rawValue = column.pickValue(row);

    if (column.kind === "currency") {
      accumulator[column.id] = toCurrencyValue(rawValue);
      return accumulator;
    }

    accumulator[column.id] = normalizeTextValue(rawValue);
    if (column.kind === "timestamp") {
      accumulator[`${column.id}:readable`] = toReadableDateTime(rawValue);
    }
    return accumulator;
  }, {});
}

function buildColumns(fields: WorkspaceFieldDefinition[]) {
  const workspaceColumns: ExportColumn[] = fields.map((field) => ({
    id: field.id,
    label: field.label,
    kind: TIMESTAMP_COLUMN_IDS.has(field.id) ? "timestamp" : CURRENCY_COLUMN_IDS.has(field.id) ? "currency" : "text",
    width: Math.min(Math.max(Math.round(field.width / 12), 12), 40),
    pickValue: (row) => getWorkspaceFieldValue(row, field),
  }));

  return [...EXTRA_EXPORT_COLUMNS, ...workspaceColumns];
}

function styleHeaderRow(workbook: Workbook) {
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    return;
  }

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", wrapText: true };
}

export async function buildWorkspaceExcelExport(input: WorkspaceExcelExportInput): Promise<WorkspaceExcelExportFile> {
  const now = input.now?.() ?? new Date();
  const columns = buildColumns(input.fields);
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet("发票导出");

  worksheet.columns = toWorksheetColumns(columns);
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length },
  };

  for (const row of input.invoiceDocuments) {
    worksheet.addRow(buildRowValues(row, columns));
  }

  styleHeaderRow(workbook);

  const buffer = await workbook.xlsx.writeBuffer();

  return {
    filename: buildFilename(now),
    mimeType: MIME_TYPE,
    content: buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer),
  };
}

export function triggerWorkspaceExcelDownload(file: WorkspaceExcelExportFile) {
  const blob = new Blob([file.content], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = file.filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
