import { describe, expect, test } from "vitest";
import { resolveDashboardWidgetPresentation } from "./dashboardWidgetPresentation";

describe("dashboardWidgetPresentation", () => {
  test("maps layout spans into compact, wide, tall, and hero display profiles", () => {
    expect(resolveDashboardWidgetPresentation({ widgetId: "metric", colSpan: 1, rowSpan: 1, order: 1 })).toEqual(
      expect.objectContaining({ profile: "compact", metricLayout: "compact", chartLayout: "compact" }),
    );
    expect(resolveDashboardWidgetPresentation({ widgetId: "bar", colSpan: 2, rowSpan: 1, order: 2 })).toEqual(
      expect.objectContaining({ profile: "wide", metricLayout: "wide", chartLayout: "wide" }),
    );
    expect(resolveDashboardWidgetPresentation({ widgetId: "kanban", colSpan: 1, rowSpan: 2, order: 3 })).toEqual(
      expect.objectContaining({ profile: "tall", metricLayout: "compact", chartLayout: "compact" }),
    );
    expect(resolveDashboardWidgetPresentation({ widgetId: "pie", colSpan: 2, rowSpan: 2, order: 4 })).toEqual(
      expect.objectContaining({ profile: "hero", metricLayout: "hero", chartLayout: "hero" }),
    );
  });
});
