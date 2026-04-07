import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { DashboardDocument } from "../../../shared/types/dashboardDocument";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { buildWorkspaceRowStates } from "../application/workspaceRowState";
import { WorkspaceDashboard } from "./WorkspaceDashboard";

const fields: WorkspaceFieldDefinition[] = [{ id: "uploader", label: "上传者", source: "builtin", type: "string", options: [], visible: true, width: 160, editable: true }];

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
    buyerName: "Buyer A",
    sellerName: "Seller A",
    items: [],
    tags: ["已报销"],
    remark: "",
    annotation: "",
    uploader: "Alice",
    owner: "",
    beneficiary: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "",
    updatedAt: "",
    collaborationStatus: "local_only",
    reviewStatus: "not_required",
    submittedBy: "",
    receivedBy: "",
    lastSubmissionId: null,
  },
  {
    id: "doc-2",
    contentHash: "hash-2",
    fileName: "b.pdf",
    fileSize: 1,
    lastModified: 1,
    handleRef: "handle-2",
    bindingStatus: "readable",
    bindingErrorType: null,
    ocrVendor: null,
    ocrParsedAt: null,
    parseStatus: "parsed",
    conflictStatus: "none",
    conflictMessage: "",
    invoiceNumber: "INV-002",
    invoiceCode: "",
    invoiceDate: "",
    totalAmount: 200,
    taxAmount: 20,
    amountWithoutTax: 180,
    buyerName: "Buyer B",
    sellerName: "Seller B",
    items: [],
    tags: ["已报销"],
    remark: "",
    annotation: "",
    uploader: "Bob",
    owner: "",
    beneficiary: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "",
    updatedAt: "",
    collaborationStatus: "local_only",
    reviewStatus: "not_required",
    submittedBy: "",
    receivedBy: "",
    lastSubmissionId: null,
  },
];

const dashboardDocument: DashboardDocument = {
  id: "primary",
  createdAt: "2026-04-04T00:00:00.000Z",
  updatedAt: "2026-04-04T00:00:00.000Z",
  widgets: [
    { id: "metric-1", type: "metric", title: "已报销", metrics: ["row_count", "total_amount"], conditions: { id: "root-metric", kind: "group", mode: "all", children: [] } },
    { id: "bar-1", type: "bar_chart", title: "按上传者", groupByFieldId: "uploader", valueMetric: "total_amount", conditions: { id: "root-bar", kind: "group", mode: "all", children: [] } },
    { id: "pie-1", type: "pie_chart", title: "金额占比", mode: "group_by_field", groupByFieldId: "uploader", valueMetric: "total_amount", conditions: { id: "root-pie", kind: "group", mode: "all", children: [] } },
    { id: "kanban-1", type: "kanban", title: "处理看板", fieldId: "uploader", conditions: { id: "root-kanban", kind: "group", mode: "all", children: [] } },
  ],
  layout: [
    { widgetId: "metric-1", colSpan: 1, rowSpan: 1, order: 1 },
    { widgetId: "bar-1", colSpan: 2, rowSpan: 1, order: 2 },
    { widgetId: "pie-1", colSpan: 1, rowSpan: 1, order: 3 },
    { widgetId: "kanban-1", colSpan: 2, rowSpan: 2, order: 4 },
  ],
};

function dispatchPointerEvent(target: EventTarget, type: string, clientX: number, clientY: number, pointerId = 1) {
  const event = new Event(type, { bubbles: true }) as PointerEvent;
  Object.defineProperties(event, {
    clientX: { configurable: true, value: clientX },
    clientY: { configurable: true, value: clientY },
    pointerId: { configurable: true, value: pointerId },
  });
  target.dispatchEvent(event);
}

