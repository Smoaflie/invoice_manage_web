import { useEffect, useState } from "react";
import { createEmptyConditionGroup } from "../../../shared/types/filterGroup";
import type { DashboardWidget, DashboardWidgetType } from "../../../shared/types/dashboardDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { createDashboardSliceFilter, pickDefaultDashboardFieldId } from "../application/dashboardDocumentModel";
import { FilterDialog } from "./FilterDialog";

type CreateDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (widgetType: DashboardWidgetType) => void;
};

type EditorDialogProps = {
  open: boolean;
  widget: DashboardWidget | null;
  fields: WorkspaceFieldDefinition[];
  filterGroups: Array<{ id: string; name: string }>;
  onClose: () => void;
  onApply: (widget: DashboardWidget) => void;
  onFilterGroupsChange?: () => void | Promise<void>;
};

const WIDGET_TYPE_OPTIONS: Array<{ value: DashboardWidgetType; label: string }> = [
  { value: "metric", label: "指标卡" },
  { value: "bar_chart", label: "条形图" },
  { value: "pie_chart", label: "饼图" },
  { value: "kanban", label: "看板" },
];

const METRIC_OPTIONS = [
  { id: "row_count", label: "记录数" },
  { id: "total_amount", label: "总金额" },
  { id: "tax_amount", label: "税额" },
] as const;

