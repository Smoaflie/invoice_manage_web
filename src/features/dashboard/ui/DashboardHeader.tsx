type DashboardHeaderProps = {
  message: string;
};

export function DashboardHeader({ message }: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div>
        <p className="dashboard-header__eyebrow">Ledger workbench</p>
        <h2>Invoice ledger</h2>
        <p className="dashboard-header__message">{message}</p>
      </div>
      <div className="ocr-api-pill ocr-api-pill--online">OCR API same-origin</div>
    </header>
  );
}
