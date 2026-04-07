import { describe, expect, test } from "vitest";
import type { DashboardLayoutItem } from "../../../shared/types/dashboardDocument";
import { moveDashboardLayoutItem, resizeDashboardLayoutItem } from "./dashboardLayoutModel";

const layout: DashboardLayoutItem[] = [
  { widgetId: "metric-1", colSpan: 1, rowSpan: 1, order: 1 },
  { widgetId: "bar-1", colSpan: 2, rowSpan: 1, order: 2 },
  { widgetId: "pie-1", colSpan: 1, rowSpan: 1, order: 3 },
];

describe("dashboardLayoutModel", () => {
  test("reorders layout items when a widget is dropped onto another widget", () => {
    expect(moveDashboardLayoutItem(layout, "pie-1", "metric-1")).toEqual([
      { widgetId: "pie-1", colSpan: 1, rowSpan: 1, order: 1 },
      { widgetId: "metric-1", colSpan: 1, rowSpan: 1, order: 2 },
      { widgetId: "bar-1", colSpan: 2, rowSpan: 1, order: 3 },
    ]);
  });

  test("resizes layout spans from drag deltas and clamps them into the supported range", () => {
    expect(resizeDashboardLayoutItem(layout, "metric-1", { deltaX: 260, deltaY: 170 })).toEqual(
      expect.objectContaining({ widgetId: "metric-1", colSpan: 2, rowSpan: 2 }),
    );
    expect(resizeDashboardLayoutItem(layout, "metric-1", { deltaX: 80, deltaY: 70 }, { columnStep: 96, rowStep: 120 })).toEqual(
      expect.objectContaining({ widgetId: "metric-1", colSpan: 2, rowSpan: 2 }),
    );
    expect(resizeDashboardLayoutItem(layout, "bar-1", { deltaX: 999, deltaY: 999 })).toEqual(
      expect.objectContaining({ widgetId: "bar-1", colSpan: 4, rowSpan: 3 }),
    );
    expect(resizeDashboardLayoutItem(layout, "pie-1", { deltaX: -999, deltaY: -999 })).toEqual(
      expect.objectContaining({ widgetId: "pie-1", colSpan: 1, rowSpan: 1 }),
    );
  });
});
