import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test, vi } from "vitest";
import { WorkspaceDashboardWidgetCard } from "./WorkspaceDashboardWidgetCard";

describe("WorkspaceDashboardWidgetCard", () => {
  test("keeps dashboard widget cards clipped to the shared workspace card radius", () => {
    const stylesheet = readFileSync(resolve(process.cwd(), "src/styles/workspace-dashboard-responsive.css"), "utf8");

    expect(stylesheet).not.toMatch(/\.workspace-card--dashboard-widget\s*\{[^}]*overflow:\s*visible;/s);
  });

  test("renders centered icon nodes inside the circular action buttons", () => {
    render(
      <WorkspaceDashboardWidgetCard
        widget={{
          id: "metric-1",
          type: "metric",
          title: "已报销",
          metrics: ["row_count", "total_amount"],
          conditions: { id: "root", kind: "group", mode: "all", children: [] },
        }}
        viewModel={{
          id: "metric-1",
          type: "metric",
          title: "已报销",
          metrics: ["row_count", "total_amount"],
          totals: { rowCount: 2, totalAmount: 300, taxAmount: 30 },
        }}
        presentation={{ profile: "compact", metricLayout: "compact", chartLayout: "compact" }}
        menuOpen={false}
        dragging={false}
        dragOver={false}
        onOpenDetails={vi.fn()}
        onToggleMenu={vi.fn()}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
        onMenuClose={vi.fn()}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onResizeStart={vi.fn()}
      />,
    );

    expect(within(screen.getByRole("button", { name: "仪表盘“已报销”操作" })).getByText("⋮")).toHaveClass("dashboard-widget__button-icon");
    expect(within(screen.getByRole("button", { name: "调整仪表盘“已报销”大小" })).getByText("⤢")).toHaveClass("dashboard-widget__button-icon");
  });
});
