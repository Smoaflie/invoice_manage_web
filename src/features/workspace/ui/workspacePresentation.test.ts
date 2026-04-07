import { describe, expect, it } from "vitest";
import { getWorkspacePresentation } from "./workspacePresentation";

describe("workspacePresentation", () => {
  it("returns action-oriented empty state copy for records", () => {
    const presentation = getWorkspacePresentation("records", 0);

    expect(presentation.commandDeck.primaryActionLabel).toBe("导入数据");
    expect(presentation.emptyState.title).toContain("导入");
    expect(presentation.emptyState.bullets.length).toBeGreaterThanOrEqual(2);
  });

  it("returns kanban and dashboard specific guidance", () => {
    expect(getWorkspacePresentation("kanban", 0).emptyState.title).toContain("看板");
    expect(getWorkspacePresentation("dashboard", 0).emptyState.title).toContain("仪表盘");
  });

  it("marks non-empty views as active work states", () => {
    expect(getWorkspacePresentation("records", 3).emptyState.tone).toBe("active");
    expect(getWorkspacePresentation("kanban", 2).emptyState.tone).toBe("active");
  });
});
