import { afterAll, afterEach, describe, expect, test } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { listSavedViews, loadActiveViewId, loadDefaultSavedView, loadSavedView, saveActiveViewId, saveSavedView } from "./savedViews";

describe("savedViews", () => {
  afterEach(async () => {
    await appDb.savedViews.clear();
    await appDb.settings.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  test("saves and loads saved views by scope", async () => {
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

    expect((await listSavedViews("invoices")).map((item) => item.id)).toEqual([view.id]);
    expect(await loadSavedView(view.id)).toMatchObject({ name: "已识别发票" });
    expect(await loadDefaultSavedView("invoices")).toMatchObject({ id: view.id });
  });

  test("stores active view ids in settings", async () => {
    await saveActiveViewId("ui.activeInvoiceViewId", "view-1", () => "2026-03-31T12:00:00.000Z");
    expect(await loadActiveViewId("ui.activeInvoiceViewId")).toBe("view-1");
  });

  test("stores workspace active view ids in settings", async () => {
    await saveActiveViewId("ui.activeWorkspaceViewId", "workspace-view-1", () => "2026-03-31T12:00:00.000Z");
    expect(await loadActiveViewId("ui.activeWorkspaceViewId")).toBe("workspace-view-1");
  });

  test("upserts unnamed-id views by scope and name", async () => {
    const first = await saveSavedView({
      scope: "files",
      name: "待处理文件",
      isDefault: false,
      query: {
        scope: "files",
        searchText: "alpha",
        field: "all",
        sortBy: "updatedAt",
        sortDirection: "desc",
      },
      visibleColumns: [],
      now: () => "2026-03-31T12:00:00.000Z",
    });

    const second = await saveSavedView({
      scope: "files",
      name: "待处理文件",
      isDefault: false,
      query: {
        scope: "files",
        searchText: "beta",
        field: "fileName",
        sortBy: "fileName",
        sortDirection: "asc",
      },
      visibleColumns: [],
      now: () => "2026-03-31T13:00:00.000Z",
    });

    expect(second.id).toBe(first.id);
    expect(await appDb.savedViews.count()).toBe(1);
    expect(await loadSavedView(first.id)).toMatchObject({
      query: expect.objectContaining({
        searchText: "beta",
        field: "fileName",
      }),
    });
  });
});
