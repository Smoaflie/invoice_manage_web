import { describe, expect, it } from "vitest";
import { resolveAgentLabRoute } from "./agentLabRoute";

describe("resolveAgentLabRoute", () => {
  it("routes the logic hash to the agent-lab logic page", () => {
    expect(resolveAgentLabRoute("#/agent-lab/logic")).toEqual({
      kind: "agent-lab",
      page: "logic",
    });
  });

  it("routes the mock hash to the agent-lab mock page", () => {
    expect(resolveAgentLabRoute("#/agent-lab/mock")).toEqual({
      kind: "agent-lab",
      page: "mock",
    });
  });

  it("falls back to the main app for unrelated hashes", () => {
    expect(resolveAgentLabRoute("#/records")).toEqual({ kind: "app" });
    expect(resolveAgentLabRoute("")).toEqual({ kind: "app" });
  });
});
