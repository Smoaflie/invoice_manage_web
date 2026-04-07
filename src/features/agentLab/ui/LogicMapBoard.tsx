import type { LogicEdge, LogicLane, LogicNode, PlannedChange, RoleFlowStep } from "../application/logicMapBlueprint";

type LogicMapBoardProps = {
  blueprint: {
    lanes: LogicLane[];
    nodes: LogicNode[];
    edges: LogicEdge[];
    plannedChanges: PlannedChange[];
    roleFlows: {
      employee: { title: string; steps: RoleFlowStep[] };
      finance: { title: string; steps: RoleFlowStep[] };
    };
  };
};

function findNodeTitle(nodes: LogicNode[], id: string) {
  return nodes.find((node) => node.id === id)?.title ?? id;
}

export function LogicMapBoard({ blueprint }: LogicMapBoardProps) {
  return (
    <section className="agent-lab__logic" aria-label="逻辑地图">
      <div className="agent-lab__logic-lanes">
        {blueprint.lanes.map((lane) => (
          <section key={lane.id} className="agent-lab__lane">
            <header className="agent-lab__lane-header">
              <p>{lane.label}</p>
              <small>{lane.description}</small>
            </header>

            <div className="agent-lab__lane-stack">
              {blueprint.nodes
                .filter((node) => node.laneId === lane.id)
                .map((node) => (
                  <article key={node.id} className="agent-lab__node">
                    <div className="agent-lab__node-head">
                      <h2>{node.title}</h2>
                      <span>{lane.label}</span>
                    </div>
                    <p>{node.summary}</p>
                    <dl className="agent-lab__node-meta">
                      <div>
                        <dt>作用范围</dt>
                        <dd>{node.scope}</dd>
                      </div>
                      <div>
                        <dt>输入</dt>
                        <dd>{node.inputs.join(" / ") || "无"}</dd>
                      </div>
                      <div>
                        <dt>输出</dt>
                        <dd>{node.outputs.join(" / ") || "无"}</dd>
                      </div>
                      <div>
                        <dt>副作用</dt>
                        <dd>{node.sideEffects.join(" / ") || "无"}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>

      <aside className="agent-lab__logic-side">
        <section className="agent-lab__panel">
          <h2>当前链路</h2>
          <ol className="agent-lab__edge-list">
            {blueprint.edges.map((edge) => (
              <li key={`${edge.from}-${edge.to}`}>
                <strong>{findNodeTitle(blueprint.nodes, edge.from)}</strong>
                <span>{edge.label}</span>
                <strong>{findNodeTitle(blueprint.nodes, edge.to)}</strong>
              </li>
            ))}
          </ol>
        </section>

        <section className="agent-lab__panel">
          <h2>计划修改</h2>
          <div className="agent-lab__plan-list">
            {blueprint.plannedChanges.map((item) => (
              <article key={item.title} className="agent-lab__plan-item">
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <small>{item.impact}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="agent-lab__panel">
          <h2>角色流程</h2>
          <div className="agent-lab__role-flow-grid">
            {Object.values(blueprint.roleFlows).map((flow) => (
              <section key={flow.title} className="agent-lab__role-flow">
                <h3>{flow.title}</h3>
                <ol>
                  {flow.steps.map((step) => (
                    <li key={step.title}>
                      <strong>{step.title}</strong>
                      <span>{step.detail}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </section>
      </aside>
    </section>
  );
}
