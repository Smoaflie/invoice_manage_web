import type { WorkspacePresentation } from "./workspacePresentation";

type WorkspaceCommandDeckProps = {
  presentation: WorkspacePresentation["commandDeck"];
};

export function WorkspaceCommandDeck({ presentation }: WorkspaceCommandDeckProps) {
  return (
    <section className="workspace-command-deck" data-testid="workspace-command-deck">
      <p className="workspace-command-deck__eyebrow">{presentation.eyebrow}</p>
      <h2>{presentation.title}</h2>
      <p>{presentation.description}</p>
      <span className="workspace-command-deck__primary">{presentation.primaryActionLabel}</span>
    </section>
  );
}
