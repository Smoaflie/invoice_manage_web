import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AgentLab } from "./AgentLab";

describe("AgentLab", () => {
  it("renders the logic map with planned modifications", () => {
    render(<AgentLab page="logic" />);

    expect(screen.getByRole("heading", { name: "Invoice Workbench Agent Lab" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dashboard Shell" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "工作区查询模型" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "从编排器中抽出状态机输入输出" })).toBeInTheDocument();
    expect(screen.getByText("员工流程")).toBeInTheDocument();
    expect(screen.getByText("财务流程")).toBeInTheDocument();
  });

  it("renders the storyboard, switches roles, and opens mock overlay panels", async () => {
    const user = userEvent.setup();
    render(<AgentLab page="mock" />);

    expect(screen.getByRole("heading", { name: "Workspace UI Storyboard" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: "INV-2026-001 上海研发中心 1,280.00 待提交 待报销 / 硬件" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "员工提交态" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("提交前预览")).toBeInTheDocument();
    expect(screen.getByText("命中快照后将被排除")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "筛选" }));
    expect(screen.getByRole("dialog", { name: "筛选器" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "财务审核态" }));
    expect(screen.getByRole("button", { name: "财务审核态" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("接收门控")).toBeInTheDocument();
    expect(screen.getByText("整批接收当前不可用")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "字段" }));
    expect(screen.getByRole("dialog", { name: "字段菜单" })).toBeInTheDocument();
  });
});
