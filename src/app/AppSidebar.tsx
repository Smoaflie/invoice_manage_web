import type { DashboardView } from "../features/dashboard/ui/Dashboard";
import type { DashboardSidebarStatus } from "../features/dashboard/ui/dashboardSidebarStatus";

type AppSidebarProps = {
  activeView: DashboardView;
  status: DashboardSidebarStatus;
  onSelectView: (view: DashboardView) => void;
};

const NAV_ITEMS: Array<{ id: DashboardView; label: string; caption: string }> = [
  { id: "records", label: "记录", caption: "多维表格" },
  { id: "dashboard", label: "仪表盘", caption: "综合视图" },
  { id: "collaboration", label: "协作", caption: "同步会话" },
  { id: "settings", label: "配置中心", caption: "OCR API" },
];

export function AppSidebar({ activeView, status, onSelectView }: AppSidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <p className="app-sidebar__brand-eyebrow">Ledger Desk</p>
        <p className="app-sidebar__brand-copy">发票归集工作台</p>
      </div>

      <nav className="app-sidebar__nav" aria-label="主导航">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === activeView ? "app-sidebar__link app-sidebar__link--active" : "app-sidebar__link"}
            aria-current={item.id === activeView ? "page" : undefined}
            onClick={() => onSelectView(item.id)}
          >
            <span className="app-sidebar__link-dot" aria-hidden="true" />
            <span className="app-sidebar__link-text">
              <strong>{item.label}</strong>
              <small>{item.caption}</small>
            </span>
          </button>
        ))}
      </nav>

      <div className="app-sidebar__footer">
        <p>{status.message}</p>
        {status.stats.map((item) => (
          <p key={item}>{item}</p>
        ))}
        <p>数据仅保存在浏览器本地</p>
      </div>
    </aside>
  );
}
