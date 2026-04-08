import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import type { WorkspaceView } from "./referenceWorkspaceController.shared";

type WorkspaceToolbarProps = {
  view: WorkspaceView;
  totalCount: number;
  resultCount: number;
  selectedCount: number;
  pendingCount: number;
  message: string;
  fields: WorkspaceFieldDefinition[];
  searchText: string;
  sortFieldId: string;
  sortDirection: "asc" | "desc";
  groupByFieldId: string;
  kanbanFieldId: string;
  activeFilterCount: number;
  onSearchTextChange: (value: string) => void;
  onSortFieldChange: (value: string) => void;
  onSortDirectionChange: (value: "asc" | "desc") => void;
  onGroupByFieldChange: (value: string) => void;
  onKanbanFieldChange: (value: string) => void;
  onSelectView?: (view: WorkspaceView) => void;
  onOpenFilter: () => void;
  onOpenFieldConfig: () => void;
  onImportFiles: () => void | Promise<void>;
  onDeleteSelected: () => void;
  onReparseSelected: () => void;
};

const VIEW_OPTIONS: Array<{ id: WorkspaceView; label: string }> = [
  { id: "records", label: "表格视图" },
  { id: "kanban", label: "看板" },
  { id: "dashboard", label: "仪表盘" },
];

export function WorkspaceToolbar(props: WorkspaceToolbarProps) {
  return (
    <section className="workspace-toolbar-shell" data-testid="workspace-primary-toolbar">
      <div className="workspace-toolbar-shell__hero">
        <div className="workspace-toolbar-shell__copy">
          <p className="workspace-toolbar-shell__eyebrow">Invoice Workspace</p>
          <h2>发票多维表格</h2>
          <p>{props.message}</p>
        </div>
        <div className="workspace-toolbar-shell__stats">
          <span>{props.totalCount} 条记录</span>
          <span>{props.resultCount} 条结果</span>
          <span>{props.selectedCount} 条已选</span>
          <span>{props.pendingCount} 项待保存</span>
        </div>
      </div>

      <div className="workspace-toolbar-shell__nav">
        <div className="workspace-view-tabs" role="tablist" aria-label="工作区视图">
          {VIEW_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={props.view === item.id}
              className={props.view === item.id ? "workspace-view-tab workspace-view-tab--active" : "workspace-view-tab"}
              onClick={() => props.onSelectView?.(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="workspace-toolbar-shell__actions">
          <button type="button" className="workspace-toolbar-shell__ghost" onClick={() => void props.onImportFiles()}>
            导入 PDF
          </button>
          <button type="button" aria-label="数据筛选" className="workspace-toolbar-shell__ghost" onClick={props.onOpenFilter}>
            数据筛选
            {props.activeFilterCount > 0 ? <span className="workspace-toolbar-shell__badge">{props.activeFilterCount}</span> : null}
          </button>
          <button type="button" className="workspace-toolbar-shell__ghost" onClick={props.onOpenFieldConfig}>
            字段管理
          </button>
        </div>
      </div>

      <div className="workspace-toolbar-shell__filters">
        <label className="workspace-toolbar-shell__search">
          <span>搜索</span>
          <input value={props.searchText} onChange={(event) => props.onSearchTextChange(event.target.value)} placeholder="搜索记录..." />
        </label>

        <label className="workspace-toolbar-shell__select">
          <span>排序</span>
          <select value={props.sortFieldId} onChange={(event) => props.onSortFieldChange(event.target.value)}>
            <option value="updatedAt">更新时间</option>
            {props.fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.label}
              </option>
            ))}
          </select>
        </label>

        <label className="workspace-toolbar-shell__select">
          <span>方向</span>
          <select value={props.sortDirection} onChange={(event) => props.onSortDirectionChange(event.target.value as "asc" | "desc")}>
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </label>

        <label className="workspace-toolbar-shell__select">
          <span>分组</span>
          <select value={props.groupByFieldId} onChange={(event) => props.onGroupByFieldChange(event.target.value)}>
            <option value="">不分组</option>
            {props.fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.label}
              </option>
            ))}
          </select>
        </label>

        {props.view === "kanban" ? (
          <label className="workspace-toolbar-shell__select">
            <span>看板字段</span>
            <select value={props.kanbanFieldId} onChange={(event) => props.onKanbanFieldChange(event.target.value)}>
              {props.fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

      </div>

      <div className="workspace-toolbar-shell__batch">
        <button type="button" className="workspace-toolbar-shell__ghost" disabled={props.selectedCount === 0} onClick={props.onReparseSelected}>
          批量重识别
        </button>
        <button type="button" className="workspace-toolbar-shell__ghost workspace-toolbar-shell__ghost--danger" disabled={props.selectedCount === 0} onClick={props.onDeleteSelected}>
          删除所选
        </button>
      </div>
    </section>
  );
}
