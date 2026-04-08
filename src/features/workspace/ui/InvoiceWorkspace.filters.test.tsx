import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { buildRow, renderInvoiceWorkspace, resetInvoiceWorkspaceMocks } from "./InvoiceWorkspace.testUtils";

describe("InvoiceWorkspace filter dialog", () => {
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

  test("uses a merged target selector and row-local add buttons for field rules", async () => {
    const user = userEvent.setup();

    renderInvoiceWorkspace({
      invoiceDocuments: [
        buildRow({ id: "doc-1", fileName: "east.pdf", buyerName: "华东买方", invoiceNumber: "INV-001" }),
        buildRow({ id: "doc-2", fileName: "north.pdf", buyerName: "华北买方", invoiceNumber: "INV-002", updatedAt: "2026-03-31T01:00:00.000Z" }),
      ],
    });

    await user.click(await screen.findByRole("button", { name: "筛选" }));
    await user.selectOptions(screen.getByLabelText("规则目标"), "field:buyerName");
    await user.selectOptions(screen.getByLabelText("筛选条件"), "contains");
    await user.type(screen.getByLabelText("筛选值"), "华北");

    const list = screen.getByRole("list", { name: "筛选规则列表" });
    expect(within(list).queryByRole("button", { name: "添加规则" })).toBeNull();
    expect(within(list).getAllByRole("button", { name: "X" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "添加规则" })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "添加规则" }));
    expect(within(list).getAllByRole("button", { name: "X" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "添加规则" })).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "应用筛选" }));

    await waitFor(() => {
      expect(screen.queryByDisplayValue("华东买方")).not.toBeInTheDocument();
      expect(screen.getByDisplayValue("华北买方")).toBeInTheDocument();
    });
  });

  test("marks field rules with the 1:1:2 compact layout hooks", async () => {
    const user = userEvent.setup();

    renderInvoiceWorkspace();

    await user.click(await screen.findByRole("button", { name: "筛选" }));

    const row = screen.getByLabelText("规则目标").closest('[role="listitem"]');
    expect(row).toHaveClass("workspace-dialog__list-item--filter-1-1-2");
    expect(row).toHaveClass("workspace-dialog__list-item--filter-compact");
    expect(screen.getByLabelText("筛选条件").closest("label")).toHaveClass("workspace-dialog__field--operator");
    expect(within(row as HTMLElement).getByRole("button", { name: "X" }).parentElement).toHaveClass("workspace-dialog__row-actions--centered");
    expect(within(row as HTMLElement).getByRole("button", { name: "X" })).toHaveClass("workspace-dialog__remove-button--compact");
  });

  test("keeps only item brief available in the merged target selector while item detail stays searchable", async () => {
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

  test("filters fixed-status fields through a single-select value input with bilingual labels", async () => {
    const user = userEvent.setup();

    renderInvoiceWorkspace({
      invoiceDocuments: [
        buildRow({ id: "doc-1", fileName: "idle.pdf", parseStatus: "idle", invoiceNumber: "INV-001" }),
        buildRow({ id: "doc-2", fileName: "parsed.pdf", parseStatus: "parsed", invoiceNumber: "INV-002", updatedAt: "2026-03-31T01:00:00.000Z" }),
      ],
    });

    await user.click(await screen.findByRole("button", { name: "筛选" }));
    await user.selectOptions(screen.getByLabelText("规则目标"), "field:parseStatus");
    expect(screen.getByRole("option", { name: "已识别 (parsed)" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("筛选值"), "parsed");
    await user.click(screen.getByRole("button", { name: "应用筛选" }));

    await waitFor(() => {
      expect(screen.queryByDisplayValue("INV-001")).not.toBeInTheDocument();
      expect(screen.getByDisplayValue("INV-002")).toBeInTheDocument();
    });
  });

  test("uses the merged selector for filter-group rules", async () => {
    const user = userEvent.setup();

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
    await user.selectOptions(screen.getByLabelText("规则目标"), "filter_group");
    await user.selectOptions(screen.getByLabelText("筛选组"), "group-north");
    await user.click(screen.getByRole("button", { name: "应用筛选" }));

    await waitFor(() => {
      expect(screen.queryByDisplayValue("华东买方")).not.toBeInTheDocument();
      expect(screen.getByDisplayValue("华北买方")).toBeInTheDocument();
    });
  });

  test("shows and edits the selected filter group's rules inside the configuration view while keeping save-as available", async () => {
    const user = userEvent.setup();

    await appDb.filterGroups.bulkPut([
      {
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
      },
      {
        id: "group-south",
        name: "华南买方",
        root: {
          id: "root-south",
          kind: "group",
          mode: "all",
          children: [{ id: "south-field", kind: "field", fieldId: "buyerName", operator: "contains", value: "华南" }],
        },
        createdAt: "2026-04-04T00:00:01.000Z",
        updatedAt: "2026-04-04T00:00:01.000Z",
      },
    ]);

    renderInvoiceWorkspace({
      invoiceDocuments: [
        buildRow({ id: "doc-1", buyerName: "华东买方", invoiceNumber: "INV-001" }),
        buildRow({ id: "doc-2", buyerName: "华北买方", invoiceNumber: "INV-002", updatedAt: "2026-03-31T01:00:00.000Z" }),
      ],
    });

    await user.click(await screen.findByRole("button", { name: "筛选" }));
    await user.click(screen.getByRole("button", { name: "配置筛选组" }));

    expect(screen.getByRole("heading", { name: "配置筛选组" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("已有筛选组"), "group-north");
    const configList = await screen.findByRole("list", { name: "筛选组规则列表" });
    expect(within(configList).getAllByRole("button", { name: "X" })).toHaveLength(1);
    expect(screen.getByLabelText("筛选值")).toHaveValue("华北");
    expect(screen.getByRole("button", { name: "另存为" })).toBeInTheDocument();
    await user.clear(screen.getByLabelText("筛选值"));
    await user.type(screen.getByLabelText("筛选值"), "华中");
    await user.click(screen.getByRole("button", { name: "加载到当前规则" }));
    await user.click(screen.getByRole("button", { name: "保存" }));
    await user.type(screen.getByLabelText("另存为名称"), "华北买方-副本");
    await user.click(screen.getByRole("button", { name: "另存为" }));
    await user.click(screen.getByRole("button", { name: "返回规则" }));

    expect(screen.getByRole("list", { name: "筛选规则列表" })).toBeInTheDocument();
    expect(screen.getByLabelText("筛选值")).toHaveValue("华中");

    await waitFor(async () => {
      const north = await appDb.filterGroups.get("group-north");
      const groups = await appDb.filterGroups.toArray();
      expect(north?.root.children).toEqual([
        expect.objectContaining({ kind: "field", fieldId: "buyerName", value: "华中" }),
      ]);
      expect(groups.some((group) => group.name === "华北买方-副本" && group.root.children[0]?.kind === "field" && group.root.children[0]?.value === "华中")).toBe(true);
    });
  });

  test("uses the row-end X button to delete a rule while keeping add below the list", async () => {
    const user = userEvent.setup();

    renderInvoiceWorkspace();

    await user.click(await screen.findByRole("button", { name: "筛选" }));
    await user.click(screen.getByRole("button", { name: "添加规则" }));

    const list = screen.getByRole("list", { name: "筛选规则列表" });
    expect(within(list).getAllByRole("button", { name: "X" })).toHaveLength(2);

    await user.click(within(list).getAllByRole("button", { name: "X" })[1]);

    expect(within(list).getAllByRole("button", { name: "X" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "添加规则" })).toHaveLength(1);
  });
});
