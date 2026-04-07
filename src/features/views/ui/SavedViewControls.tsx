import type { SavedView } from "../../../shared/types/savedView";

type SavedViewControlsProps = {
  views: SavedView[];
  activeViewId: string;
  draftName: string;
  scopeLabel: string;
  builtinLabel?: string;
  className?: string;
  dataTestId?: string;
  layout?: "inline" | "stacked";
  onDraftNameChange: (value: string) => void;
  onSelectView: (viewId: string) => void | Promise<void>;
  onSaveCurrent: () => void | Promise<void>;
  onSaveAsNew: () => void | Promise<void>;
  onSetAsDefault?: () => void | Promise<void>;
  canSetAsDefault?: boolean;
};

export function SavedViewControls({
  views,
  activeViewId,
  draftName,
  scopeLabel,
  builtinLabel = "内置默认视图",
  className,
  dataTestId,
  layout = "inline",
  onDraftNameChange,
  onSelectView,
  onSaveCurrent,
  onSaveAsNew,
  onSetAsDefault,
  canSetAsDefault = false,
}: SavedViewControlsProps) {
  const rootClassName = className ? `saved-view-controls ${className}` : "saved-view-controls";
  const actionButtons = (
    <>
      <button type="button" className="button-secondary" onClick={() => void onSaveCurrent()}>
        保存当前视图
      </button>
      <button type="button" onClick={() => void onSaveAsNew()} disabled={draftName.trim().length === 0}>
        另存为新视图
      </button>
      {onSetAsDefault ? (
        <button type="button" className="button-secondary" onClick={() => void onSetAsDefault()} disabled={!canSetAsDefault}>
          设为默认视图
        </button>
      ) : null}
    </>
  );

  if (layout === "stacked") {
    return (
      <div className={`${rootClassName} saved-view-controls--stacked`} data-testid={dataTestId}>
        <div className="saved-view-controls__top">
          <label className="toolbar-field toolbar-field--compact">
            <span>当前视图</span>
            <select value={activeViewId} onChange={(event) => void onSelectView(event.target.value)}>
              <option value="">{builtinLabel}</option>
              {views.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.name}
                </option>
              ))}
            </select>
          </label>
          <label className="toolbar-field">
            <span>新建{scopeLabel}视图</span>
            <input value={draftName} onChange={(event) => onDraftNameChange(event.target.value)} placeholder={`例如：${scopeLabel}待处理视图`} />
          </label>
        </div>
        <div className="saved-view-controls__bottom table-action-row">{actionButtons}</div>
      </div>
    );
  }

  return (
    <div className={`toolbar-row toolbar-row--files ${rootClassName}`.trim()} data-testid={dataTestId}>
      <label className="toolbar-field toolbar-field--compact">
        <span>当前视图</span>
        <select value={activeViewId} onChange={(event) => void onSelectView(event.target.value)}>
          <option value="">{builtinLabel}</option>
          {views.map((view) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </select>
      </label>
      <label className="toolbar-field">
        <span>新建{scopeLabel}视图</span>
        <input value={draftName} onChange={(event) => onDraftNameChange(event.target.value)} placeholder={`例如：${scopeLabel}待处理视图`} />
      </label>
      <div className="table-action-row">{actionButtons}</div>
    </div>
  );
}
