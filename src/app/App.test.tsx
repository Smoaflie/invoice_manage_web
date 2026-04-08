import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../features/dashboard/ui/Dashboard", () => ({
  Dashboard: ({
    activeView,
    onSidebarStatusChange,
  }: {
    activeView: string;
    onSidebarStatusChange?: (status: { message: string; stats: string[] }) => void;
  }) => {
    useEffect(() => {
      onSidebarStatusChange?.({
        message: activeView === "records" ? "本地工作台数据已加载。" : `${activeView} 视图已加载。`,
        stats: activeView === "records" ? ["12 条记录", "7 条结果", "2 条已选"] : ["0 条记录"],
      });
    }, [activeView, onSidebarStatusChange]);

    return <div data-testid="dashboard-shell">{activeView}</div>;
  },
}));

import { App } from "./App";

describe("App", () => {
  it("renders the shell and lets users switch workbench pages", async () => {
    render(<App />);
    const user = userEvent.setup();

    expect(screen.getByRole("button", { name: "记录 多维表格" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "仪表盘 综合视图" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "协作 同步会话" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "配置中心 OCR API" })).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-shell")).toHaveTextContent("records");
    expect(screen.getByText("本地工作台数据已加载。")).toBeInTheDocument();
    expect(screen.getByText("12 条记录")).toBeInTheDocument();
    expect(screen.getByText("7 条结果")).toBeInTheDocument();
    expect(screen.getByText("2 条已选")).toBeInTheDocument();
    expect(screen.queryByText("1 项待保存")).toBeNull();

    await user.click(screen.getByRole("button", { name: "仪表盘 综合视图" }));
    expect(screen.getByTestId("dashboard-shell")).toHaveTextContent("dashboard");
    expect(screen.getByText("dashboard 视图已加载。")).toBeInTheDocument();
    expect(screen.getByText("0 条记录")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "协作 同步会话" }));
    expect(screen.getByTestId("dashboard-shell")).toHaveTextContent("collaboration");

    await user.click(screen.getByRole("button", { name: "配置中心 OCR API" }));
    expect(screen.getByTestId("dashboard-shell")).toHaveTextContent("settings");
    expect(screen.getByRole("heading", { name: "配置中心" })).toBeInTheDocument();
    expect(screen.getByText("Operations Room")).toBeInTheDocument();
    expect(screen.getByText("本地工作台")).toBeInTheDocument();

    expect(screen.getByTestId("dashboard-shell")).toBeInTheDocument();
  });
});
