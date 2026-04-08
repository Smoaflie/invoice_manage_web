import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
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
    buyerName: "旧买方",
    sellerName: "供应商",
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
  },
];

const fields: WorkspaceFieldDefinition[] = [
  { id: "parseStatus", label: "识别状态", source: "builtin", type: "string", options: ["parsed"], visible: true, width: 120, editable: false },
  { id: "invoiceNumber", label: "发票号码", source: "builtin", type: "string", options: [], visible: true, width: 180, editable: true },
  { id: "buyerName", label: "购买方", source: "builtin", type: "string", options: [], visible: true, width: 180, editable: true },
];

const rowStates = buildWorkspaceRowStates(rows, fields);
const groups: ReferenceWorkspaceGroup[] = [{ id: "parsed", name: "parsed", rows: rowStates }];

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

function renderWorkspaceTable(overrides: Partial<Parameters<typeof WorkspaceTable>[0]> = {}) {
  return render(
    <WorkspaceTable
      allSelected={false}
      groups={groups}
      expandedGroupIds={["parsed"]}
      fields={fields}
      fieldOrder={["invoiceNumber", "buyerName"]}
      recordColumnWidths={{ invoiceNumber: 180, buyerName: 180 }}
      itemColumnWidths={{ name: 160, type: 140, amount: 120 }}
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
      {...overrides}
    />,
  );
}

