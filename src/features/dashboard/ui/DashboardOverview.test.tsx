import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { saveSavedView } from "../../views/application/savedViews";
import { DashboardOverview } from "./DashboardOverview";

const baseDocument: InvoiceDocument = {
  id: "doc-1",
  contentHash: "hash-1",
  fileName: "parsed.pdf",
  fileSize: 10,
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
  invoiceDate: "2026-03-31",
  totalAmount: 100,
  taxAmount: 10,
  amountWithoutTax: 90,
  buyerName: "Northwind",
  sellerName: "Contoso",
  items: [],
  tags: [],
  annotation: "",
  uploader: "",
  owner: "",
  sourceType: "ocr",
  edited: false,
  createdAt: "2026-03-31T00:00:00.000Z",
  updatedAt: "2026-03-31T02:00:00.000Z",
};

function buildRows(): InvoiceDocument[] {
  return [
    baseDocument,
    {
      ...baseDocument,
      id: "doc-2",
      fileName: "needs-review.pdf",
      invoiceNumber: "INV-002",
      parseStatus: "idle",
      conflictStatus: "none",
      totalAmount: 250,
      updatedAt: "2026-03-31T01:00:00.000Z",
    },
  ];
}

describe("DashboardOverview", () => {
  beforeEach(async () => {
    await appDb.invoiceDocuments.clear();
    await appDb.savedViews.clear();
    await appDb.settings.clear();
  });

  afterEach(async () => {
    cleanup();
  });

  it("uses the built-in default view when there are no saved views", async () => {
    render(<DashboardOverview invoiceDocuments={buildRows()} message="已加载" />);

    expect(await screen.findByTestId("overview-total-invoices")).toHaveTextContent("2");
    expect(screen.getByTestId("overview-needs-review")).toHaveTextContent("1");
    expect(screen.getByTestId("overview-recent-file")).toHaveTextContent("parsed.pdf");
    expect(screen.getByTestId("overview-recent-invoice")).toHaveTextContent("INV-001");
    expect(screen.getByRole("combobox", { name: "当前视图" })).toHaveValue("");
  });

  it("applies the active dashboard saved view to the overview summary", async () => {
    const view = await saveSavedView({
      scope: "invoices",
      name: "已识别发票",
      isDefault: true,
      query: {
        scope: "invoices",
        searchText: "",
        status: "parsed",
        tag: "",
        tagGroupId: "",
        ruleId: "",
        sortBy: "updatedAt",
        sortDirection: "desc",
      },
      visibleColumns: ["invoiceNumber"],
      now: () => "2026-03-31T12:00:00.000Z",
    });

    render(<DashboardOverview invoiceDocuments={buildRows()} message="已加载" />);

    await waitFor(() => expect(screen.getByRole("combobox", { name: "当前视图" })).toHaveValue(view.id));
    expect(screen.getByTestId("overview-total-invoices")).toHaveTextContent("1");
    expect(screen.getByTestId("overview-needs-review")).toHaveTextContent("0");
    expect(screen.getByTestId("overview-recent-file")).toHaveTextContent("parsed.pdf");
    expect(screen.getByTestId("overview-recent-invoice")).toHaveTextContent("INV-001");
  });

  it("persists the selected dashboard view id", async () => {
    const view = await saveSavedView({
      scope: "invoices",
      name: "待处理发票",
      isDefault: false,
      query: {
        scope: "invoices",
        searchText: "",
        status: "needs_attention",
        tag: "",
        tagGroupId: "",
        ruleId: "",
        sortBy: "updatedAt",
        sortDirection: "desc",
      },
      visibleColumns: ["invoiceNumber"],
      now: () => "2026-03-31T12:00:00.000Z",
    });

    render(<DashboardOverview invoiceDocuments={buildRows()} message="已加载" />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByRole("option", { name: "待处理发票" })).toBeInTheDocument());
    await user.selectOptions(screen.getByRole("combobox", { name: "当前视图" }), view.id);

    await waitFor(async () => {
      expect((await appDb.settings.get("ui.dashboardInvoiceViewId"))?.value).toBe(view.id);
    });
    expect(screen.getByTestId("overview-total-invoices")).toHaveTextContent("1");
  });
});
