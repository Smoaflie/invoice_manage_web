export type LogicLaneId = "runtime" | "state-model" | "ui-orchestration";

export interface LogicLane {
  id: LogicLaneId;
  label: string;
  description: string;
  accent: string;
}

export interface LogicNode {
  id: string;
  laneId: LogicLaneId;
  title: string;
  summary: string;
  scope: string;
  inputs: string[];
  outputs: string[];
  sideEffects: string[];
}

export interface LogicEdge {
  from: string;
  to: string;
  label: string;
}

export interface PlannedChange {
  title: string;
  detail: string;
  impact: string;
}

export interface RoleFlowStep {
  title: string;
  detail: string;
}

export const agentLogicMapBlueprint: {
  title: string;
  summary: string;
  lanes: LogicLane[];
  nodes: LogicNode[];
  edges: LogicEdge[];
  plannedChanges: PlannedChange[];
  roleFlows: {
    employee: { title: string; steps: RoleFlowStep[] };
    finance: { title: string; steps: RoleFlowStep[] };
  };
} = {
  title: "Invoice Workbench Agent Lab",
  summary: "把当前发票工作台拆成状态模型、UI 编排和运行时适配三条主线，方便 AI 快速建图和规划修改。",
  lanes: [
    {
      id: "runtime",
      label: "Runtime Adapters",
      description: "真实浏览器和本地能力，负责文件、OCR、Dexie、导入导出。",
      accent: "var(--agent-lab-runtime)",
    },
    {
      id: "state-model",
      label: "State Model",
      description: "纯逻辑和结构化投影，负责筛选、字段、协作状态和派生结果。",
      accent: "var(--agent-lab-state)",
    },
    {
      id: "ui-orchestration",
      label: "UI Orchestration",
      description: "页面编排、控制器和可视化容器，负责把状态与动作拼成操作流。",
      accent: "var(--agent-lab-ui)",
    },
  ],
  nodes: [
    {
      id: "file-api",
      laneId: "runtime",
      title: "文件与 API",
      summary: "文件句柄、同源 OCR API 和本地导入导出能力。",
      scope: "只负责接触浏览器 API，不负责业务判断。",
      inputs: ["用户文件", "OCR API 配置", "传输触发动作"],
      outputs: ["可读取文件", "OCR API 请求", "导入导出载荷"],
      sideEffects: ["File System Access", "同源 OCR API 调用"],
    },
    {
      id: "ocr-db",
      laneId: "runtime",
      title: "OCR 与 Dexie",
      summary: "OCR 请求和本地数据库读写。",
      scope: "对接真实识别和持久化，不负责页面布局。",
      inputs: ["文件对象", "识别配置", "文档更新请求"],
      outputs: ["标准化发票数据", "已保存记录"],
      sideEffects: ["Dexie transaction", "OCR 请求"],
    },
    {
      id: "workspace-query",
      laneId: "state-model",
      title: "工作区查询模型",
      summary: "对记录做筛选、排序、分组和统计汇总。",
      scope: "输入记录、字段、查询，输出派生结果。",
      inputs: ["InvoiceDocument[]", "WorkspaceFieldDefinition[]", "SavedViewQuery"],
      outputs: ["过滤结果", "看板列", "统计摘要"],
      sideEffects: [],
    },
    {
      id: "workspace-schema",
      laneId: "state-model",
      title: "字段与视图模式",
      summary: "工作区字段布局、可见列和默认查询约束。",
      scope: "把业务字段组织成 UI 可消费的结构。",
      inputs: ["发票记录", "标签组", "已保存视图"],
      outputs: ["字段定义", "列顺序", "默认视图"],
      sideEffects: [],
    },
    {
      id: "collaboration-model",
      laneId: "state-model",
      title: "协作提交模型",
      summary: "快照、提交单、回执和接收决策的结构化对象。",
      scope: "纯业务对象，不直接处理浏览器连接。",
      inputs: ["快照载荷", "本地记录", "财务决策"],
      outputs: ["匹配结果", "提交批次", "回执结论"],
      sideEffects: [],
    },
    {
      id: "dashboard-shell",
      laneId: "ui-orchestration",
      title: "Dashboard Shell",
      summary: "主入口编排器，协调记录、看板、统计、协作和设置页面。",
      scope: "把动作连接到页面，不应承载复杂状态机本体。",
      inputs: ["当前视图", "数据刷新", "对话框状态"],
      outputs: ["页面容器", "用户消息", "动作调度"],
      sideEffects: ["触发刷新", "打开对话框"],
    },
    {
      id: "workspace-controller",
      laneId: "ui-orchestration",
      title: "Workspace Controller",
      summary: "组合选择集、搜索、字段配置、批量操作和导入导出触发。",
      scope: "适合继续拆分成查询状态机和 UI 交互层。",
      inputs: ["发票记录", "字段定义", "用户操作"],
      outputs: ["表格视图数据", "菜单状态", "批量动作请求"],
      sideEffects: ["键盘监听", "触发导入导出"],
    },
    {
      id: "collaboration-panels",
      laneId: "ui-orchestration",
      title: "协作面板",
      summary: "员工与财务的对账、提交、接收和处理界面。",
      scope: "对结构化对象做呈现和决策交互。",
      inputs: ["快照", "提交单", "接收状态"],
      outputs: ["UI 决策", "结构化提交载荷"],
      sideEffects: ["复制文本", "会话触发"],
    },
  ],
  edges: [
    { from: "file-api", to: "ocr-db", label: "文件进入 OCR / DB" },
    { from: "ocr-db", to: "workspace-query", label: "记录供查询模型消费" },
    { from: "workspace-schema", to: "workspace-query", label: "字段参与派生计算" },
    { from: "workspace-query", to: "workspace-controller", label: "结果驱动表格与看板" },
    { from: "workspace-controller", to: "dashboard-shell", label: "主工作台编排" },
    { from: "collaboration-model", to: "collaboration-panels", label: "协作对象渲染到面板" },
    { from: "dashboard-shell", to: "collaboration-panels", label: "协作入口汇入" },
  ],
  plannedChanges: [
    {
      title: "从编排器中抽出状态机输入输出",
      detail: "把 Dashboard 和 workspace controller 中的可预测状态迁移整理成纯模型层，让 AI 先读状态链再动 UI。",
      impact: "减少大文件心智负担，便于生成逻辑图和变更计划。",
    },
    {
      title: "建立零副作用 UI 样板页",
      detail: "把表格、筛选、字段、二级菜单和抽屉做成独立的假界面，不连接 DB、OCR 或导入导出。",
      impact: "让 UI 试验更快，避免为了改布局而碰业务逻辑。",
    },
    {
      title: "保留运行时适配器边界",
      detail: "文件系统、OCR API 和 Dexie 继续留在 runtime lane，通过显式输入输出接给状态模型。",
      impact: "副作用集中，测试覆盖更稳定。",
    },
  ],
  roleFlows: {
    employee: {
      title: "员工流程",
      steps: [
        { title: "导入快照", detail: "先把财务暴露快照导入本地，确认哪些票已经在财务侧出现。" },
        { title: "命中打标", detail: "命中票只做本地标记，避免误入提交批次。" },
        { title: "生成批次", detail: "基于未命中记录生成待提交批次，并确定附源文件与回写标签。" },
        { title: "等待回执", detail: "只有财务整批接收成功后，才回写本地提交状态。" },
      ],
    },
    finance: {
      title: "财务流程",
      steps: [
        { title: "生成快照", detail: "先暴露已有号码，降低重复报销概率。" },
        { title: "接收批次", detail: "加载员工提交批次，优先阅读摘要与关键字段。" },
        { title: "处理异常", detail: "分离阻塞项与待确认项，完成当前批次的全部决策。" },
        { title: "整批决策", detail: "当前版本只允许整批接收或整批打回。" },
      ],
    },
  },
};