describe("WorkspaceTable", () => {
  beforeEach(() => {
    mockCanvasTextMeasurement();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test("renders grouped rows and keeps string cells read-only", async () => {
    const user = userEvent.setup();

    renderWorkspaceTable();

    expect(screen.getByText("parsed")).toBeInTheDocument();
    const buyerInput = screen.getByDisplayValue("旧买方");
    await user.click(buyerInput);
    expect(buyerInput).toHaveFocus();
  });

  test("uses the reference project table shell classes", () => {
    const { container } = renderWorkspaceTable({
      groups: [{ id: "all", name: "全部记录", rows: rowStates }],
      expandedGroupIds: ["all"],
    });

    expect(container.querySelector(".task-table-container")).not.toBeNull();
    expect(container.querySelector(".task-table-content")).not.toBeNull();
    expect(container.querySelector(".table-data-row")).not.toBeNull();
    expect(container.querySelector(".table-cell")).not.toBeNull();
    expect(container.querySelector(".editable-cell__input--readonly")).not.toBeNull();
  });

  test("keeps horizontal scrolling on the outer table container only", () => {
    const { container } = renderWorkspaceTable();

    expect(container.querySelector(".task-table-container > .task-table-body > .task-table-content")).not.toBeNull();
  });

  test("virtualizes large row sets and swaps visible rows on scroll", async () => {
    const manyRows = buildWorkspaceRowStates(
      Array.from({ length: 500 }, (_, index) => ({
        ...rows[0],
        id: `doc-${index + 1}`,
        invoiceNumber: `INV-${index + 1}`,
        buyerName: `买方-${index + 1}`,
      })),
      fields,
    );

    const { container } = renderWorkspaceTable({
      groups: [{ id: "all", name: "大组", rows: manyRows }],
      expandedGroupIds: ["all"],
    });

    expect(container.querySelectorAll(".table-data-row").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".table-data-row").length).toBeLessThan(500);
    expect(container.textContent).toContain("500 条记录");
    expect(screen.queryByDisplayValue("买方-500")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.scroll(container.querySelector(".task-table-body") as HTMLElement, {
        target: {
          scrollTop: 24_000,
        },
      });
    });

    expect(screen.getByDisplayValue("买方-500")).toBeInTheDocument();
  });

  test("uses the provided all-selected state for the header checkbox", () => {
    renderWorkspaceTable({
      allSelected: true,
      selectedIdSet: new Set(["doc-1"]),
    });

    const checkboxes = screen.getAllByRole("checkbox", { name: "选择全部记录" });
    expect(checkboxes.at(-1)).toBeChecked();
  });

  test("pins selected rows to the top within the same group", () => {
    const orderedRows = buildWorkspaceRowStates(
      [
        { ...rows[0], id: "doc-1", invoiceNumber: "INV-001", buyerName: "甲方" },
        { ...rows[0], id: "doc-2", invoiceNumber: "INV-002", buyerName: "乙方", updatedAt: "2026-03-31T01:00:00.000Z" },
      ],
      fields,
    );

    const { container } = renderWorkspaceTable({
      groups: [{ id: "all", name: "全部记录", rows: orderedRows }],
      expandedGroupIds: ["all"],
      selectedIdSet: new Set(["doc-2"]),
    });

    const renderedRows = Array.from(container.querySelectorAll(".table-data-row"));
    expect(renderedRows).toHaveLength(2);
    expect(within(renderedRows[0] as HTMLElement).getByDisplayValue("INV-002")).toBeInTheDocument();
    expect(within(renderedRows[1] as HTMLElement).getByDisplayValue("INV-001")).toBeInTheDocument();
  });

  test("resizes adjacent record columns through header handles", () => {
    const onRecordColumnWidthsChange = vi.fn();

    renderWorkspaceTable({
      recordColumnWidths: { invoiceNumber: 140, buyerName: 180 },
      onRecordColumnWidthsChange,
    });

    fireEvent.mouseDown(screen.getByRole("button", { name: "调整列宽 发票号码" }), { clientX: 200 });
    fireEvent.mouseMove(window, { clientX: 230 });
    fireEvent.mouseUp(window, { clientX: 230 });

    expect(onRecordColumnWidthsChange).toHaveBeenCalledWith({
      invoiceNumber: 170,
      buyerName: 150,
    });
  });

  test("shows empty string cells as empty", () => {
    const { container } = renderWorkspaceTable({
      groups: [
        {
          id: "all",
          name: "全部记录",
          rows: buildWorkspaceRowStates([{ ...rows[0], id: "doc-2", buyerName: "" }], fields),
        },
      ],
      expandedGroupIds: ["all"],
      fieldOrder: ["buyerName"],
    });

    const table = within(container.querySelector('[data-testid="workspace-table"]') as HTMLElement);
    const emptyInput = table.getByPlaceholderText("空");
    expect(emptyInput).toHaveValue("");
  });

  test("expands long string cells inline instead of opening a detail dialog", async () => {
    const user = userEvent.setup();

    const { container } = renderWorkspaceTable({
      groups: [
        {
          id: "all",
          name: "全部记录",
          rows: buildWorkspaceRowStates([{ ...rows[0], id: "doc-3", buyerName: "第一行\n第二行" }], fields),
        },
      ],
      expandedGroupIds: ["all"],
      fieldOrder: ["buyerName"],
    });

    expect(container.querySelector("textarea")).toBeNull();
    expect(screen.getByRole("button", { name: /第一行/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /第一行/ }));

    expect(screen.getByRole("textbox", { name: "购买方详情" })).toHaveValue("第一行\n第二行");
    expect(screen.queryByRole("dialog", { name: "购买方详情" })).toBeNull();
  });

  test("renders a dedicated product detail submenu with a product table", async () => {
    const user = userEvent.setup();
    const itemFields: WorkspaceFieldDefinition[] = [];
    const itemRows = buildWorkspaceRowStates(
      [
        {
          ...rows[0],
          id: "doc-item-1",
          items: [
            { name: "服务费", type: "差旅", num: 2, unit_price: 33.3, amount: 66.6, tax: 4.444 } as never,
            { name: "住宿费", type: "酒店", amount: 200.5 } as never,
          ],
        },
      ],
      itemFields,
    );

    const { container } = render(
      <WorkspaceTable
        allSelected={false}
        groups={[{ id: "all", name: "全部记录", rows: itemRows }]}
        expandedGroupIds={["all"]}
        fields={itemFields}
        fieldOrder={[]}
        recordColumnWidths={{}}
        itemColumnWidths={{ name: 160, type: 140, amount: 120, num: 120, unit_price: 120, tax: 120, tax_rate: 120, unit: 120 }}
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

    expect(screen.getByText("商品详情")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看商品" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "查看商品" }));

    const menu = screen.getByRole("menu", { name: "商品购买详情" });
    expect(menu).toBeInTheDocument();
    expect(menu.closest(".task-table-body__item")).toBeNull();
    expect(within(menu).getByRole("table", { name: "商品购买详情表格" })).toBeInTheDocument();
    expect(within(menu).getByRole("columnheader", { name: "商品" })).toBeInTheDocument();
    expect(within(menu).getByRole("columnheader", { name: "规格" })).toBeInTheDocument();
    expect(within(menu).getByRole("cell", { name: "服务费" })).toBeInTheDocument();
    expect(within(menu).getByRole("cell", { name: "住宿费" })).toBeInTheDocument();
    expect(within(menu).getByRole("cell", { name: "差旅" })).toBeInTheDocument();
    expect(within(menu).getByRole("cell", { name: "酒店" })).toBeInTheDocument();
    expect(within(menu).getByRole("cell", { name: "66.60" })).toBeInTheDocument();
    expect(within(menu).getByRole("cell", { name: "200.50" })).toBeInTheDocument();
    expect(within(menu).getByRole("cell", { name: "4.44" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "商品购买详情" })).toBeNull();
    expect(container.textContent).not.toContain("商品税额");
  });

  test("reuses expandable long-string behavior inside product table cells", async () => {
    const user = userEvent.setup();
    const itemRows = buildWorkspaceRowStates(
      [
        {
          ...rows[0],
          id: "doc-item-2",
          items: [
            {
              name: "这是一个非常非常长的商品名称用于验证商品菜单单元格的截断和展开逻辑",
              type: "超长规格说明用于验证不会遮住下一列",
              amount: "100",
            } as never,
          ],
        },
      ],
      [],
    );

    render(
      <WorkspaceTable
        allSelected={false}
        groups={[{ id: "all", name: "全部记录", rows: itemRows }]}
        expandedGroupIds={["all"]}
        fields={[]}
        fieldOrder={[]}
        recordColumnWidths={{}}
        itemColumnWidths={{ name: 160, type: 140, amount: 120, num: 120, unit_price: 120, tax: 120, tax_rate: 120, unit: 120 }}
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

    await user.click(screen.getByRole("button", { name: "查看商品" }));

    const truncatedCell = within(screen.getByRole("menu", { name: "商品购买详情" })).getByRole(
      "button",
      { name: "这是一个非常非常长的商品名称用于验证商品菜单单元格的截断和展开逻辑" },
    );
    expect(truncatedCell).toBeInTheDocument();
    expect(truncatedCell.textContent?.endsWith("...")).toBe(true);

    await user.click(truncatedCell);

    expect(screen.getByRole("textbox", { name: "商品详情" })).toHaveValue("这是一个非常非常长的商品名称用于验证商品菜单单元格的截断和展开逻辑");
    expect(within(screen.getByRole("menu", { name: "商品购买详情" })).getByRole("cell", { name: "100" })).toBeInTheDocument();
  });

  test("resizes adjacent product detail columns through submenu handles", async () => {
    const user = userEvent.setup();
    const onItemColumnWidthsChange = vi.fn();
    const itemRows = buildWorkspaceRowStates(
      [
        {
          ...rows[0],
          id: "doc-item-resize",
          items: [{ name: "服务费", type: "差旅", amount: "100" } as never],
        },
      ],
      [],
    );

    render(
      <WorkspaceTable
        allSelected={false}
        groups={[{ id: "all", name: "全部记录", rows: itemRows }]}
        expandedGroupIds={["all"]}
        fields={[]}
        fieldOrder={[]}
        recordColumnWidths={{}}
        itemColumnWidths={{ name: 160, type: 140, amount: 120 }}
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
        onItemColumnWidthsChange={onItemColumnWidthsChange}
        onTableColumnWidthsChange={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "查看商品" }));

    fireEvent.mouseDown(screen.getByRole("button", { name: "调整列宽 商品" }), { clientX: 300 });
    fireEvent.mouseMove(window, { clientX: 320 });
    fireEvent.mouseUp(window, { clientX: 320 });

    expect(onItemColumnWidthsChange).toHaveBeenCalledWith({
      name: 180,
      type: 120,
      amount: 120,
    });
  });

  test("uses the handle before item-details to resize the trailing left column only", () => {
    const onRecordColumnWidthsChange = vi.fn();
    const onTableColumnWidthsChange = vi.fn();

    renderWorkspaceTable({
      recordColumnWidths: { invoiceNumber: 140, buyerName: 180 },
      tableColumnWidths: { itemDetails: 120, actions: 286 },
      onRecordColumnWidthsChange,
      onTableColumnWidthsChange,
    });

    const itemDetailsHandle = screen.getByRole("button", { name: "调整列宽 商品详情" });

    fireEvent.mouseDown(itemDetailsHandle, { clientX: 420 });
    fireEvent.mouseMove(window, { clientX: 450 });
    fireEvent.mouseUp(window, { clientX: 450 });

    expect(onRecordColumnWidthsChange).toHaveBeenCalledWith({
      invoiceNumber: 140,
      buyerName: 210,
    });
    expect(onTableColumnWidthsChange).toHaveBeenCalledWith({
      itemDetails: 120,
      actions: 286,
    });
  });

  test("keeps submenu text plain when the current column is wide enough", async () => {
    const user = userEvent.setup();
    const itemRows = buildWorkspaceRowStates(
      [
        {
          ...rows[0],
          id: "doc-item-3",
          items: [
            {
              name: "商品名称验证点击展示",
              type: "规格说明",
              unit: "件",
              num: "1",
              unit_price: "100",
              amount: "100",
              tax_rate: "13%",
              tax: "13",
            } as never,
          ],
        },
      ],
      [],
    );

    render(
      <WorkspaceTable
        allSelected={false}
        groups={[{ id: "all", name: "全部记录", rows: itemRows }]}
        expandedGroupIds={["all"]}
        fields={[]}
        fieldOrder={[]}
        recordColumnWidths={{}}
        itemColumnWidths={{ name: 320, type: 140, amount: 120, num: 120, unit_price: 120, tax: 120, tax_rate: 120, unit: 120 }}
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

    await user.click(screen.getByRole("button", { name: "查看商品" }));

    const menu = screen.getByRole("menu", { name: "商品购买详情" });
    expect(within(menu).queryByRole("button", { name: "商品名称验证点击展示" })).toBeNull();
    expect(within(menu).getByText("商品名称验证点击展示")).toBeInTheDocument();
  });

  test("does not truncate submenu text when the current column can still contain it", async () => {
    const user = userEvent.setup();
    const itemRows = buildWorkspaceRowStates(
      [
        {
          ...rows[0],
          id: "doc-item-fit",
          items: [
            {
              name: "商品名称验证点击展示内容",
              type: "规格说明",
              amount: "100",
            } as never,
          ],
        },
      ],
      [],
    );

    render(
      <WorkspaceTable
        allSelected={false}
        groups={[{ id: "all", name: "全部记录", rows: itemRows }]}
        expandedGroupIds={["all"]}
        fields={[]}
        fieldOrder={[]}
        recordColumnWidths={{}}
        itemColumnWidths={{ name: 160, type: 140, amount: 120 }}
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

    await user.click(screen.getByRole("button", { name: "查看商品" }));

    const menu = screen.getByRole("menu", { name: "商品购买详情" });
    expect(within(menu).queryByRole("button", { name: "商品名称验证点击展示内容" })).toBeNull();
    expect(within(menu).getByText("商品名称验证点击展示内容")).toBeInTheDocument();
  });
});
