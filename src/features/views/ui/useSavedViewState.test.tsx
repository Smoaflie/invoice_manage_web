import { act, renderHook, waitFor } from "@testing-library/react";
import { afterAll, afterEach, describe, expect, test } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { createEmptyConditionGroup } from "../../../shared/types/filterGroup";
import type { InvoiceSavedViewQuery, WorkspaceSavedViewQuery } from "../../../shared/types/savedView";
import type { InvoiceColumnKey } from "../../dashboard/ui/invoiceColumnOptions";
import { createDefaultWorkspaceViewQuery } from "../application/defaultSavedViews";
import { useSavedViewState } from "./useSavedViewState";

function createInvoiceQuery(overrides: Partial<InvoiceSavedViewQuery> = {}): InvoiceSavedViewQuery {
  return {
    scope: "invoices",
    searchText: "",
    status: "all",
    tag: "",
    tagGroupId: "",
    ruleId: "",
    sortBy: "updatedAt",
    sortDirection: "desc",
    ...overrides,
  };
}

function createWorkspaceQuery(overrides: Partial<WorkspaceSavedViewQuery> = {}): WorkspaceSavedViewQuery {
  return {
    scope: "workspace",
    searchText: "",
    conditionRoot: createEmptyConditionGroup(),
    sorters: [{ fieldId: "updatedAt", direction: "desc" }],
    groupByFieldId: "",
    fieldOrder: [],
    recordColumnWidths: {},
    itemColumnWidths: {},
    ...overrides,
  };
}

describe("useSavedViewState", () => {
  afterEach(async () => {
    await appDb.savedViews.clear();
    await appDb.settings.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  test("loads the default saved view when there is no active selection", async () => {
    await appDb.savedViews.add({
      id: "view-default",
      scope: "invoices",
      name: "默认发票视图",
      isDefault: true,
      query: createInvoiceQuery({ searchText: "globex", status: "parsed" }),
      visibleColumns: ["invoiceNumber", "buyerName"],
      createdAt: "2026-03-31T10:00:00.000Z",
      updatedAt: "2026-03-31T10:00:00.000Z",
    });

    const { result } = renderHook(() =>
      useSavedViewState<InvoiceSavedViewQuery, InvoiceColumnKey>({
        scope: "invoices",
        activeViewKey: "ui.activeInvoiceViewId",
        createDefaultQuery: () => createInvoiceQuery(),
        createDefaultVisibleColumns: () => ["invoiceNumber"],
      }),
    );

    await waitFor(() => expect(result.current.activeViewId).toBe("view-default"));
    expect(result.current.query).toMatchObject({
      searchText: "globex",
      status: "parsed",
    });
    expect(result.current.visibleColumns).toEqual(["invoiceNumber", "buyerName"]);
  });

  test("saves current state as the default view when no saved view is active", async () => {
    const { result } = renderHook(() =>
      useSavedViewState<InvoiceSavedViewQuery, InvoiceColumnKey>({
        scope: "invoices",
        activeViewKey: "ui.activeInvoiceViewId",
        createDefaultQuery: () => createInvoiceQuery(),
        createDefaultVisibleColumns: () => ["invoiceNumber"],
      }),
    );

    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => {
      result.current.setQuery((current) => ({ ...current, searchText: "acme", status: "needs_attention" }));
      result.current.setVisibleColumns(["invoiceNumber", "tags"]);
    });
    await act(async () => {
      await result.current.saveCurrentView();
    });

    await waitFor(() => expect(result.current.activeViewId).not.toBe(""));
    const savedViews = await appDb.savedViews.toArray();
    expect(savedViews).toHaveLength(1);
    expect(savedViews[0]).toMatchObject({
      name: "默认发票视图",
      isDefault: true,
      visibleColumns: ["invoiceNumber", "tags"],
      query: expect.objectContaining({
        searchText: "acme",
        status: "needs_attention",
      }),
    });
  });

  test("loads builtin workspace defaults when there is no saved workspace view", async () => {
    const { result } = renderHook(() =>
      useSavedViewState<WorkspaceSavedViewQuery>({
        scope: "workspace",
        activeViewKey: "ui.activeWorkspaceViewId",
        createDefaultQuery: createDefaultWorkspaceViewQuery,
        createDefaultVisibleColumns: () => ["invoiceNumber", "remark", "annotation"],
      }),
    );

    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.activeViewId).toBe("");
    expect(result.current.query).toEqual(createWorkspaceQuery());
    expect(result.current.visibleColumns).toEqual(["invoiceNumber", "remark", "annotation"]);
  });

  test("persists workspace views and can promote one to default", async () => {
    const { result } = renderHook(() =>
      useSavedViewState<WorkspaceSavedViewQuery>({
        scope: "workspace",
        activeViewKey: "ui.activeWorkspaceViewId",
        createDefaultQuery: createDefaultWorkspaceViewQuery,
        createDefaultVisibleColumns: () => ["invoiceNumber", "remark"],
      }),
    );

    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => {
      result.current.setDraftName("备注筛选");
      result.current.setQuery((current) => ({
        ...current,
        searchText: "原始备注",
        groupByFieldId: "parseStatus",
        fieldOrder: ["invoiceNumber", "remark", "annotation"],
        recordColumnWidths: { invoiceNumber: 160, remark: 220 },
        itemColumnWidths: { name: 240, amount: 120 },
        tableColumnWidths: { itemDetails: 148, actions: 258 },
      }));
      result.current.setVisibleColumns(["invoiceNumber", "remark", "annotation"]);
    });

    await act(async () => {
      await result.current.saveAsNewView();
    });

    await waitFor(() => expect(result.current.activeViewId).not.toBe(""));
    expect(result.current.views).toHaveLength(1);
    expect(result.current.views[0]).toMatchObject({
      name: "备注筛选",
      isDefault: false,
      query: expect.objectContaining({
        searchText: "原始备注",
        groupByFieldId: "parseStatus",
        fieldOrder: ["invoiceNumber", "remark", "annotation"],
        recordColumnWidths: { invoiceNumber: 160, remark: 220 },
        itemColumnWidths: { name: 240, amount: 120 },
        tableColumnWidths: { itemDetails: 148, actions: 258 },
      }),
      visibleColumns: ["invoiceNumber", "remark", "annotation"],
    });

    await act(async () => {
      await result.current.setDefaultView();
    });

    await waitFor(() => expect(result.current.views[0]?.isDefault).toBe(true));
    expect(await appDb.settings.get("ui.activeWorkspaceViewId")).toMatchObject({ value: result.current.activeViewId });
  });
});
