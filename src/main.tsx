import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import { AgentLab } from "./features/agentLab/ui/AgentLab";
import { resolveAgentLabRoute, type AgentLabRoute } from "./features/agentLab/application/agentLabRoute";
import "./styles/global.css";
import "./styles/workbench.css";
import "./styles/workspace.css";
import "./styles/workspace-surfaces.css";
import "./styles/workspace-data-views.css";
import "./styles/workspace-table.css";
import "./styles/workspace-pxcharts.css";
import "./styles/workspace-pxcharts-grid.css";
import "./styles/workspace-cell-detail-menu.css";
import "./styles/workspace-reference-toolbar.css";
import "./styles/dashboard-layout.css";
import "./styles/workspace-dashboard.css";
import "./styles/workspace-dashboard-responsive.css";
import "./styles/collaboration-workspace.css";
import "./styles/tag-manager.css";
import "./styles/workspace-overlays.css";
import "./styles/agent-lab-shell.css";
import "./styles/agent-lab-storyboard.css";

function AppRoot() {
  const [route, setRoute] = React.useState<AgentLabRoute>(() => resolveAgentLabRoute(window.location.hash));

  React.useEffect(() => {
    const handleHashChange = () => {
      setRoute(resolveAgentLabRoute(window.location.hash));
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return route.kind === "agent-lab" ? <AgentLab page={route.page} /> : <App />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
);
