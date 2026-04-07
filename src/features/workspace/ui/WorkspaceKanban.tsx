import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import type { WorkspaceRowState } from "../application/workspaceRowState";
import { buildKanbanColumnsFromRowStates } from "../application/workspaceQuery";
import type { WorkspacePresentation } from "./workspacePresentation";
import { WorkspaceEmptyState } from "./WorkspaceEmptyState";

type WorkspaceKanbanProps = {
  rowStates: WorkspaceRowState[];
  fields: WorkspaceFieldDefinition[];
  fieldId: string;
  emptyState: WorkspacePresentation["emptyState"];
  onOpenDetails: (invoiceDocumentId: string) => void;
};

export function WorkspaceKanban({ rowStates, fields, fieldId, emptyState, onOpenDetails }: WorkspaceKanbanProps) {
  const columns = buildKanbanColumnsFromRowStates(rowStates, fields, fieldId);

  if (rowStates.length === 0) {
    return <WorkspaceEmptyState emptyState={emptyState} />;
  }

  return (
    <div className="reference-board" data-testid="workspace-kanban">
      <div className="reference-board__track">
        {columns.map((column) => (
          <section key={column.id} className="reference-board__column">
            <header className="reference-board__header">
              <div>
                <p className="reference-board__eyebrow">Group</p>
                <strong>{column.label}</strong>
              </div>
              <span className="reference-board__count">{column.count}</span>
            </header>
            <div className="reference-board__cards">
              {column.rows.map((row) => (
                <button key={row.id} type="button" className="reference-board__card" onClick={() => onOpenDetails(row.id)}>
                  <div className="reference-board__card-copy">
                    <strong>{row.fileName || "未绑定文件"}</strong>
                    <span>{row.invoiceNumber || "未填写发票号码"}</span>
                  </div>
                  <div className="reference-board__meta">
                    <span>{row.buyerName || "未填写购买方"}</span>
                    <span>{row.totalAmount.toFixed(2)}</span>
                  </div>
                </button>
              ))}
              {column.rows.length === 0 ? <div className="reference-board__empty">当前分组没有记录</div> : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
