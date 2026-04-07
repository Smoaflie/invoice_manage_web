import { useEffect, useState } from "react";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { SavedView } from "../../../shared/types/savedView";
import type { FilterGroupRule } from "../../../shared/types/filterGroup";
import { loadFilterGroups } from "../../filters/application/filterGroups";
import { buildGroupTagMap, loadTagMetadata } from "../../tags/application/tagMetadata";
import { loadActiveViewId, listSavedViews, saveActiveViewId } from "../../views/application/savedViews";
import { bindingStatusLabel, buildOverviewViewModel, parseStatusLabel } from "./dashboardViewModels";

type DashboardOverviewProps = {
  invoiceDocuments: InvoiceDocument[];
  message: string;
};

export function DashboardOverview({ invoiceDocuments, message }: DashboardOverviewProps) {
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState("");
  const [groupTagMap, setGroupTagMap] = useState<Record<string, string[]>>({});
  const [filterRules, setFilterRules] = useState<FilterGroupRule[]>([]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const [views, storedViewId, tagMetadata, filterSnapshot] = await Promise.all([
        listSavedViews("invoices"),
        loadActiveViewId("ui.dashboardInvoiceViewId"),
        loadTagMetadata(),
        loadFilterGroups(),
      ]);
      if (!active) {
        return;
      }

      setSavedViews(views);
      setGroupTagMap(buildGroupTagMap(tagMetadata.links));
      setFilterRules(filterSnapshot.rules);
      setActiveViewId(storedViewId && views.some((view) => view.id === storedViewId) ? storedViewId : views.find((view) => view.isDefault)?.id ?? "");
    })();

    return () => {
      active = false;
    };
  }, []);

  const activeView = savedViews.find((view) => view.id === activeViewId) ?? null;
  const overview = buildOverviewViewModel(invoiceDocuments, activeView?.query, { groupTagMap, filterRules });

  const handleSelectView = async (viewId: string) => {
    setActiveViewId(viewId);
    await saveActiveViewId("ui.dashboardInvoiceViewId", viewId || null, () => new Date().toISOString());
  };

  return (
    <section className="workspace-page workspace-page--dashboard" data-testid="dashboard-overview">
      <div className="workspace-status workspace-status--dashboard">
        <p>{message}</p>
        <span>{overview.totalCount} 个跟踪文件</span>
        <label className="toolbar-field toolbar-field--compact">
          <span>当前视图</span>
          <select data-testid="dashboard-view-selector" value={activeViewId} onChange={(event) => void handleSelectView(event.target.value)}>
            <option value="">内置默认视图</option>
            {savedViews.map((view) => (
              <option key={view.id} value={view.id}>
                {view.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overview-kpis overview-kpis--dashboard">
        <article className="stat-card stat-card--primary">
          <p>发票总数</p>
          <strong data-testid="overview-total-invoices">{overview.totalCount}</strong>
          <span>{overview.parsedCount} 条已识别记录</span>
        </article>
        <article className="stat-card stat-card--primary">
          <p>总金额</p>
          <strong>{overview.totalAmount.toFixed(2)}</strong>
          <span>当前浏览器台账合计</span>
        </article>
        <article className="stat-card">
          <p>待处理</p>
          <strong data-testid="overview-needs-review">{overview.needsReviewCount}</strong>
          <span>包含文件不可读、识别失败与冲突</span>
        </article>
        <article className="stat-card">
          <p>冲突记录</p>
          <strong>{overview.conflictCount}</strong>
          <span>需要人工判断的发票</span>
        </article>
      </div>

      <div className="overview-grid overview-grid--dashboard">
        <section className="workspace-card workspace-card--activity">
          <div className="workspace-card__header">
            <div>
              <p className="workspace-card__eyebrow">最近文件</p>
              <h2>最新导入与绑定</h2>
              <p className="workspace-card__copy">用于快速确认最近进入工作区的文件和当前绑定状态。</p>
            </div>
          </div>
          <ul className="activity-list">
            {overview.recentFiles.length === 0 ? (
              <li>还没有导入文件。</li>
            ) : (
              overview.recentFiles.map((row, index) => (
                <li key={row.id}>
                  <strong data-testid={index === 0 ? "overview-recent-file" : undefined}>{row.fileName}</strong>
                  <span>{bindingStatusLabel(row.bindingStatus)}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="workspace-card workspace-card--activity">
          <div className="workspace-card__header">
            <div>
              <p className="workspace-card__eyebrow">待处理队列</p>
              <h2>需要关注的事项</h2>
              <p className="workspace-card__copy">优先显示会阻塞识别、复核或导出流程的关键问题。</p>
            </div>
          </div>
          <ul className="activity-list">
            {overview.pendingItems.length === 0 ? (
              <li>当前所有记录状态稳定。</li>
            ) : (
              overview.pendingItems.map((item) => (
                <li key={item.id}>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="workspace-card workspace-card--wide workspace-card--activity">
          <div className="workspace-card__header">
            <div>
              <p className="workspace-card__eyebrow">最近发票</p>
              <h2>最新识别记录</h2>
              <p className="workspace-card__copy">按最近更新时间展示最近被识别或被刷新状态的发票记录。</p>
            </div>
          </div>
          <ul className="activity-list">
            {overview.recentInvoices.length === 0 ? (
              <li>还没有识别出的发票。</li>
            ) : (
              overview.recentInvoices.map((row, index) => (
                <li key={row.id}>
                  <strong data-testid={index === 0 ? "overview-recent-invoice" : undefined}>
                    {row.invoiceNumber || "未编号发票"}
                  </strong>
                  <span>{parseStatusLabel(row.parseStatus)}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </section>
  );
}
