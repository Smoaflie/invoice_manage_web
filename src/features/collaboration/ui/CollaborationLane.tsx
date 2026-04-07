import type { ReactNode } from "react";

type CollaborationLaneProps = {
  testId: string;
  tone: "finance" | "employee";
  stage: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function CollaborationLane(props: CollaborationLaneProps) {
  return (
    <section className={`collaboration-workspace__lane collaboration-workspace__lane--${props.tone}`} data-testid={props.testId}>
      <header className="collaboration-workspace__lane-header">
        <p className="collaboration-workspace__lane-stage">{props.stage}</p>
        <h3>{props.title}</h3>
        <span>{props.description}</span>
      </header>
      <div className="collaboration-workspace__lane-body">{props.children}</div>
    </section>
  );
}
