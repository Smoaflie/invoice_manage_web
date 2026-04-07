import type { WorkspacePresentation } from "./workspacePresentation";

type WorkspaceEmptyStateProps = {
  emptyState: WorkspacePresentation["emptyState"];
};

export function WorkspaceEmptyState({ emptyState }: WorkspaceEmptyStateProps) {
  return (
    <section className={emptyState.tone === "active" ? "workspace-empty-state workspace-empty-state--active" : "workspace-empty-state"} data-testid="workspace-empty-state">
      <h3>{emptyState.title}</h3>
      <p>{emptyState.description}</p>
      <ul>
        {emptyState.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </section>
  );
}
