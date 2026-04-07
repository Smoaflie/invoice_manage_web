type DashboardHeaderProps = {
  bridgeConnected: boolean | null;
  message: string;
};

export function DashboardHeader({ bridgeConnected, message }: DashboardHeaderProps) {
  const bridgeLabel = bridgeConnected ? "OCR Bridge online" : "OCR Bridge offline";
  const bridgeClass = bridgeConnected ? "bridge-pill bridge-pill--online" : "bridge-pill bridge-pill--offline";

  return (
    <header className="dashboard-header">
      <div>
        <p className="dashboard-header__eyebrow">Ledger workbench</p>
        <h2>Invoice ledger</h2>
        <p className="dashboard-header__message">{message}</p>
      </div>
      <div className={bridgeClass}>{bridgeLabel}</div>
    </header>
  );
}
