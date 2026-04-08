import { afterAll, afterEach, describe, expect, test } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { createEmptyConditionGroup } from "../../../shared/types/filterGroup";
import { clearWorkspaceViewDraft, loadWorkspaceViewDraft, saveWorkspaceViewDraft } from "./workspaceViewDrafts";

describe("workspaceViewDrafts", () => {
  afterEach(async () => {
    await appDb.settings.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  test("saves, loads, and clears a workspace view draft", async () => {
    await saveWorkspaceViewDraft(
      "workspace-view-1",
      {
        query: {
          scope: "workspace",
          searchText: "华北",
          conditionRoot: createEmptyConditionGroup(),
          sorters: [{ fieldId: "updatedAt", direction: "desc" }],
          groupByFieldId: "",
          fieldOrder: ["invoiceNumber", "buyerName"],
          recordColumnWidths: { invoiceNumber: 180 },
          itemColumnWidths: { name: 160 },
        },
        visibleColumns: ["invoiceNumber", "buyerName"],
      },
      () => "2026-04-08T00:00:00.000Z",
    );

    await expect(loadWorkspaceViewDraft("workspace-view-1")).resolves.toEqual({
      query: expect.objectContaining({
        searchText: "华北",
        fieldOrder: ["invoiceNumber", "buyerName"],
      }),
      visibleColumns: ["invoiceNumber", "buyerName"],
    });

    await clearWorkspaceViewDraft("workspace-view-1");

    await expect(loadWorkspaceViewDraft("workspace-view-1")).resolves.toBeNull();
  });
});
