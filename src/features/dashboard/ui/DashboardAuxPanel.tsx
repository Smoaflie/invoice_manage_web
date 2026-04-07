import { FileImportPanel } from "../../files/ui/FileImportPanel";
import { DataTransferPanel } from "../../transfer/ui/DataTransferPanel";
import { OcrSettingsForm } from "../../settings/ui/OcrSettingsForm";

type DashboardAuxPanelProps = {
  onRefresh: () => void | Promise<void>;
};

export function DashboardAuxPanel({ onRefresh }: DashboardAuxPanelProps) {
  return (
    <section className="dashboard-aux">
      <div className="dashboard-aux__column">
        <FileImportPanel onImportComplete={onRefresh} />
        <DataTransferPanel onImportComplete={onRefresh} />
      </div>
      <div className="dashboard-aux__column">
        <OcrSettingsForm />
      </div>
    </section>
  );
}
