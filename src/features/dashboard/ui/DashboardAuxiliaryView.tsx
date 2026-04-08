import { Suspense, lazy } from "react";
import type { DashboardView } from "./Dashboard";
import { SettingsWorkspace } from "./SettingsWorkspace";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

const OcrSettingsForm = lazy(async () => import("../../settings/ui/OcrSettingsForm").then((module) => ({ default: module.OcrSettingsForm })));
const CollaborationWorkspace = lazy(async () =>
  import("../../collaboration/ui/CollaborationWorkspace").then((module) => ({ default: module.CollaborationWorkspace })),
);

type DashboardAuxiliaryViewProps = {
  activeView: Extract<DashboardView, "settings" | "collaboration">;
  invoiceDocuments: InvoiceDocument[];
};

export function DashboardAuxiliaryView({ activeView, invoiceDocuments }: DashboardAuxiliaryViewProps) {
  return (
    <Suspense fallback={<section className="workspace-page"><p>正在加载视图...</p></section>}>
      {activeView === "settings" ? <SettingsWorkspace settingsForm={<OcrSettingsForm />} invoiceDocuments={invoiceDocuments} /> : <CollaborationWorkspace />}
    </Suspense>
  );
}
