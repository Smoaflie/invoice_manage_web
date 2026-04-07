import { describe, expect, it } from "vitest";
import { uiStoryboardScenario } from "./uiStoryboardScenario";

describe("uiStoryboardScenario", () => {
  it("defines role presets with toolbar groups, fake rows, and overlay menus", () => {
    expect(uiStoryboardScenario.presets.employee.toolbarGroups.length).toBeGreaterThanOrEqual(3);
    expect(uiStoryboardScenario.presets.employee.rows.length).toBeGreaterThanOrEqual(3);
    expect(uiStoryboardScenario.presets.finance.rows.length).toBeGreaterThanOrEqual(3);
    expect(uiStoryboardScenario.presets.finance.menus.filter((menu) => menu.kind === "secondary").length).toBeGreaterThanOrEqual(1);
  });

  it("provides employee preview and finance gate sections", () => {
    expect(uiStoryboardScenario.presets.employee.preview.title).toContain("提交前预览");
    expect(uiStoryboardScenario.presets.employee.preview.groups.length).toBeGreaterThanOrEqual(2);
    expect(uiStoryboardScenario.presets.finance.gate.title).toContain("接收门控");
    expect(uiStoryboardScenario.presets.finance.gate.reasons.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps inspector summaries for both roles", () => {
    expect(uiStoryboardScenario.presets.employee.inspector.title.length).toBeGreaterThan(0);
    expect(uiStoryboardScenario.presets.employee.inspector.sections.length).toBeGreaterThanOrEqual(2);
    expect(uiStoryboardScenario.presets.finance.inspector.title.length).toBeGreaterThan(0);
    expect(uiStoryboardScenario.presets.finance.inspector.sections.length).toBeGreaterThanOrEqual(2);
  });
});
