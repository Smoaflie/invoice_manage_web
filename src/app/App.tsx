import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { Dashboard, type DashboardView } from "../features/dashboard/ui/Dashboard";
import { createDashboardSidebarStatus, type DashboardSidebarStatus } from "../features/dashboard/ui/dashboardSidebarStatus";

const VIEW_META: Record<DashboardView, { title: string; subtitle: string }> = {
  records: {
    title: "记录",
    subtitle: "以多维表格为主视图处理发票记录、文件绑定、标签组字段与自定义字段。",
  },
  dashboard: {
    title: "仪表盘",
    subtitle: "把指标卡、条形图、饼图和分组看板放进同一个综合工作面，围绕当前票据数据持续观察。",
  },
  collaboration: {
    title: "协作",
    subtitle: "通过快照、提交批次与接收处理，完成零服务端的报销协作流转。",
  },
  settings: {
    title: "配置中心",
    subtitle: "管理 OCR 识别偏好与当前浏览器的本地优先运行配置。",
  },
};

export function App() {
  const [activeView, setActiveView] = useState<DashboardView>("records");
  const [sidebarStatus, setSidebarStatus] = useState<DashboardSidebarStatus>(() => createDashboardSidebarStatus("正在加载本地工作台数据..."));
  const activeMeta = VIEW_META[activeView];

  return (
    <main className="app-shell">
      <AppSidebar activeView={activeView} status={sidebarStatus} onSelectView={setActiveView} />
      <div className="app-shell__workspace">
        {activeView === "settings" || activeView === "collaboration" ? (
          <AppTopbar title={activeMeta.title} subtitle={activeMeta.subtitle} showUserNameEditor={activeView === "settings"} />
        ) : null}
        <Dashboard activeView={activeView} onSelectView={setActiveView} onSidebarStatusChange={setSidebarStatus} />
      </div>
    </main>
  );
}
