type DashboardSidebarProps = {
  fileEntries: number;
  invoiceRecords: number;
};

export function DashboardSidebar({ fileEntries, invoiceRecords }: DashboardSidebarProps) {
  return (
    <aside className="dashboard-sidebar" data-testid="dashboard-sidebar">
      <p className="dashboard-sidebar__eyebrow">Filters</p>
      <h3>Fixed review scope</h3>
      <dl className="dashboard-sidebar__list">
        <div>
          <dt>Ledger</dt>
          <dd>{invoiceRecords}</dd>
        </div>
        <div>
          <dt>Files</dt>
          <dd>{fileEntries}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>All bindings</dd>
        </div>
        <div>
          <dt>Scope</dt>
          <dd>Current browser</dd>
        </div>
      </dl>
    </aside>
  );
}
