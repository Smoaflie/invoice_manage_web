import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

const mockedDeps = vi.hoisted(() => ({
  saveWorkspaceDraftRowMock: vi.fn(),
  importFilesMock: vi.fn(),
  persistFileHandleMock: vi.fn(async () => "handle-ref"),
}));

vi.mock("../application/saveWorkspaceCell", () => ({
  saveWorkspaceCell: vi.fn(),
  saveWorkspaceDraftRow: mockedDeps.saveWorkspaceDraftRowMock,
}));

vi.mock("../../files/application/importFiles", () => ({
  importFiles: mockedDeps.importFilesMock,
}));

vi.mock("../../../shared/fs/fileHandles", () => ({
  persistFileHandle: mockedDeps.persistFileHandleMock,
}));

vi.mock("../../tags/application/tagMetadata", () => ({
  loadTagMetadata: vi.fn(async () => ({
    definitions: [],
    groups: [],
    links: [],
  })),
}));

import { InvoiceWorkspace } from "./InvoiceWorkspace";

function buildRow(overrides: Partial<InvoiceDocument> = {}): InvoiceDocument {
  return {
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
    invoiceDate: "2026-03-31",
    totalAmount: 100,
    taxAmount: 10,
    amountWithoutTax: 90,
    buyerName: "旧买方",
    sellerName: "旧卖方",
    items: [],
    tags: ["待报销"],
    remark: "",
    annotation: "",
    uploader: "",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "2026-03-31T00:00:00.000Z",
    updatedAt: "2026-03-31T00:00:00.000Z",
    ...overrides,
  };
}