describe("WorkspaceDashboard", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders the default total summary card alongside persisted dashboard widgets", () => {
    render(<WorkspaceDashboard rowStates={buildWorkspaceRowStates(rows, fields)} fields={fields} dashboardDocument={dashboardDocument} onOpenDetails={() => {}} />);

    expect(screen.queryByTestId("dashboard-summary-strip")).toBeNull();
    expect(screen.getByText("已报销")).toBeInTheDocument();
    expect(screen.getByText("按上传者")).toBeInTheDocument();
    expect(screen.getByText("金额占比")).toBeInTheDocument();
    expect(screen.getByText("处理看板")).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getByTestId("dashboard-bar-chart")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-pie-chart")).toBeInTheDocument();
  });

  test("renders a default total summary widget instead of a fixed top summary strip", () => {
    render(<WorkspaceDashboard rowStates={buildWorkspaceRowStates(rows, fields)} fields={fields} dashboardDocument={null} onOpenDetails={() => {}} />);

    expect(screen.getByRole("heading", { name: "总记录统计" })).toBeInTheDocument();
    expect(screen.getByText("记录数")).toBeInTheDocument();
    expect(screen.getByText("总金额")).toBeInTheDocument();
    expect(screen.getByText("税额")).toBeInTheDocument();
  });

  test("renders a pure dashboard surface with a trailing add tile and no inline editors", () => {
    const { container } = render(<WorkspaceDashboard rowStates={buildWorkspaceRowStates(rows, fields)} fields={fields} dashboardDocument={dashboardDocument} onOpenDetails={() => {}} />);
    const grid = container.querySelector(".overview-grid--dashboard") as HTMLDivElement;
    const metricSlot = screen.getByRole("heading", { name: "已报销" }).closest(".dashboard-widget-slot") as HTMLDivElement;
    const chartSlot = screen.getByRole("heading", { name: "按上传者" }).closest(".dashboard-widget-slot") as HTMLDivElement;

    expect(screen.getByRole("button", { name: "新建仪表盘" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "拖动仪表盘“已报销”" })).toBeNull();
    expect(grid.style.display).toBe("grid");
    expect(grid.style.getPropertyValue("--dashboard-columns")).toBe("4");
    expect(grid.style.getPropertyValue("--dashboard-column-width")).toBe("180px");
    expect(metricSlot.style.getPropertyValue("--dashboard-col-span")).toBe("1");
    expect(chartSlot.style.getPropertyValue("--dashboard-col-span")).toBe("2");
    expect(screen.queryByText("在这里追加统计卡片、条形图、饼图和看板卡片。")).toBeNull();
    expect(screen.queryByText("卡片名称")).toBeNull();
    expect(screen.queryByText("分组字段")).toBeNull();
  });

  test("creates a selected widget type from the create dashboard secondary menu", async () => {
    const user = userEvent.setup();
    const onDashboardDocumentChange = vi.fn();

    render(
      <WorkspaceDashboard
        rowStates={buildWorkspaceRowStates(rows, fields)}
        fields={fields}
        dashboardDocument={null}
        onDashboardDocumentChange={onDashboardDocumentChange}
        onOpenDetails={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "新建仪表盘" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "仪表盘类型" }), "bar_chart");
    await user.click(screen.getByRole("button", { name: "创建仪表盘" }));

    expect(onDashboardDocumentChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "primary",
        widgets: expect.arrayContaining([
          expect.objectContaining({
            type: "metric",
            title: "总记录统计",
            metrics: ["row_count", "total_amount", "tax_amount"],
          }),
          expect.objectContaining({
            type: "bar_chart",
            title: "条形图 1",
            groupByFieldId: "uploader",
          }),
        ]),
        layout: expect.arrayContaining([
          expect.objectContaining({ colSpan: 1, rowSpan: 1 }),
          expect.objectContaining({ colSpan: 2, rowSpan: 1 }),
        ]),
      }),
    );
  });

  test("opens widget properties from the card action menu instead of inline editors", async () => {
    const user = userEvent.setup();

    render(<WorkspaceDashboard rowStates={buildWorkspaceRowStates(rows, fields)} fields={fields} dashboardDocument={dashboardDocument} onOpenDetails={() => {}} />);

    await user.click(screen.getByRole("button", { name: "仪表盘“已报销”操作" }));
    expect(screen.queryByRole("menuitem", { name: "编辑筛选条件" })).toBeNull();
    await user.click(screen.getByRole("menuitem", { name: "编辑仪表盘" }));

    expect(screen.getByRole("dialog", { name: "编辑仪表盘" })).toBeInTheDocument();
    expect(screen.getByLabelText("卡片名称")).toHaveValue("已报销");
    expect(screen.queryAllByText("卡片名称").length).toBe(1);
  });

  test("resizes widget spans from the bottom-right handle using the current grid cell size", () => {
    const onDashboardDocumentChange = vi.fn();

    render(
      <WorkspaceDashboard
        rowStates={buildWorkspaceRowStates(rows, fields)}
        fields={fields}
        dashboardDocument={dashboardDocument}
        onDashboardDocumentChange={onDashboardDocumentChange}
        onOpenDetails={() => {}}
      />,
    );

    const slot = screen.getByRole("heading", { name: "已报销" }).closest(".dashboard-widget-slot") as HTMLDivElement;
    Object.defineProperty(slot, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ width: 96, height: 120, top: 0, right: 96, bottom: 120, left: 0, x: 0, y: 0, toJSON: () => ({}) }),
    });

    const handle = screen.getByRole("button", { name: "调整仪表盘“已报销”大小" });
    act(() => {
      dispatchPointerEvent(handle, "pointerdown", 0, 0);
      dispatchPointerEvent(window, "pointermove", 80, 70);
      dispatchPointerEvent(window, "pointerup", 80, 70);
    });
    dispatchPointerEvent(window, "pointerup", 80, 70);

    expect(onDashboardDocumentChange).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: expect.arrayContaining([expect.objectContaining({ widgetId: "metric-1", colSpan: 2, rowSpan: 2 })]),
      }),
    );
  });

  test("shows a top drag indicator and reorders widgets from the header drag surface", () => {
    const onDashboardDocumentChange = vi.fn();

    render(
      <WorkspaceDashboard
        rowStates={buildWorkspaceRowStates(rows, fields)}
        fields={fields}
        dashboardDocument={dashboardDocument}
        onDashboardDocumentChange={onDashboardDocumentChange}
        onOpenDetails={() => {}}
      />,
    );

    const metricCard = screen.getByRole("heading", { name: "已报销" }).closest(".workspace-card--dashboard-widget") as HTMLElement;
    const dragHandle = within(metricCard).getByTestId("dashboard-drag-handle");
    const dragSurface = dragHandle.closest(".dashboard-widget__drag-surface") as HTMLDivElement;
    const dropTarget = screen.getByRole("heading", { name: "按上传者" }).closest(".dashboard-widget-slot") as HTMLDivElement;
    const dataTransfer = {
      effectAllowed: "",
      setData: vi.fn(),
      getData: vi.fn(() => "metric-1"),
    };

    expect(dragSurface).toBeTruthy();

    fireEvent.dragStart(dragSurface, { dataTransfer });
    fireEvent.dragOver(dropTarget, { dataTransfer });
    fireEvent.drop(dropTarget, { dataTransfer });

    expect(onDashboardDocumentChange).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: expect.arrayContaining([
          expect.objectContaining({ widgetId: "bar-1", order: 2 }),
          expect.objectContaining({ widgetId: "metric-1", order: 3 }),
        ]),
      }),
    );
  });

  test("switches widget presentation profiles when spans change so content can reflow with card size", () => {
    const { rerender } = render(
      <WorkspaceDashboard rowStates={buildWorkspaceRowStates(rows, fields)} fields={fields} dashboardDocument={dashboardDocument} onOpenDetails={() => {}} />,
    );

    const metricCard = screen.getByRole("heading", { name: "已报销" }).closest(".workspace-card--dashboard-widget") as HTMLElement;
    let metricQueries = within(metricCard);

    expect(metricCard).toHaveAttribute("data-dashboard-profile", "compact");
    expect(metricQueries.getByTestId("dashboard-metric-body")).toHaveAttribute("data-metric-layout", "compact");
    expect(screen.getByTestId("dashboard-bar-chart")).toHaveAttribute("data-chart-layout", "wide");
    expect(screen.getByTestId("dashboard-pie-chart")).toHaveAttribute("data-chart-layout", "compact");

    rerender(
      <WorkspaceDashboard
        rowStates={buildWorkspaceRowStates(rows, fields)}
        fields={fields}
        dashboardDocument={{
          ...dashboardDocument,
          layout: dashboardDocument.layout.map((item) => (item.widgetId === "metric-1" ? { ...item, colSpan: 2, rowSpan: 2 } : item)),
        }}
        onOpenDetails={() => {}}
      />,
    );

    const resizedMetricCard = screen.getByRole("heading", { name: "已报销" }).closest(".workspace-card--dashboard-widget") as HTMLElement;
    metricQueries = within(resizedMetricCard);

    expect(resizedMetricCard).toHaveAttribute("data-dashboard-profile", "hero");
    expect(metricQueries.getByTestId("dashboard-metric-body")).toHaveAttribute("data-metric-layout", "hero");
  });

  test("shows chart details in hover tooltips instead of fixed side legends", async () => {
    const user = userEvent.setup();

    render(<WorkspaceDashboard rowStates={buildWorkspaceRowStates(rows, fields)} fields={fields} dashboardDocument={dashboardDocument} onOpenDetails={() => {}} />);

    const barChart = screen.getByTestId("dashboard-bar-chart");
    const pieChart = screen.getByTestId("dashboard-pie-chart");

    expect(within(barChart).queryByText("200.00")).toBeNull();
    expect(within(pieChart).queryByText("Alice")).toBeNull();

    await user.hover(screen.getByTestId("dashboard-bar-segment-Bob"));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Bob");
    expect(screen.getByRole("tooltip")).toHaveTextContent("200.00");

    await user.unhover(screen.getByTestId("dashboard-bar-segment-Bob"));
    expect(screen.queryByRole("tooltip")).toBeNull();

    await user.hover(screen.getByTestId("dashboard-pie-segment-Alice"));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Alice");
    expect(screen.getByRole("tooltip")).toHaveTextContent("100.00");
  });
});
