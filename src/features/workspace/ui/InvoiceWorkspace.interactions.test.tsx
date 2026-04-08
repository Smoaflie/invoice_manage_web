import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { buildRow, mockedDeps, renderInvoiceWorkspace, resetInvoiceWorkspaceMocks } from "./InvoiceWorkspace.testUtils";

describe("InvoiceWorkspace interactions", () => {
  beforeEach(() => {
    resetInvoiceWorkspaceMocks();
  });

  afterEach(async () => {
    vi.useRealTimers();
    cleanup();
    await appDb.filterGroups.clear();
    await appDb.settings.clear();
  });

  afterAll(async () => {
    vi.resetAllMocks();
  });

  test("restores the persisted workspace selection from settings", async () => {
    await appDb.settings.put({
      key: "ui.workspaceSelectedIds",
      value: ["doc-2"],
      updatedAt: "2026-04-01T00:00:00.000Z",
    });

    renderInvoiceWorkspace({
      invoiceDocuments: [
        buildRow({ id: "doc-1", invoiceNumber: "INV-001" }),
        buildRow({ id: "doc-2", invoiceNumber: "INV-002", updatedAt: "2026-03-31T01:00:00.000Z" }),
      ],
    });

    await waitFor(() => expect(screen.getByRole("checkbox", { name: "选择 INV-002" })).toBeChecked());
    expect(screen.getByRole("button", { name: "删除所选" })).toBeEnabled();
  });

  test("applies data filters from the toolbar dialog", async () => {
    const user = userEvent.setup();

    renderInvoiceWorkspace({
      invoiceDocuments: [
        buildRow({ id: "doc-1", fileName: "east.pdf", buyerName: "华东买方", invoiceNumber: "INV-001" }),
        buildRow({ id: "doc-2", fileName: "north.pdf", buyerName: "华北买方", invoiceNumber: "INV-002", updatedAt: "2026-03-31T01:00:00.000Z" }),
      ],
    });

    await user.click(await screen.findByRole("button", { name: "筛选" }));
    await user.selectOptions(screen.getByLabelText("筛选字段"), "buyerName");
    await user.selectOptions(screen.getByLabelText("筛选条件"), "contains");
    await user.type(screen.getByLabelText("筛选值"), "华北");
    await user.click(screen.getByRole("button", { name: "应用筛选" }));

    await waitFor(() => {
      expect(screen.queryByDisplayValue("华东买方")).not.toBeInTheDocument();
      expect(screen.getByDisplayValue("华北买方")).toBeInTheDocument();
    });
  });

  test("filters string fields with the not-empty operator", async () => {
    const user = userEvent.setup();

    renderInvoiceWorkspace({
      invoiceDocuments: [
        buildRow({ id: "doc-1", buyerName: "", invoiceNumber: "INV-001" }),
        buildRow({ id: "doc-2", buyerName: "华北买方", invoiceNumber: "INV-002", updatedAt: "2026-03-31T01:00:00.000Z" }),
      ],
    });

    await user.click(await screen.findByRole("button", { name: "筛选" }));
    await user.selectOptions(screen.getByLabelText("筛选字段"), "buyerName");
    await user.selectOptions(screen.getByLabelText("筛选条件"), "is_not_empty");
    await user.click(screen.getByRole("button", { name: "应用筛选" }));

    await waitFor(() => {
      expect(screen.queryByDisplayValue("INV-001")).not.toBeInTheDocument();
      expect(screen.getByDisplayValue("INV-002")).toBeInTheDocument();
    });
  });

  test("keeps only item brief available in field selectors while item detail stays searchable", async () => {
    const user = userEvent.setup();

    renderInvoiceWorkspace({
      invoiceDocuments: [
        buildRow({
          items: [{ itemBrief: "*电子元件*连接器", name: "*电子元件*连接器" } as never],
        }),
      ],
    });

    await user.click(await screen.findByRole("button", { name: "筛选" }));

    expect(screen.getByRole("option", { name: "商品简介" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "商品详情" })).not.toBeInTheDocument();
  });

  test("supports filter-group rules and saving the current conditions as a filter group", async () => {
    const user = userEvent.setup();
    const promptSpy = vi.spyOn(window, "prompt");

    await appDb.filterGroups.put({
      id: "group-north",
      name: "华北买方",
      root: {
        id: "root-north",
        kind: "group",
        mode: "all",
        children: [{ id: "north-field", kind: "field", fieldId: "buyerName", operator: "contains", value: "华北" }],
      },
      createdAt: "2026-04-04T00:00:00.000Z",
      updatedAt: "2026-04-04T00:00:00.000Z",
    });

    renderInvoiceWorkspace({
      invoiceDocuments: [
        buildRow({ id: "doc-1", fileName: "east.pdf", buyerName: "华东买方", invoiceNumber: "INV-001" }),
        buildRow({ id: "doc-2", fileName: "north.pdf", buyerName: "华北买方", invoiceNumber: "INV-002", updatedAt: "2026-03-31T01:00:00.000Z" }),
      ],
    });

    await user.click(await screen.findByRole("button", { name: "筛选" }));
    await user.selectOptions(screen.getByLabelText("规则类型"), "filter_group");
    await user.selectOptions(screen.getByLabelText("筛选组"), "group-north");
    await user.click(screen.getByRole("button", { name: "应用筛选" }));

    await waitFor(() => {
      expect(screen.queryByDisplayValue("华东买方")).not.toBeInTheDocument();
      expect(screen.getByDisplayValue("华北买方")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "筛选" }));
    await user.selectOptions(screen.getByLabelText("规则类型"), "field");
    await user.selectOptions(screen.getByLabelText("筛选字段"), "buyerName");
    await user.selectOptions(screen.getByLabelText("筛选条件"), "contains");
    await user.clear(screen.getByLabelText("筛选值"));
    await user.type(screen.getByLabelText("筛选值"), "华北");
    promptSpy.mockReturnValueOnce("新建筛选组");
    await user.click(screen.getByRole("button", { name: "保存为筛选组" }));

    await waitFor(async () => {
      const groups = await appDb.filterGroups.toArray();
      expect(groups.some((group) => group.name === "新建筛选组")).toBe(true);
    });
  });

  test("applies toolbar search after the buffered input delay", async () => {
    renderInvoiceWorkspace({
      invoiceDocuments: [
        buildRow({ id: "doc-1", fileName: "east.pdf", buyerName: "华东买方", invoiceNumber: "INV-001" }),
        buildRow({ id: "doc-2", fileName: "north.pdf", buyerName: "华北买方", invoiceNumber: "INV-002", updatedAt: "2026-03-31T01:00:00.000Z" }),
      ],
    });

    const searchInput = await screen.findByPlaceholderText("搜索记录...");
    fireEvent.change(searchInput, { target: { value: "华北" } });

    expect(screen.getByDisplayValue("华东买方")).toBeInTheDocument();
    expect(screen.getByDisplayValue("华北买方")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByDisplayValue("华东买方")).not.toBeInTheDocument();
      expect(screen.getByDisplayValue("华北买方")).toBeInTheDocument();
    });
  }, 10000);

  test("applies field visibility changes from the field manager dialog", async () => {
    const user = userEvent.setup();

    renderInvoiceWorkspace();

    expect(await screen.findByDisplayValue("旧买方")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "字段" }));
    expect(screen.queryAllByText("字符串")).toHaveLength(0);
    expect(screen.queryAllByText("220px")).toHaveLength(0);
    expect(screen.queryAllByText("内置")).toHaveLength(0);
    await user.click(screen.getByLabelText("显示字段 购买方"));

    expect(screen.getByDisplayValue("旧买方")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "应用字段" }));

    await waitFor(() => {
      expect(screen.queryByDisplayValue("旧买方")).not.toBeInTheDocument();
    });
  });

  test("shows kanban field controls and renders file names on cards", async () => {
    const user = userEvent.setup();

    renderInvoiceWorkspace({
      view: "kanban",
      invoiceDocuments: [buildRow({ id: "doc-1", fileName: "kanban-demo.pdf", parseStatus: "parsed" })],
    });

    expect(await screen.findByRole("button", { name: "看板字段" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kanban-demo\.pdf/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "分组" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "字段" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除所选" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "看板字段" }));
    expect(screen.getAllByLabelText("看板字段").length).toBeGreaterThan(0);
  });

  test("applies sort and group settings from toolbar dialogs", async () => {
    const user = userEvent.setup();

    renderInvoiceWorkspace({
      invoiceDocuments: [
        buildRow({ id: "doc-1", fileName: "b.pdf", buyerName: "乙方", invoiceNumber: "INV-001", parseStatus: "parsed", updatedAt: "2026-03-31T00:00:00.000Z" }),
        buildRow({ id: "doc-2", fileName: "a.pdf", buyerName: "甲方", invoiceNumber: "INV-002", parseStatus: "needs_reparse", updatedAt: "2026-03-31T01:00:00.000Z" }),
      ],
    });

    await user.click(screen.getByRole("button", { name: "排序" }));
    await user.selectOptions(screen.getByLabelText("排序字段"), "fileName");
    await user.selectOptions(screen.getByLabelText("排序方向"), "asc");
    await user.click(screen.getByRole("button", { name: "应用排序" }));

    const fileInputs = screen.getAllByDisplayValue(/^[ab]\.pdf$/);
    expect(fileInputs[0]).toHaveValue("a.pdf");

    await user.click(screen.getByRole("button", { name: "分组" }));
    await user.selectOptions(screen.getByLabelText("分组字段"), "parseStatus");
    await user.click(screen.getByRole("button", { name: "应用分组" }));

    expect(screen.getAllByText("parsed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("needs_reparse").length).toBeGreaterThan(0);
  });

  test("adds and removes tags for all selected rows", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    mockedDeps.bulkUpdateInvoiceTagsMock.mockResolvedValue({ updatedCount: 2 });

    renderInvoiceWorkspace({
      invoiceDocuments: [
        buildRow({ id: "doc-1", invoiceNumber: "INV-001", tags: ["待报销", "共享标签"] }),
        buildRow({ id: "doc-2", invoiceNumber: "INV-002", tags: ["差旅", "共享标签"], updatedAt: "2026-03-31T01:00:00.000Z" }),
      ],
      onRefresh,
    });

    await user.click(await screen.findByRole("checkbox", { name: "选择全部记录" }));
    await user.click(screen.getByRole("button", { name: "编辑标签" }));
    const tagDialog = screen.getByRole("dialog", { name: "编辑标签" });
    expect(within(tagDialog).getByText("共同标签")).toBeInTheDocument();
    expect(within(tagDialog).getByText("共享标签")).toBeInTheDocument();
    await user.type(within(tagDialog).getByPlaceholderText("用空格分隔多个标签"), "已归档");
    await user.click(within(tagDialog).getByRole("button", { name: "添加标签" }));

    await user.click(screen.getByRole("button", { name: "编辑标签" }));
    await user.click(within(screen.getByRole("dialog", { name: "编辑标签" })).getByRole("button", { name: "删除标签" }));

    expect(mockedDeps.bulkUpdateInvoiceTagsMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        invoiceDocumentIds: expect.arrayContaining(["doc-1", "doc-2"]),
        tagsText: "已归档",
        mode: "add",
        now: expect.any(Function),
      }),
    );
    expect(mockedDeps.bulkUpdateInvoiceTagsMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        invoiceDocumentIds: expect.arrayContaining(["doc-1", "doc-2"]),
        tagsText: "已归档",
        mode: "remove",
        now: expect.any(Function),
      }),
    );
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(2));
  });

  test("selects imported records automatically and persists the updated selection", async () => {
    mockedDeps.importFilesMock.mockResolvedValue({
      created: [buildRow({ id: "doc-imported", invoiceNumber: "INV-099" })],
      rebound: [],
    });

    renderInvoiceWorkspace({
      invoiceDocuments: [buildRow({ id: "doc-1", invoiceNumber: "INV-001" })],
    });

    const user = userEvent.setup();
    await user.click(await screen.findByRole("checkbox", { name: "选择 INV-001" }));

    const file = new File(["pdf"], "incoming.pdf", { type: "application/pdf" });
    const dropTarget = await screen.findByTestId("workspace-dropzone");
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

    await waitFor(async () =>
      expect((await appDb.settings.get("ui.workspaceSelectedIds"))?.value).toEqual(["doc-1", "doc-imported"]),
    );
    expect(screen.getByRole("checkbox", { name: "选择 INV-001" })).toBeChecked();
    expect(screen.getByRole("button", { name: "删除所选" })).toBeEnabled();
  });

  test("imports and exports transfer data from the toolbar", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    const createObjectUrlSpy = vi.fn().mockReturnValue("blob:workspace-export");
    const revokeObjectUrlSpy = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectUrlSpy, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectUrlSpy, configurable: true });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    mockedDeps.exportDataMock.mockResolvedValue({ invoiceDocuments: [], exportedAt: "2026-04-01T00:00:00.000Z" });
    mockedDeps.importDataMock.mockResolvedValue({ importedInvoiceDocuments: 2 });

    renderInvoiceWorkspace({ onRefresh });

    await user.click(await screen.findByRole("button", { name: "导出数据" }));
    await waitFor(() => expect(mockedDeps.exportDataMock).toHaveBeenCalledTimes(1));

    const input = document.querySelector('input[type="file"][accept*=".json"]') as HTMLInputElement | null;
    expect(input).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "导入数据" }));

    const file = new File([JSON.stringify({ invoiceDocuments: [{ id: "doc-2" }] })], "transfer.json", { type: "application/json" });
    Object.defineProperty(input as HTMLInputElement, "files", { value: [file], configurable: true });
    fireEvent.change(input as HTMLInputElement);

    await waitFor(() => expect(mockedDeps.importDataMock).toHaveBeenCalledWith({ invoiceDocuments: [{ id: "doc-2" }] }));
    await waitFor(() => expect(onRefresh).toHaveBeenCalled());
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:workspace-export");
  });

  test("confirms conflicting toolbar imports before continuing with flagged records", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedDeps.importDataMock
      .mockRejectedValueOnce(Object.assign(new Error("conflict"), { name: "ImportConflictError", conflicts: [{ status: "same_number_diff_hash" }] }))
      .mockResolvedValueOnce({ importedInvoiceDocuments: 1, conflictedInvoiceDocuments: 1 });

    renderInvoiceWorkspace({ onRefresh });

    const input = document.querySelector('input[type="file"][accept*=".json"]') as HTMLInputElement | null;
    expect(input).toBeTruthy();

    await user.click(await screen.findByRole("button", { name: "导入数据" }));

    const file = new File([JSON.stringify({ invoiceDocuments: [{ id: "doc-2" }] })], "transfer.json", { type: "application/json" });
    Object.defineProperty(input as HTMLInputElement, "files", { value: [file], configurable: true });
    fireEvent.change(input as HTMLInputElement);

    await waitFor(() => expect(confirmSpy).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockedDeps.importDataMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
  });
});