describe("InvoiceWorkspace saved views", () => {
  beforeEach(async () => {
    mockedDeps.saveWorkspaceDraftRowMock.mockReset();
    mockedDeps.importFilesMock.mockReset();
    mockedDeps.persistFileHandleMock.mockClear();
    await appDb.savedViews.clear();
    await appDb.settings.clear();
  });

  afterEach(() => {
    cleanup();
  });

  afterAll(async () => {
    vi.resetAllMocks();
    appDb.close();
    await appDb.delete();
  });

  test("applies an active workspace saved view on load", async () => {
    await appDb.savedViews.add({
      id: "workspace-view-1",
      scope: "workspace",
      name: "华北隐藏买方",
      isDefault: false,
      query: {
        scope: "workspace",
        searchText: "华北",
        conditionRoot: {
          id: "condition-root-1",
          kind: "group",
          mode: "all",
          children: [{ id: "condition-1", kind: "field", fieldId: "buyerName", operator: "contains", value: "华北" }],
        },
        sorters: [{ fieldId: "updatedAt", direction: "desc" }],
        groupByFieldId: "",
        fieldOrder: ["invoiceNumber", "buyerName", "remark", "annotation"],
      },
      visibleColumns: ["invoiceNumber"],
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    });
    await appDb.settings.put({
      key: "ui.activeWorkspaceViewId",
      value: "workspace-view-1",
      updatedAt: "2026-04-01T00:00:00.000Z",
    });

    render(
      <InvoiceWorkspace
        view="records"
        invoiceDocuments={[
          buildRow({ id: "doc-1", invoiceNumber: "INV-001", buyerName: "华东买方" }),
          buildRow({ id: "doc-2", invoiceNumber: "INV-002", buyerName: "华北买方", updatedAt: "2026-03-31T01:00:00.000Z" }),
        ]}
        message="工作区已加载。"
        onOpenDetails={() => {}}
        onEdit={() => {}}
        onOpenPdf={() => {}}
        onDelete={() => {}}
        onBulkReparse={() => {}}
        onRefresh={() => {}}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByDisplayValue("INV-001")).not.toBeInTheDocument();
      expect(screen.getByDisplayValue("INV-002")).toBeInTheDocument();
    });
    expect(screen.queryByDisplayValue("华北买方")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "华北隐藏买方" })).toHaveAttribute("aria-selected", "true");
  });

  test("creates a workspace saved view from the current state and can promote it to default", async () => {
    const user = userEvent.setup();
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("华北视图");

    const { unmount } = render(
      <InvoiceWorkspace
        view="records"
        invoiceDocuments={[
          buildRow({ id: "doc-1", invoiceNumber: "INV-001", buyerName: "华东买方" }),
          buildRow({ id: "doc-2", invoiceNumber: "INV-002", buyerName: "华北买方", updatedAt: "2026-03-31T01:00:00.000Z" }),
        ]}
        message="工作区已加载。"
        onOpenDetails={() => {}}
        onEdit={() => {}}
        onOpenPdf={() => {}}
        onDelete={() => {}}
        onBulkReparse={() => {}}
        onRefresh={() => {}}
      />,
    );

    await user.type(await screen.findByPlaceholderText("搜索记录..."), "华北");
    await waitFor(() => expect(screen.queryByDisplayValue("INV-001")).not.toBeInTheDocument());

    expect(screen.getByRole("tab", { name: "默认视图" })).toHaveAttribute("aria-selected", "true");
    expect(within(screen.getByRole("tablist", { name: "工作区视图" })).getByRole("button", { name: "新建视图" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "新建视图" }));
    expect(promptSpy).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("tab", { name: "华北视图" })).toHaveAttribute("aria-selected", "true"));
    expect(screen.getByRole("tab", { name: "华北视图" }).parentElement).toContainElement(screen.getByRole("button", { name: "更多视图操作" }));

    await user.click(screen.getByRole("button", { name: "更多视图操作" }));
    await user.click(screen.getByRole("menuitem", { name: "设为默认" }));

    const savedViews = await appDb.savedViews.toArray();
    expect(savedViews).toHaveLength(1);
    expect(savedViews[0]).toMatchObject({
      name: "华北视图",
      isDefault: true,
      query: expect.objectContaining({
        searchText: "华北",
        conditionRoot: expect.objectContaining({
          kind: "group",
        }),
      }),
    });

    await appDb.settings.put({
      key: "ui.activeWorkspaceViewId",
      value: null,
      updatedAt: "2026-04-01T00:00:00.000Z",
    });

    unmount();

    render(
      <InvoiceWorkspace
        view="records"
        invoiceDocuments={[
          buildRow({ id: "doc-1", invoiceNumber: "INV-001", buyerName: "华东买方" }),
          buildRow({ id: "doc-2", invoiceNumber: "INV-002", buyerName: "华北买方", updatedAt: "2026-03-31T01:00:00.000Z" }),
        ]}
        message="工作区已加载。"
        onOpenDetails={() => {}}
        onEdit={() => {}}
        onOpenPdf={() => {}}
        onDelete={() => {}}
        onBulkReparse={() => {}}
        onRefresh={() => {}}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByDisplayValue("INV-001")).not.toBeInTheDocument();
      expect(screen.getByDisplayValue("INV-002")).toBeInTheDocument();
    });
    expect(screen.getByRole("tab", { name: "华北视图" })).toHaveAttribute("aria-selected", "true");

    promptSpy.mockRestore();
  });

  test("renames, duplicates, and deletes the active saved view from the more menu", async () => {
    const user = userEvent.setup();
    const promptSpy = vi.spyOn(window, "prompt");
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    await appDb.savedViews.add({
      id: "workspace-view-1",
      scope: "workspace",
      name: "原始视图",
      isDefault: false,
      query: {
        scope: "workspace",
        searchText: "",
        conditionRoot: {
          id: "condition-root-rename",
          kind: "group",
          mode: "all",
          children: [],
        },
        sorters: [{ fieldId: "updatedAt", direction: "desc" }],
        groupByFieldId: "",
        fieldOrder: ["invoiceNumber", "buyerName"],
      },
      visibleColumns: ["invoiceNumber", "buyerName"],
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    });
    await appDb.settings.put({
      key: "ui.activeWorkspaceViewId",
      value: "workspace-view-1",
      updatedAt: "2026-04-01T00:00:00.000Z",
    });

    render(
      <InvoiceWorkspace
        view="records"
        invoiceDocuments={[buildRow()]}
        message="工作区已加载。"
        onOpenDetails={() => {}}
        onEdit={() => {}}
        onOpenPdf={() => {}}
        onDelete={() => {}}
        onBulkReparse={() => {}}
        onRefresh={() => {}}
      />,
    );

    await screen.findByRole("tab", { name: "原始视图" });

    promptSpy.mockReturnValueOnce("重命名后的视图");
    await user.click(screen.getByRole("button", { name: "更多视图操作" }));
    await user.click(screen.getByRole("menuitem", { name: "重命名" }));
    await waitFor(() => expect(screen.getByRole("tab", { name: "重命名后的视图" })).toHaveAttribute("aria-selected", "true"));

    promptSpy.mockReturnValueOnce("复制出的视图");
    await user.click(screen.getByRole("button", { name: "更多视图操作" }));
    await user.click(screen.getByRole("menuitem", { name: "复制视图" }));
    await waitFor(() => expect(screen.getByRole("tab", { name: "复制出的视图" })).toHaveAttribute("aria-selected", "true"));

    await user.click(screen.getByRole("button", { name: "更多视图操作" }));
    await user.click(screen.getByRole("menuitem", { name: "删除视图" }));
    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("tab", { name: "默认视图" })).toHaveAttribute("aria-selected", "true"));

    const savedViewNames = (await appDb.savedViews.toArray()).map((view) => view.name);
    expect(savedViewNames).toEqual(["重命名后的视图"]);

    promptSpy.mockRestore();
    confirmSpy.mockRestore();
  });

  test("shows all workspace columns in the builtin default view", async () => {
    const user = userEvent.setup();

    render(
      <InvoiceWorkspace
        view="records"
        invoiceDocuments={[
          buildRow({
            items: [{ itemBrief: "*电子元件*连接器", name: "*电子元件*连接器" } as never],
          }),
        ]}
        message="工作区已加载。"
        onOpenDetails={() => {}}
        onEdit={() => {}}
        onOpenPdf={() => {}}
        onDelete={() => {}}
        onBulkReparse={() => {}}
        onRefresh={() => {}}
      />,
    );

    expect(await screen.findByText("商品简介")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "字段" }));
    expect(screen.getByLabelText("显示字段 商品简介")).toBeChecked();
    expect(screen.getByLabelText("显示字段 备注")).toBeChecked();
    expect(screen.queryByLabelText("显示字段 商品详情")).not.toBeInTheDocument();
  });

  test("saves resized record and item column widths with the workspace view", async () => {
    const user = userEvent.setup();
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("列宽视图");

    render(
      <InvoiceWorkspace
        view="records"
        invoiceDocuments={[
          buildRow({
            invoiceNumber: "INV-2026-000001",
            buyerName: "华北区域企业服务有限公司",
            items: [{ name: "企业服务费", type: "技术咨询", amount: 1888.5 } as never],
          }),
        ]}
        message="工作区已加载。"
        onOpenDetails={() => {}}
        onEdit={() => {}}
        onOpenPdf={() => {}}
        onDelete={() => {}}
        onBulkReparse={() => {}}
        onRefresh={() => {}}
      />,
    );

    fireEvent.mouseDown(await screen.findByRole("button", { name: "调整列宽 发票号码" }), { clientX: 200 });
    fireEvent.mouseMove(window, { clientX: 220 });
    fireEvent.mouseUp(window, { clientX: 220 });

    await user.click(screen.getByRole("button", { name: "查看商品" }));

    fireEvent.mouseDown(screen.getByRole("button", { name: "调整列宽 商品" }), { clientX: 320 });
    fireEvent.mouseMove(window, { clientX: 340 });
    fireEvent.mouseUp(window, { clientX: 340 });

    await user.click(screen.getByRole("button", { name: "新建视图" }));
    await waitFor(() => expect(screen.getByRole("tab", { name: "列宽视图" })).toHaveAttribute("aria-selected", "true"));

    const savedView = await appDb.savedViews.toArray();
    expect(savedView).toHaveLength(1);
    expect(savedView[0].query).toEqual(
      expect.objectContaining({
        recordColumnWidths: expect.objectContaining({ invoiceNumber: expect.any(Number), buyerName: expect.any(Number) }),
        itemColumnWidths: expect.objectContaining({ name: expect.any(Number), type: expect.any(Number) }),
      }),
    );

    promptSpy.mockRestore();
  });
});
