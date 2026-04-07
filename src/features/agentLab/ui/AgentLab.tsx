import { agentLogicMapBlueprint } from "../application/logicMapBlueprint";
import { uiStoryboardScenario } from "../application/uiStoryboardScenario";
import { LogicMapBoard } from "./LogicMapBoard";
import { UiStoryboard } from "./UiStoryboard";

type AgentLabProps = {
  page: "logic" | "mock";
};

const PAGE_META = {
  logic: {
    label: "Logic Map",
    href: "#/agent-lab/logic",
    eyebrow: "AI Planning Surface",
  },
  mock: {
    label: "UI Storyboard",
    href: "#/agent-lab/mock",
    eyebrow: "Fast Mock Surface",
  },
} as const;

export function AgentLab({ page }: AgentLabProps) {
  return (
    <main className="agent-lab">
      <header className="agent-lab__header">
        <div className="agent-lab__header-copy">
          <p className="agent-lab__eyebrow">{PAGE_META[page].eyebrow}</p>
          <h1>{page === "logic" ? agentLogicMapBlueprint.title : uiStoryboardScenario.title}</h1>
          <p>{page === "logic" ? agentLogicMapBlueprint.summary : uiStoryboardScenario.caption}</p>
        </div>

        <nav className="agent-lab__nav" aria-label="Agent Lab 页面">
          <a className={page === "logic" ? "agent-lab__nav-link agent-lab__nav-link--active" : "agent-lab__nav-link"} href={PAGE_META.logic.href}>
            {PAGE_META.logic.label}
          </a>
          <a className={page === "mock" ? "agent-lab__nav-link agent-lab__nav-link--active" : "agent-lab__nav-link"} href={PAGE_META.mock.href}>
            {PAGE_META.mock.label}
          </a>
        </nav>
      </header>

      {page === "logic" ? <LogicMapBoard blueprint={agentLogicMapBlueprint} /> : <UiStoryboard scenario={uiStoryboardScenario} />}
    </main>
  );
}
