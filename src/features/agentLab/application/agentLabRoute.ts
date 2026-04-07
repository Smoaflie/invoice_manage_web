export type AgentLabRoute =
  | { kind: "app" }
  | {
      kind: "agent-lab";
      page: "logic" | "mock";
    };

export function resolveAgentLabRoute(hash: string): AgentLabRoute {
  if (hash === "#/agent-lab/logic") {
    return { kind: "agent-lab", page: "logic" };
  }

  if (hash === "#/agent-lab/mock") {
    return { kind: "agent-lab", page: "mock" };
  }

  return { kind: "app" };
}
