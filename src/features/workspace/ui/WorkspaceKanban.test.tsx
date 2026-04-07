import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { buildWorkspaceRowStates } from "../application/workspaceRowState";
import { WorkspaceKanban } from "./WorkspaceKanban";

const fields: WorkspaceFieldDefinition[] = [
  { id: "parseStatus", label: "识别状态", source: "builtin", type: "string", options: ["parsed", "needs_reparse"], visible: true, width: 120, editable: false },
];

const rows: InvoiceDocument[] = [
  {
    id: "doc-1",
    contentHash: "hash-1",
    fileName: "a.pdf",
    fileSize: 1,
    lastModified: 1,
    handleRef: "handle-1",
    bindingStatus: "readable",
    bindingErrorType: null,
    ocrVendor: null,
    ocrParsedAt: null,
    parseStatus: "parsed",
    conflictStatus: "none",
    conflictMessage: "",
    invoiceNumber: "INV-001",
    invoiceCode: "",
    invoiceDate: "",
    totalAmount: 100,
    taxAmount: 10,
    amountWithoutTax: 90,
    buyerName: "",
    sellerName: "",
    items: [],
    tags: [],
    annotation: "",
    uploader: "",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "",
    updatedAt: "",
  },
];

const rowStates = buildWorkspaceRowStates(rows, fields);

describe("WorkspaceKanban", () => {
  test("renders kanban columns and cards", () => {
    render(
      <WorkspaceKanban
        rowStates={rowStates}
        fields={fields}
        fieldId="parseStatus"
        emptyState={{
          tone: "empty",
          title: "当前看板没有可展示的记录",
          description: "先导入记录。",
          bullets: ["看板只负责按字段分列。"],
        }}
        onOpenDetails={() => {}}
      />,
    );

    expect(screen.getByText("parsed")).toBeInTheDocument();
    expect(screen.getByText("a.pdf")).toBeInTheDocument();
  });

  test("renders the shared empty state when there are no rows", () => {
    render(
      <WorkspaceKanban
        rowStates={[]}
        fields={fields}
        fieldId="parseStatus"
        emptyState={{
          tone: "empty",
          title: "当前看板没有可展示的记录",
          description: "先导入记录。",
          bullets: ["看板只负责按字段分列。"],
        }}
        onOpenDetails={() => {}}
      />,
    );

    expect(screen.getByTestId("workspace-empty-state")).toBeInTheDocument();
    expect(screen.getByText("当前看板没有可展示的记录")).toBeInTheDocument();
  });
});