export function WorkspaceDashboardCreateDialog({ open, onClose, onCreate }: CreateDialogProps) {
  const [widgetType, setWidgetType] = useState<DashboardWidgetType>("metric");

  useEffect(() => {
    if (open) {
      setWidgetType("metric");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="overlay-shell" role="presentation">
      <section className="dialog-panel workspace-dialog" role="dialog" aria-label="新建仪表盘">
        <div className="dialog-panel__header">
          <div>
            <p className="workspace-card__eyebrow">New Widget</p>
            <h2>新建仪表盘</h2>
            <p>先选定新卡片的类型，再把它追加到仪表盘末尾。</p>
          </div>
          <button type="button" className="button-secondary" onClick={onClose}>
            关闭
          </button>
        </div>

        <label className="workspace-dialog__field">
          <span>仪表盘类型</span>
          <select aria-label="仪表盘类型" value={widgetType} onChange={(event) => setWidgetType(event.target.value as DashboardWidgetType)}>
            {WIDGET_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="dialog-panel__actions">
          <button type="button" className="button-secondary" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onCreate(widgetType);
              onClose();
            }}
          >
            创建仪表盘
          </button>
        </div>
      </section>
    </div>
  );
}

export function WorkspaceDashboardWidgetEditorDialog({
  open,
  widget,
  fields,
  filterGroups,
  onClose,
  onApply,
  onFilterGroupsChange,
}: EditorDialogProps) {
  const [draftWidget, setDraftWidget] = useState<DashboardWidget | null>(widget);
  const [filterOpen, setFilterOpen] = useState(false);
  const defaultFieldId = pickDefaultDashboardFieldId(fields);
  const defaultFilterGroupId = filterGroups[0]?.id ?? "";

  useEffect(() => {
    if (open) {
      setDraftWidget(widget);
    }
  }, [open, widget]);

  if (!open || !draftWidget) {
    return null;
  }

  return (
    <>
      <div className="overlay-shell" role="presentation">
        <section className="dialog-panel workspace-dialog" role="dialog" aria-label="编辑仪表盘">
          <div className="dialog-panel__header">
            <div>
              <p className="workspace-card__eyebrow">Widget Settings</p>
              <h2>编辑仪表盘</h2>
              <p>一级页面只负责展示结果，这里集中编辑当前卡片的标题、字段与筛选条件。</p>
            </div>
            <button type="button" className="button-secondary" onClick={onClose}>
              关闭
            </button>
          </div>

          <div className="workspace-dialog__list">
            <div className="workspace-dialog__list-item workspace-dialog__list-item--filter">
              <label className="workspace-dialog__field">
                <span>卡片名称</span>
                <input aria-label="卡片名称" value={draftWidget.title} onChange={(event) => setDraftWidget({ ...draftWidget, title: event.target.value })} />
              </label>

              {draftWidget.type === "metric" ? (
                <div className="workspace-dialog__field">
                  <span>显示指标</span>
                  <div className="dashboard-widget-config__checks">
                    {METRIC_OPTIONS.map((option) => (
                      <label key={option.id} className="dashboard-widget-config__check">
                        <input
                          type="checkbox"
                          checked={draftWidget.metrics.includes(option.id)}
                          onChange={(event) => {
                            const nextMetrics = event.target.checked
                              ? [...draftWidget.metrics, option.id]
                              : draftWidget.metrics.filter((metricId) => metricId !== option.id);
                            if (nextMetrics.length > 0) {
                              setDraftWidget({ ...draftWidget, metrics: nextMetrics });
                            }
                          }}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {draftWidget.type === "bar_chart" ? (
                <label className="workspace-dialog__field">
                  <span>分组字段</span>
                  <select value={draftWidget.groupByFieldId} onChange={(event) => setDraftWidget({ ...draftWidget, groupByFieldId: event.target.value })}>
                    {fields.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {draftWidget.type === "pie_chart" ? (
                <>
                  <label className="workspace-dialog__field">
                    <span>数据来源</span>
                    <select
                      value={draftWidget.mode}
                      onChange={(event) =>
                        setDraftWidget({
                          ...draftWidget,
                          mode: event.target.value as typeof draftWidget.mode,
                          groupByFieldId: event.target.value === "group_by_field" ? draftWidget.groupByFieldId ?? defaultFieldId : undefined,
                          sliceFilters:
                            event.target.value === "custom_filter_groups"
                              ? draftWidget.sliceFilters?.length
                                ? draftWidget.sliceFilters
                                : [createDashboardSliceFilter(defaultFilterGroupId)]
                              : undefined,
                        })
                      }
                    >
                      <option value="group_by_field">按字段分组</option>
                      <option value="custom_filter_groups">按筛选组切片</option>
                    </select>
                  </label>

                  {draftWidget.mode === "group_by_field" ? (
                    <label className="workspace-dialog__field">
                      <span>分组字段</span>
                      <select value={draftWidget.groupByFieldId ?? defaultFieldId} onChange={(event) => setDraftWidget({ ...draftWidget, groupByFieldId: event.target.value })}>
                        {fields.map((field) => (
                          <option key={field.id} value={field.id}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <div className="workspace-dialog__field">
                      <span>切片筛选组</span>
                      <div className="dashboard-slice-list">
                        {draftWidget.sliceFilters?.map((slice) => (
                          <div key={slice.id} className="dashboard-slice-list__row">
                            <input
                              aria-label="切片名称"
                              value={slice.label}
                              onChange={(event) =>
                                setDraftWidget({
                                  ...draftWidget,
                                  sliceFilters: draftWidget.sliceFilters?.map((item) => (item.id === slice.id ? { ...item, label: event.target.value } : item)),
                                })
                              }
                            />
                            <select
                              aria-label="筛选组"
                              value={slice.filterGroupId}
                              onChange={(event) =>
                                setDraftWidget({
                                  ...draftWidget,
                                  sliceFilters: draftWidget.sliceFilters?.map((item) => (item.id === slice.id ? { ...item, filterGroupId: event.target.value } : item)),
                                })
                              }
                            >
                              <option value="">请选择筛选组</option>
                              {filterGroups.map((group) => (
                                <option key={group.id} value={group.id}>
                                  {group.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() =>
                            setDraftWidget({
                              ...draftWidget,
                              sliceFilters: [...(draftWidget.sliceFilters ?? []), createDashboardSliceFilter(defaultFilterGroupId, (draftWidget.sliceFilters?.length ?? 0) + 1)],
                            })
                          }
                        >
                          添加切片
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : null}

              {draftWidget.type === "kanban" ? (
                <label className="workspace-dialog__field">
                  <span>看板字段</span>
                  <select value={draftWidget.fieldId} onChange={(event) => setDraftWidget({ ...draftWidget, fieldId: event.target.value })}>
                    {fields.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </div>

          <div className="dialog-panel__actions">
            <button type="button" className="button-secondary" onClick={() => setFilterOpen(true)}>
              编辑筛选条件
            </button>
            <button type="button" className="button-secondary" onClick={onClose}>
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(draftWidget);
                onClose();
              }}
            >
              保存属性
            </button>
          </div>
        </section>
      </div>

      <FilterDialog
        open={filterOpen}
        fields={fields}
        conditionRoot={draftWidget.conditions ?? createEmptyConditionGroup()}
        onClose={() => setFilterOpen(false)}
        onApply={(conditionRoot) => setDraftWidget({ ...draftWidget, conditions: conditionRoot })}
        onFilterGroupsChange={onFilterGroupsChange}
      />
    </>
  );
}
