import { describe, expect, it } from "vitest";
import { agentLogicMapBlueprint } from "./logicMapBlueprint";

describe("agentLogicMapBlueprint", () => {
  it("keeps nodes on known lanes and provides scope text", () => {
    const laneIds = new Set(agentLogicMapBlueprint.lanes.map((lane) => lane.id));

    for (const node of agentLogicMapBlueprint.nodes) {
      expect(laneIds.has(node.laneId)).toBe(true);
      expect(node.scope.length).toBeGreaterThan(0);
      expect(node.summary.length).toBeGreaterThan(0);
    }
  });

  it("connects only existing nodes", () => {
    const nodeIds = new Set(agentLogicMapBlueprint.nodes.map((node) => node.id));

    for (const edge of agentLogicMapBlueprint.edges) {
      expect(nodeIds.has(edge.from)).toBe(true);
      expect(nodeIds.has(edge.to)).toBe(true);
    }
  });

  it("includes planned modifications for both state and ui decoupling", () => {
    const plannedTitles = agentLogicMapBlueprint.plannedChanges.map((item) => item.title);

    expect(plannedTitles).toContain("从编排器中抽出状态机输入输出");
    expect(plannedTitles).toContain("建立零副作用 UI 样板页");
  });

  it("includes role workflow chains for employee and finance", () => {
    const employeeSteps = agentLogicMapBlueprint.roleFlows.employee.steps.map((step) => step.title);
    const financeSteps = agentLogicMapBlueprint.roleFlows.finance.steps.map((step) => step.title);

    expect(employeeSteps).toEqual(["导入快照", "命中打标", "生成批次", "等待回执"]);
    expect(financeSteps).toEqual(["生成快照", "接收批次", "处理异常", "整批决策"]);
  });
});
