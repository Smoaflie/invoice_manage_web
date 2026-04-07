import type { DashboardLayoutItem } from "../../../shared/types/dashboardDocument";

export type DashboardWidgetProfile = "compact" | "wide" | "tall" | "hero";
export type DashboardMetricLayout = "compact" | "wide" | "hero";
export type DashboardChartLayout = "compact" | "wide" | "hero";

export type DashboardWidgetPresentation = {
  profile: DashboardWidgetProfile;
  metricLayout: DashboardMetricLayout;
  chartLayout: DashboardChartLayout;
};

function resolveDashboardWidgetProfile(layoutItem: DashboardLayoutItem): DashboardWidgetProfile {
  if (layoutItem.colSpan === 1 && layoutItem.rowSpan === 1) {
    return "compact";
  }
  if (layoutItem.colSpan === 1) {
    return "tall";
  }
  if (layoutItem.colSpan >= 2 && layoutItem.rowSpan >= 2) {
    return "hero";
  }
  return "wide";
}

export function resolveDashboardWidgetPresentation(layoutItem: DashboardLayoutItem): DashboardWidgetPresentation {
  const profile = resolveDashboardWidgetProfile(layoutItem);
  return {
    profile,
    metricLayout: profile === "hero" ? "hero" : profile === "wide" ? "wide" : "compact",
    chartLayout: profile === "hero" ? "hero" : profile === "wide" ? "wide" : "compact",
  };
}
