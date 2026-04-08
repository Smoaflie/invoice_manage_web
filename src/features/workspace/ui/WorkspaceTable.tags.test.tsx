import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import type { ReferenceWorkspaceGroup } from "../application/referenceWorkspaceModel";
import { buildWorkspaceRowStates } from "../application/workspaceRowState";
import { WorkspaceTable } from "./WorkspaceTable";

const rows: InvoiceDocument[] = [
  {
    id: "doc-1",
    contentHash: "hash-1",
    fileName: "demo.pdf",
    fileSize: 10,
    lastModified: 1,
    handleRef: "handle-1",
    bindingStatus: "readable",
    bindingErrorType: null,
    ocrVendor: "baidu",
    ocrParsedAt: "2026-03-31T00:00:00.000Z",
    parseStatus: "parsed",
    conflictStatus: "none",
    conflictMessage: "",
    invoiceNumber: "INV-001",
    invoiceCode: "CODE-001",
    invoiceDate: "2026-03-30",
    totalAmount: 100,
    taxAmount: 10,
    amountWithoutTax: 90,
    buyerName: "购买方",
    sellerName: "销售方",
    items: [],
    tags: ["待报销", "差旅交通", "项目A"],
    remark: "",
    annotation: "",
    uploader: "",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "2026-03-31T00:00:00.000Z",
    updatedAt: "2026-03-31T00:00:00.000Z",
  },
];

const fields: WorkspaceFieldDefinition[] = [
  { id: "invoiceNumber", label: "发票号码", source: "builtin", type: "string", options: [], visible: true, width: 180, editable: true },
  { id: "tags", label: "标签", source: "builtin", type: "multi_select", options: [], visible: true, width: 160, editable: true },
];

function mockCanvasTextMeasurement() {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () =>
      ({
        measureText(text: string) {
          const width = [...text].reduce((sum, char) => sum + (/[\u0000-\u00ff]/u.test(char) ? 6 : 10), 0);
          return { width } as TextMetrics;
        },
      }) as CanvasRenderingContext2D,
  );
}

function renderWorkspaceTable(groups: ReferenceWorkspaceGroup[]) {
  return render(
    <WorkspaceTable
      allSelected={false}
      groups={groups}
      expandedGroupIds={["all"]}
      fields={fields}
      fieldOrder={["invoiceNumber", "tags"]}
      recordColumnWidths={{ invoiceNumber: 180, tags: 160 }}
      itemColumnWidths={{ name: 160 }}
      tableColumnWidths={{ itemDetails: 120, actions: 286 }}
      selectedIdSet={new Set()}
      onToggleSelected={() => {}}
      onToggleAll={() => {}}
      onOpenDetails={() => {}}
      onEdit={() => {}}
      onOpenPdf={() => {}}
      onDelete={() => {}}
      onReparse={() => {}}
      onToggleGroup={() => {}}
      onRecordColumnWidthsChange={() => {}}
      onItemColumnWidthsChange={() => {}}
      onTableColumnWidthsChange={() => {}}
    />,
  );
}

describe("WorkspaceTable tags column", () => {
  test("renders the tags column and opens the full tag menu from the table cell", async () => {
    mockCanvasTextMeasurement();
    const user = userEvent.setup();
    const rowStates = buildWorkspaceRowStates(rows, fields);
    const groups: ReferenceWorkspaceGroup[] = [{ id: "all", name: "全部记录", rows: rowStates }];

    renderWorkspaceTable(groups);

    expect(screen.getByText("标签")).toBeInTheDocument();

    const trigger = screen.getByRole("button", { name: "标签" });
    await user.click(trigger);

    const menu = screen.getByRole("menu", { name: "标签" });
    expect(within(menu).getByText("待报销")).toBeInTheDocument();
    expect(within(menu).getByText("差旅交通")).toBeInTheDocument();
    expect(within(menu).getByText("项目A")).toBeInTheDocument();
  });
});
