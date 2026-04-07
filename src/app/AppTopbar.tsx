type AppTopbarProps = {
  title: string;
  subtitle: string;
};

export function AppTopbar({ title, subtitle }: AppTopbarProps) {
  return (
    <header className="app-topbar">
      <div className="app-topbar__identity">
        <p className="app-topbar__eyebrow">Operations Room</p>
        <h1>{title}</h1>
        <p className="app-topbar__subtitle">{subtitle}</p>
      </div>

      <div className="app-topbar__meta">
        <span className="app-topbar__badge">本地工作台</span>
        <span className="app-topbar__avatar" aria-hidden="true">
          本
        </span>
      </div>
    </header>
  );
}
