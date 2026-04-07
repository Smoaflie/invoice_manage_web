import { useEffect, useState } from "react";
import { createDashboardSidebarStatus, type DashboardSidebarStatus } from "./dashboardSidebarStatus";

type UseDashboardSidebarStatusInput = {
  activeView: "records" | "dashboard" | "collaboration" | "settings";
  dashboardMessage: string;
  invoiceDocumentCount: number;
  bridgeConnected: boolean | null;
  onSidebarStatusChange?: (status: DashboardSidebarStatus) => void;
};

export function useDashboardSidebarStatus(input: UseDashboardSidebarStatusInput) {
  const [workspaceSidebarStatus, setWorkspaceSidebarStatus] = useState<DashboardSidebarStatus | null>(null);

  useEffect(() => {
    if (input.activeView !== "records" && input.activeView !== "dashboard") {
      setWorkspaceSidebarStatus(null);
    }
  }, [input.activeView]);

  useEffect(() => {
    input.onSidebarStatusChange?.(
      workspaceSidebarStatus ??
        createDashboardSidebarStatus(
          input.dashboardMessage,
          input.activeView === "settings"
            ? [`${input.invoiceDocumentCount} 条记录`, input.bridgeConnected === true ? "桥接已连接" : input.bridgeConnected === false ? "桥接未连接" : "桥接状态检测中"]
            : input.activeView === "collaboration"
              ? ["本地协作会话"]
              : [`${input.invoiceDocumentCount} 条记录`],
        ),
    );
  }, [input.activeView, input.bridgeConnected, input.dashboardMessage, input.invoiceDocumentCount, input.onSidebarStatusChange, workspaceSidebarStatus]);

  return setWorkspaceSidebarStatus;
}
