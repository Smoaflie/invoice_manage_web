import type { DashboardView } from "../../dashboard/ui/Dashboard";

type WorkspaceMode = Exclude<DashboardView, "settings" | "collaboration"> | "kanban";

export type WorkspacePresentation = {
  commandDeck: {
    eyebrow: string;
    title: string;
    description: string;
    primaryActionLabel: string;
  };
  emptyState: {
    tone: "empty" | "active";
    title: string;
    description: string;
    bullets: string[];
  };
};

const PRESENTATION: Record<WorkspaceMode, WorkspacePresentation> = {
  records: {
    commandDeck: {
      eyebrow: "Ledger Desk",
      title: "导入数据，建立第一批票据",
      description: "先把票据拉进本地台账，再决定筛选、批量 OCR、标签和后续协作。",
      primaryActionLabel: "导入数据",
    },
    emptyState: {
      tone: "empty",
      title: "导入数据，建立第一批票据",
      description: "当前工作台还没有记录。先把文件或 JSON 数据放进来，再开始分组、筛选和批量处理。",
      bullets: ["把 PDF 拖进台账，或先导入已有 JSON 数据。", "导入后再决定标签、OCR 和协作批次。"],
    },
  },
  dashboard: {
    commandDeck: {
      eyebrow: "Control Deck",
      title: "把看板和统计收拢到同一个仪表盘",
      description: "用指标卡、图表和分组看板观察当前票据群，不再在多个视图之间来回切换。",
      primaryActionLabel: "仪表盘",
    },
    emptyState: {
      tone: "empty",
      title: "仪表盘还没有可展示的数据",
      description: "先在记录视图建立票据，再回到仪表盘按金额、人员和分组观察当前数据面。",
      bullets: ["记录视图负责建档与导入。", "仪表盘负责聚合、对比和追踪处理进度。"],
    },
  },
  kanban: {
    commandDeck: {
      eyebrow: "Board Deck",
      title: "按字段展开当前记录看板",
      description: "这是保留给旧流程的兼容看板入口；新的聚合和图表都收拢到仪表盘里。",
      primaryActionLabel: "看板字段",
    },
    emptyState: {
      tone: "empty",
      title: "当前看板没有可展示的记录",
      description: "先导入记录，或切回记录视图和仪表盘继续处理。",
      bullets: ["看板只负责按字段分列。", "聚合统计和图表请使用仪表盘。"],
    },
  },
};

export function getWorkspacePresentation(view: WorkspaceMode, resultCount: number): WorkspacePresentation {
  const presentation = PRESENTATION[view];
  return {
    ...presentation,
    emptyState: {
      ...presentation.emptyState,
      tone: resultCount > 0 ? "active" : "empty",
    },
  };
}
