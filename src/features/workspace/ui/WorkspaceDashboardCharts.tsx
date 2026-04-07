import { useRef, useState, type FocusEvent as ReactFocusEvent, type MouseEvent as ReactMouseEvent } from "react";
import type { DashboardChartLayout } from "../application/dashboardWidgetPresentation";

type DashboardValueItem = {
  id: string;
  label: string;
  value: number;
};

type DashboardChartProps = {
  items: DashboardValueItem[];
  layout: DashboardChartLayout;
};

type DashboardChartTooltipState = {
  label: string;
  value: number;
  x: number;
  y: number;
};

const CHART_COLORS = ["#0d5968", "#1f8a70", "#f4a259", "#d95d39", "#7a4d8b", "#4c6ef5"] as const;
const PIE_CENTER = 60;
const PIE_RADIUS = 42;
const PIE_STROKE_WIDTH = 30;
const PIE_CIRCUMFERENCE = 2 * Math.PI * PIE_RADIUS;

function formatAmount(value: number) {
  return value.toFixed(2);
}

function renderEmptyState(message: string) {
  return <p className="dashboard-chart__empty">{message}</p>;
}

function buildTooltipFromPointer(
  container: HTMLDivElement | null,
  item: DashboardValueItem,
  event: ReactMouseEvent<HTMLElement | SVGCircleElement>,
): DashboardChartTooltipState | null {
  if (!container) {
    return null;
  }
  const rect = container.getBoundingClientRect();
  return {
    label: item.label,
    value: item.value,
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function buildTooltipFromTarget(container: HTMLDivElement | null, item: DashboardValueItem, target: Element): DashboardChartTooltipState | null {
  if (!container) {
    return null;
  }
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  return {
    label: item.label,
    value: item.value,
    x: targetRect.left - containerRect.left + targetRect.width / 2,
    y: targetRect.top - containerRect.top,
  };
}

function DashboardChartTooltip({ tooltip }: { tooltip: DashboardChartTooltipState | null }) {
  if (!tooltip) {
    return null;
  }

  return (
    <div className="dashboard-chart__tooltip" role="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
      <strong>{tooltip.label}</strong>
      <span>{formatAmount(tooltip.value)}</span>
    </div>
  );
}

function useDashboardChartTooltip() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<DashboardChartTooltipState | null>(null);

  const showTooltipAtPointer = (item: DashboardValueItem, event: ReactMouseEvent<HTMLElement | SVGCircleElement>) => {
    setTooltip(buildTooltipFromPointer(containerRef.current, item, event));
  };

  const showTooltipAtTarget = (item: DashboardValueItem, event: ReactFocusEvent<HTMLElement | SVGCircleElement>) => {
    setTooltip(buildTooltipFromTarget(containerRef.current, item, event.currentTarget));
  };

  return {
    containerRef,
    tooltip,
    hideTooltip: () => setTooltip(null),
    showTooltipAtPointer,
    showTooltipAtTarget,
  };
}

export function WorkspaceDashboardBarChart({ items, layout }: DashboardChartProps) {
  const { containerRef, tooltip, hideTooltip, showTooltipAtPointer, showTooltipAtTarget } = useDashboardChartTooltip();
  const sortedItems = [...items].sort((left, right) => right.value - left.value);
  const maxValue = sortedItems[0]?.value ?? 0;

  if (sortedItems.length === 0 || maxValue <= 0) {
    return renderEmptyState("当前条件下暂无可绘制的条形图数据。");
  }

  return (
    <div
      ref={containerRef}
      className={`dashboard-chart dashboard-chart--bar dashboard-chart--layout-${layout}`}
      data-testid="dashboard-bar-chart"
      data-chart-layout={layout}
    >
      {sortedItems.map((item, index) => (
        <div key={item.id} className="dashboard-bar">
          <span className="dashboard-bar__label">{item.label}</span>
          <button
            type="button"
            className="dashboard-bar__track"
            aria-label={`${item.label} ${formatAmount(item.value)}`}
            data-testid={`dashboard-bar-segment-${item.label}`}
            onMouseEnter={(event) => showTooltipAtPointer(item, event)}
            onMouseMove={(event) => showTooltipAtPointer(item, event)}
            onMouseLeave={hideTooltip}
            onFocus={(event) => showTooltipAtTarget(item, event)}
            onBlur={hideTooltip}
          >
            <span
              className="dashboard-bar__fill"
              aria-hidden="true"
              style={{ width: `${(item.value / maxValue) * 100}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
            />
          </button>
        </div>
      ))}
      <DashboardChartTooltip tooltip={tooltip} />
    </div>
  );
}

export function WorkspaceDashboardPieChart({ items, layout }: DashboardChartProps) {
  const { containerRef, tooltip, hideTooltip, showTooltipAtPointer, showTooltipAtTarget } = useDashboardChartTooltip();
  const visibleItems = items.filter((item) => item.value > 0);
  const total = visibleItems.reduce((sum, item) => sum + item.value, 0);

  if (visibleItems.length === 0 || total <= 0) {
    return renderEmptyState("当前条件下暂无可绘制的饼图数据。");
  }

  let offset = 0;
  const segments = visibleItems.map((item, index) => {
    const length = (item.value / total) * PIE_CIRCUMFERENCE;
    const segment = {
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
      length,
      offset,
    };
    offset += length;
    return segment;
  });

  return (
    <div
      ref={containerRef}
      className={`dashboard-chart dashboard-chart--pie dashboard-chart--layout-${layout}`}
      data-testid="dashboard-pie-chart"
      data-chart-layout={layout}
    >
      <div className="dashboard-pie-shell">
        <svg className="dashboard-pie" viewBox="0 0 120 120" aria-label="饼图">
          <circle cx={PIE_CENTER} cy={PIE_CENTER} r={PIE_RADIUS} fill="none" stroke="rgba(17, 27, 41, 0.08)" strokeWidth={PIE_STROKE_WIDTH} />
          {segments.map((segment) => (
            <circle
              key={segment.id}
              cx={PIE_CENTER}
              cy={PIE_CENTER}
              r={PIE_RADIUS}
              fill="none"
              stroke={segment.color}
              strokeWidth={PIE_STROKE_WIDTH}
              strokeDasharray={`${segment.length} ${PIE_CIRCUMFERENCE - segment.length}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${PIE_CENTER} ${PIE_CENTER})`}
              aria-label={`${segment.label} ${formatAmount(segment.value)}`}
              data-testid={`dashboard-pie-segment-${segment.label}`}
              onMouseEnter={(event) => showTooltipAtPointer(segment, event)}
              onMouseMove={(event) => showTooltipAtPointer(segment, event)}
              onMouseLeave={hideTooltip}
              onFocus={(event) => showTooltipAtTarget(segment, event)}
              onBlur={hideTooltip}
            />
          ))}
        </svg>
        <div className="dashboard-pie__center" aria-hidden="true">
          <span>总金额</span>
          <strong>{formatAmount(total)}</strong>
        </div>
      </div>
      <DashboardChartTooltip tooltip={tooltip} />
    </div>
  );
}
