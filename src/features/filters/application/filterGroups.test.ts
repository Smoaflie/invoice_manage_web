import { beforeEach, describe, expect, test } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { createEmptyConditionGroup } from "../../../shared/types/filterGroup";
import { deleteFilterGroup, listFilterGroups, loadDashboardDocument, saveDashboardDocument, saveFilterGroup } from "./filterGroups";

describe("filterGroups", () => {
  beforeEach(async () => {
    await appDb.dashboardDocuments.clear();
    await appDb.filterGroups.clear();
  });

  test("saves filter groups as condition trees and rejects duplicate names", async () => {
    const group = await saveFilterGroup({
      name: "2025报销",
      root: {
        id: "root-2025",
        kind: "group",
        mode: "all",
        children: [{ id: "field-2025", kind: "field", fieldId: "tags", operator: "includes_any", value: ["2025报销"] }],
      },
      now: () => "2026-04-04T00:00:00.000Z",
    });

    await expect(
      saveFilterGroup({
        name: "2025报销",
        root: createEmptyConditionGroup("root-duplicate"),
        now: () => "2026-04-04T00:00:01.000Z",
      }),
    ).rejects.toThrow("筛选组名称已存在。");

    const snapshot = await listFilterGroups();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]).toMatchObject({
      id: group.id,
      name: "2025报销",
      root: expect.objectContaining({
        kind: "group",
      }),
    });
  });

  test("stores filter-group references inside filter groups", async () => {
    const nested = await saveFilterGroup({
      name: "已报销",
      root: {
        id: "root-paid",
        kind: "group",
        mode: "all",
        children: [{ id: "field-paid", kind: "field", fieldId: "tags", operator: "includes_any", value: ["已报销"] }],
      },
      now: () => "2026-04-04T00:00:00.000Z",
    });

    const combined = await saveFilterGroup({
      name: "2025已报销",
      root: {
        id: "root-combined",
        kind: "group",
        mode: "all",
        children: [
          { id: "field-2025", kind: "field", fieldId: "tags", operator: "includes_any", value: ["2025报销"] },
          { id: "ref-paid", kind: "filter_group", filterGroupId: nested.id },
        ],
      },
      now: () => "2026-04-04T00:00:01.000Z",
    });

    expect(combined.root.children).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "filter_group", filterGroupId: nested.id })]),
    );
  });

  test("saves and loads the single dashboard document", async () => {
    await saveDashboardDocument({
      id: "primary",
      createdAt: "2026-04-04T00:00:00.000Z",
      updatedAt: "2026-04-04T00:00:00.000Z",
      widgets: [
        {
          id: "metric-1",
          type: "metric",
          title: "已报销",
          metrics: ["row_count", "total_amount"],
          conditions: createEmptyConditionGroup("metric-root"),
        },
      ],
      layout: [{ widgetId: "metric-1", colSpan: 1, rowSpan: 1, order: 1 }],
    });

    const dashboard = await loadDashboardDocument();
    expect(dashboard).toMatchObject({
      id: "primary",
      widgets: [expect.objectContaining({ id: "metric-1", type: "metric" })],
    });
  });

  test("deletes stored filter groups", async () => {
    const group = await saveFilterGroup({
      name: "作废重开",
      root: createEmptyConditionGroup("root-reopen"),
      now: () => "2026-04-04T00:00:00.000Z",
    });

    await deleteFilterGroup(group.id);
    await expect(listFilterGroups()).resolves.toEqual([]);
  });
});
