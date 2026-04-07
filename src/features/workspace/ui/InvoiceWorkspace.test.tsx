import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { buildRow, mockedDeps, renderInvoiceWorkspace, resetInvoiceWorkspaceMocks } from "./InvoiceWorkspace.testUtils";

describe("InvoiceWorkspace", () => {
  beforeEach(() => {
    resetInvoiceWorkspaceMocks();
  });

  afterEach(async () => {
    vi.useRealTimers();
    cleanup();
    await appDb.settings.clear();
  });

  afterAll(async () => {
    vi.resetAllMocks();
  });

  test("keeps workspace cells read-only", async () => {
    const user = userEvent.setup();
    renderInvoiceWorkspace();

    await user.click(await screen.findByDisplayValue("旧买方"));
    expect(mockedDeps.saveWorkspaceDraftRowMock).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue("旧买方")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "保存修改" })).not.toBeInTheDocument();
  });

  test("renders the reference-style records shell", async () => {
    const { container } = renderInvoiceWorkspace();
    const toolbar = container.querySelector('[data-testid="reference-workspace-toolbar"]') as HTMLElement;
    const contentNav = container.querySelector('[data-testid="reference-workspace-view-nav"]');
    const savedViews = container.querySelector('[data-testid="reference-workspace-saved-views"]') as HTMLElement;
    const statusRow = container.querySelector('[data-testid="reference-workspace-toolbar-status"]');
    const actionRow = container.querySelector('[data-testid="reference-workspace-toolbar-actions"]') as HTMLElement;

    expect(await screen.findByTestId("reference-workspace-root")).toBeInTheDocument();
    expect(toolbar).toBeInTheDocument();
    expect(contentNav).toBeNull();
    expect(savedViews).toBeInTheDocument();
    expect(statusRow).toBeNull();
    expect(actionRow).toBeInTheDocument();
    expect(within(toolbar).queryByText("Invoice Workspace")).not.toBeInTheDocument();
    expect(within(toolbar).queryByText("发票多维表格")).not.toBeInTheDocument();
    expect(within(toolbar).queryByRole("tab", { name: "表格视图" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "表格视图" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "看板" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "统计" })).not.toBeInTheDocument();
    const tablist = within(savedViews).getByRole("tablist", { name: "工作区视图" });
    expect(tablist).toBeInTheDocument();
    expect(within(savedViews).getByRole("tab", { name: "默认视图" })).toHaveAttribute("aria-selected", "true");
    expect(within(savedViews).getByRole("button", { name: "更多视图操作" })).toBeInTheDocument();
    expect(within(tablist).getByRole("button", { name: "新建视图" })).toBeInTheDocument();
    expect(within(toolbar).queryByLabelText("工作区统计")).toBeNull();
    expect(within(actionRow).queryByText("搜索")).toBeNull();
    expect(within(toolbar).queryByRole("combobox", { name: "当前视图" })).toBeNull();
    expect(within(toolbar).queryByPlaceholderText("例如：工作区待处理视图")).toBeNull();
    expect(screen.getByRole("button", { name: "筛选" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "排序" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "分组" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "字段" })).toBeInTheDocument();
    expect(within(actionRow).getByRole("button", { name: "导入数据" })).toBeInTheDocument();
    expect(within(actionRow).getByRole("button", { name: "导出数据" })).toBeInTheDocument();
    expect(within(actionRow).getByRole("button", { name: "导出 Excel" })).toBeInTheDocument();
    expect(within(actionRow).getByRole("button", { name: "编辑标签" })).toBeInTheDocument();
    expect(within(actionRow).getByRole("button", { name: "删除所选" })).toBeInTheDocument();
    const actionButtons = Array.from(actionRow.querySelectorAll("button")).map((node) => node.textContent?.trim() ?? "");
    expect(actionButtons.indexOf("导入数据")).toBeGreaterThan(actionButtons.indexOf("字段"));
    expect(actionButtons.indexOf("导出数据")).toBeGreaterThan(actionButtons.indexOf("导入数据"));
    expect(actionButtons.indexOf("导出 Excel")).toBeGreaterThan(actionButtons.indexOf("导出数据"));
    expect(actionButtons.indexOf("编辑标签")).toBeGreaterThan(actionButtons.indexOf("导出 Excel"));
    expect(actionButtons.indexOf("删除所选")).toBeGreaterThan(actionButtons.indexOf("批量 OCR"));
    expect(screen.queryByText("导入数据，建立第一批票据")).not.toBeInTheDocument();
    expect(screen.queryByText("先把票据拉进本地台账，再决定筛选、批量 OCR、标签和后续协作。")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "添加字段" })).not.toBeInTheDocument();
  });

  test("imports dropped files from the records workspace", async () => {
    const onRefresh = vi.fn();
    mockedDeps.importFilesMock.mockResolvedValue({
      created: [buildRow()],
      rebound: [],
    });

    renderInvoiceWorkspace({ onRefresh });

    const file = new File(["pdf"], "incoming.pdf", { type: "application/pdf" });
    const dropTarget = await screen.findByTestId("workspace-dropzone");

    fireEvent.dragOver(dropTarget, {
      dataTransfer: {
        files: [file],
        items: [
          {
            kind: "file",
            getAsFile: () => file,
            getAsFileSystemHandle: async () => null,
          },
        ],
      },
    });

    fireEvent.drop(dropTarget, {
      dataTransfer: {
        files: [file],
        items: [
          {
            kind: "file",
            getAsFile: () => file,
            getAsFileSystemHandle: async () => null,
          },
        ],
      },
    });

    await waitFor(() =>
      expect(mockedDeps.importFilesMock).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            file,
            handle: null,
          }),
        ],
        expect.objectContaining({
          persistHandle: mockedDeps.persistFileHandleMock,
          now: expect.any(Function),
        }),
      ),
    );
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
  });

  test("runs batch actions against the current selected rows", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onBulkReparse = vi.fn();

    renderInvoiceWorkspace({
      invoiceDocuments: [
        buildRow({ id: "doc-1", invoiceNumber: "INV-001", buyerName: "甲方" }),
        buildRow({ id: "doc-2", invoiceNumber: "INV-002", buyerName: "乙方", updatedAt: "2026-03-31T01:00:00.000Z" }),
      ],
      onDelete,
      onBulkReparse,
    });

    await user.click(await screen.findByRole("checkbox", { name: "选择 INV-001" }));
    await user.click(screen.getByRole("checkbox", { name: "选择 INV-002" }));
    await user.click(screen.getByRole("button", { name: "批量 OCR" }));
    await user.click(screen.getByRole("button", { name: "删除所选" }));

    expect(onBulkReparse).toHaveBeenCalledWith(["doc-1", "doc-2"]);
    expect(onDelete).toHaveBeenCalledWith(["doc-1", "doc-2"]);
  });

  test("exports only the currently selected invoices to excel", async () => {
    const user = userEvent.setup();

    renderInvoiceWorkspace({
      invoiceDocuments: [
        buildRow({
          id: "doc-1",
          invoiceNumber: "INV-001",
          buyerName: "甲方",
          items: [{ name: "服务费", amount: 100, tax: 6 }] as never[],
        }),
        buildRow({
          id: "doc-2",
          invoiceNumber: "INV-002",
          buyerName: "乙方",
          items: [{ name: "住宿费", amount: 200, tax: 12 }] as never[],
          updatedAt: "2026-03-31T01:00:00.000Z",
        }),
      ],
    });

    const exportButton = await screen.findByRole("button", { name: "导出 Excel" });
    expect(exportButton).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: "选择 INV-001" }));

    expect(exportButton).toBeEnabled();

    await user.click(exportButton);

    expect(mockedDeps.buildWorkspaceExcelExportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceDocuments: [
          expect.objectContaining({
            id: "doc-1",
            invoiceNumber: "INV-001",
          }),
        ],
        fields: expect.arrayContaining([
          expect.objectContaining({ label: "OCR来源" }),
          expect.objectContaining({ label: "商品详情" }),
          expect.objectContaining({ label: "商品税额" }),
        ]),
      }),
    );
    expect(mockedDeps.triggerWorkspaceExcelDownloadMock).toHaveBeenCalledWith(
      expect.objectContaining({ filename: "invoice-workspace-test.xlsx" }),
    );
  });

  test("reports sidebar summary for the current records workspace", async () => {
    const onSidebarStatusChange = vi.fn();

    renderInvoiceWorkspace({
      message: "本地工作台数据已加载。",
      onSidebarStatusChange,
      invoiceDocuments: [
        buildRow({ id: "doc-1", invoiceNumber: "INV-001" }),
        buildRow({ id: "doc-2", invoiceNumber: "INV-002", updatedAt: "2026-03-31T01:00:00.000Z" }),
      ],
    });

    await waitFor(() =>
      expect(onSidebarStatusChange).toHaveBeenCalledWith({
        message: "本地工作台数据已加载。",
        stats: ["2 条记录", "2 条结果", "0 条已选", "0 项待保存"],
      }),
    );
  });

  test("renders a dedicated dashboard shell without records toolbar controls", async () => {
    renderInvoiceWorkspace({
      view: "dashboard",
      invoiceDocuments: [
        buildRow({ id: "doc-1", invoiceNumber: "INV-001", totalAmount: 100, taxAmount: 10 }),
        buildRow({ id: "doc-2", invoiceNumber: "INV-002", totalAmount: 200, taxAmount: 20, updatedAt: "2026-03-31T01:00:00.000Z" }),
      ],
    });

    expect(await screen.findByTestId("workspace-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("reference-workspace-toolbar")).toBeNull();
    expect(screen.queryByRole("button", { name: "筛选" })).toBeNull();
    expect(screen.queryByRole("button", { name: "导入数据" })).toBeNull();
    expect(screen.getByRole("button", { name: "新建仪表盘" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "总记录统计" })).toBeInTheDocument();
    expect(screen.queryByText("卡片名称")).toBeNull();
    expect(screen.getByText("记录数")).toBeInTheDocument();
    expect(screen.getByText("税额")).toBeInTheDocument();
  });

  test("persists a dashboard widget added from the dashboard shell", async () => {
    const user = userEvent.setup();

    renderInvoiceWorkspace({
      view: "dashboard",
      invoiceDocuments: [
        buildRow({ id: "doc-1", invoiceNumber: "INV-001", totalAmount: 100, taxAmount: 10 }),
      ],
    });

    await user.click(await screen.findByRole("button", { name: "新建仪表盘" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "仪表盘类型" }), "metric");
    await user.click(screen.getByRole("button", { name: "创建仪表盘" }));

    await waitFor(async () => {
      await expect(appDb.dashboardDocuments.get("primary")).resolves.toMatchObject({
        widgets: expect.arrayContaining([
          expect.objectContaining({
            type: "metric",
            title: "总记录统计",
          }),
          expect.objectContaining({
            type: "metric",
            title: "统计卡片 1",
          }),
        ]),
      });
    });
  });
});
