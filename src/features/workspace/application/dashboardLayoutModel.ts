import type { DashboardLayoutItem } from "../../../shared/types/dashboardDocument";

const DASHBOARD_COL_STEP = 220;
const DASHBOARD_ROW_STEP = 150;

type DashboardResizeStep = {
  columnStep?: number;
  rowStep?: number;
};

function clampSpan(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function resolveResizeStep(value: number | undefined, fallback: number) {
  return value && Number.isFinite(value) && value > 0 ? value : fallback;
}

function sortLayout(layout: DashboardLayoutItem[]) {
  return [...layout].sort((left, right) => left.order - right.order);
}

function resequenceLayout(layout: DashboardLayoutItem[]) {
  return layout.map((item, index) => ({ ...item, order: index + 1 }));
}

export function replaceDashboardLayoutItem(layout: DashboardLayoutItem[], nextItem: DashboardLayoutItem) {
  return resequenceLayout(sortLayout(layout).map((item) => (item.widgetId === nextItem.widgetId ? nextItem : item)));
}

export function moveDashboardLayoutItem(layout: DashboardLayoutItem[], fromWidgetId: string, toWidgetId: string) {
  if (fromWidgetId === toWidgetId) {
    return resequenceLayout(layout);
  }

  const ordered = sortLayout(layout);
  const fromIndex = ordered.findIndex((item) => item.widgetId === fromWidgetId);
  const toIndex = ordered.findIndex((item) => item.widgetId === toWidgetId);
  if (fromIndex < 0 || toIndex < 0) {
    return resequenceLayout(layout);
  }

  const next = [...ordered];
  const [movedItem] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, movedItem);
  return resequenceLayout(next);
}

export function resizeDashboardLayoutItem(
  layout: DashboardLayoutItem[],
  widgetId: string,
  input: { deltaX: number; deltaY: number },
  resizeStep?: DashboardResizeStep,
) {
  const item = layout.find((layoutItem) => layoutItem.widgetId === widgetId);
  if (!item) {
    return null;
  }

  const columnStep = resolveResizeStep(resizeStep?.columnStep, DASHBOARD_COL_STEP);
  const rowStep = resolveResizeStep(resizeStep?.rowStep, DASHBOARD_ROW_STEP);

  return {
    ...item,
    colSpan: clampSpan(item.colSpan + Math.round(input.deltaX / columnStep), 1, 4) as DashboardLayoutItem["colSpan"],
    rowSpan: clampSpan(item.rowSpan + Math.round(input.deltaY / rowStep), 1, 3) as DashboardLayoutItem["rowSpan"],
  };
}
