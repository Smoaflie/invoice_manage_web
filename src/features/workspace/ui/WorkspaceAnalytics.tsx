import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import type { WorkspaceRowState } from "../application/workspaceRowState";
import { buildAnalyticsSummaryFromRowStates } from "../application/workspaceQuery";
import type { WorkspacePresentation } from "./workspacePresentation";
import { WorkspaceEmptyState } from "./WorkspaceEmptyState";

type WorkspaceAnalyticsProps = {
  rowStates: WorkspaceRowState[];
  fields: WorkspaceFieldDefinition[];
  fieldId: string;
  emptyState: WorkspacePresentation["emptyState"];
};

export function WorkspaceAnalytics({ rowStates, fields, fieldId, emptyState }: WorkspaceAnalyticsProps) {
  const summary = buildAnalyticsSummaryFromRowStates(rowStates, fields, fieldId);

  if (rowStates.length === 0) {
    return <WorkspaceEmptyState emptyState={emptyState} />;
  }

  return (
    <section className="workspace-analytics" data-testid="workspace-analytics">
      <div className="summary-strip">
        <article className="summary-chip">
          <span>记录数</span>
          <strong>{summary.totals.rowCount}</strong>
        </article>
        <article className="summary-chip">
          <span>总金额</span>
          <strong>{summary.totals.totalAmount.toFixed(2)}</strong>
        </article>
        <article className="summary-chip">
          <span>税额</span>
          <strong>{summary.totals.taxAmount.toFixed(2)}</strong>
        </article>
      </div>
      <div className="workspace-card workspace-card--ledger">
        <div className="workspace-card__header">
          <div>
            <p className="workspace-card__eyebrow">统计分布</p>
            <h2>按字段聚合</h2>
          </div>
        </div>
        <div className="data-table">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>分组</th>
                <th>记录数</th>
                <th>总金额</th>
              </tr>
            </thead>
            <tbody>
              {summary.breakdown.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>{item.count}</td>
                  <td>{item.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
