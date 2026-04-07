export interface StoryboardToolbarAction {
  id: string;
  label: string;
  emphasis?: "normal" | "primary";
}

export interface StoryboardToolbarGroup {
  id: string;
  label: string;
  actions: StoryboardToolbarAction[];
}

export interface StoryboardMenu {
  id: string;
  label: string;
  kind: "secondary" | "drawer";
  items: string[];
}

export interface StoryboardRow {
  id: string;
  invoiceNumber: string;
  buyerName: string;
  amount: string;
  parseStatus: string;
  tags: string[];
}

export interface StoryboardInspectorSection {
  title: string;
  lines: string[];
}

export interface StoryboardPreviewGroup {
  title: string;
  items: string[];
}

export interface StoryboardGate {
  title: string;
  status: string;
  reasons: string[];
}

export interface StoryboardSpecNote {
  label: string;
  detail: string;
}

export interface StoryboardPreset {
  label: string;
  toolbarGroups: StoryboardToolbarGroup[];
  menus: StoryboardMenu[];
  rows: StoryboardRow[];
  inspector: {
    title: string;
    sections: StoryboardInspectorSection[];
  };
  preview: {
    title: string;
    groups: StoryboardPreviewGroup[];
  };
  gate: StoryboardGate;
  specNotes: StoryboardSpecNote[];
}

export const uiStoryboardScenario: {
  title: string;
  caption: string;
  presets: {
    employee: StoryboardPreset;
    finance: StoryboardPreset;
  };
} = {
  title: "Workspace UI Storyboard",
  caption: "只演示布局、密度和层级，不连接任何真实功能。",
  presets: {
    employee: {
      label: "员工提交态",
      toolbarGroups: [
        {
          id: "query",
          label: "查询",
          actions: [
            { id: "search", label: "搜索" },
            { id: "filter", label: "筛选" },
            { id: "sort", label: "排序" },
            { id: "group", label: "分组" },
          ],
        },
        {
          id: "layout",
          label: "布局",
          actions: [
            { id: "fields", label: "字段" },
            { id: "saved-view", label: "保存视图" },
          ],
        },
        {
          id: "actions",
          label: "动作",
          actions: [
            { id: "snapshot-check", label: "导入快照" },
            { id: "draft-preview", label: "预览批次" },
            { id: "submit-batch", label: "生成提交批次", emphasis: "primary" },
          ],
        },
      ],
      menus: [
        {
          id: "filter",
          label: "筛选器",
          kind: "secondary",
          items: ["提交状态 = 待发送", "金额 > 500", "标签包含 待报销"],
        },
        {
          id: "fields",
          label: "字段菜单",
          kind: "secondary",
          items: ["显示发票号码", "显示提交状态", "显示标签", "显示受益人"],
        },
      ],
      rows: [
        { id: "row-1", invoiceNumber: "INV-2026-001", buyerName: "上海研发中心", amount: "1,280.00", parseStatus: "待提交", tags: ["待报销", "硬件"] },
        { id: "row-2", invoiceNumber: "INV-2026-014", buyerName: "杭州运维组", amount: "620.00", parseStatus: "快照命中", tags: ["财务已登记", "差旅"] },
        { id: "row-3", invoiceNumber: "INV-2026-021", buyerName: "北京销售部", amount: "2,430.00", parseStatus: "待发送", tags: ["待提交", "销售"] },
        { id: "row-4", invoiceNumber: "INV-2026-030", buyerName: "深圳交付团队", amount: "890.00", parseStatus: "待发送", tags: ["待报销", "交通"] },
      ],
      inspector: {
        title: "当前焦点: 员工准备提交本批发票",
        sections: [
          {
            title: "员工关心什么",
            lines: ["哪些票会被真正提交", "哪些票因命中快照被排除", "成功后本地标签如何变化"],
          },
          {
            title: "布局目标",
            lines: ["主表格优先", "右侧展示提交前预览", "协议文本降级到调试区域"],
          },
        ],
      },
      preview: {
        title: "提交前预览",
        groups: [
          {
            title: "命中快照后将被排除",
            items: ["INV-2026-014 已被财务登记", "命中项仅打标，不进入提交批次"],
          },
          {
            title: "本次实际提交",
            items: ["INV-2026-001", "INV-2026-021", "INV-2026-030"],
          },
          {
            title: "提交策略",
            items: ["附源文件: 仅高风险票", "成功后本地标签: 已发送财务"],
          },
        ],
      },
      gate: {
        title: "接收门控",
        status: "员工侧不显示接收门控",
        reasons: ["当前阶段只预览提交结果，不做财务接收判断"],
      },
      specNotes: [
        { label: "查询区", detail: "搜索、筛选、排序、分组在左侧连续排列。" },
        { label: "主动作", detail: "生成提交批次作为唯一主按钮。" },
        { label: "二级菜单", detail: "字段与筛选按钮直接作为覆盖层触发点。" },
      ],
    },
    finance: {
      label: "财务审核态",
      toolbarGroups: [
        {
          id: "query",
          label: "查询",
          actions: [
            { id: "search", label: "搜索" },
            { id: "filter", label: "筛选" },
            { id: "sort", label: "排序" },
            { id: "group", label: "分组" },
          ],
        },
        {
          id: "layout",
          label: "布局",
          actions: [
            { id: "fields", label: "字段" },
            { id: "decision-view", label: "异常视图" },
          ],
        },
        {
          id: "actions",
          label: "决策",
          actions: [
            { id: "load-draft", label: "加载批次" },
            { id: "return-batch", label: "整批打回" },
            { id: "accept-batch", label: "整批接收", emphasis: "primary" },
          ],
        },
      ],
      menus: [
        {
          id: "filter",
          label: "筛选器",
          kind: "secondary",
          items: ["阻塞项 > 0", "待确认项 > 0", "手工补录 = 是"],
        },
        {
          id: "fields",
          label: "字段菜单",
          kind: "secondary",
          items: ["显示阻塞原因", "显示接收标签", "显示受益人", "显示审核决定"],
        },
      ],
      rows: [
        { id: "finance-1", invoiceNumber: "INV-2026-101", buyerName: "苏州制造中心", amount: "3,800.00", parseStatus: "阻塞", tags: ["同号冲突", "需处理"] },
        { id: "finance-2", invoiceNumber: "INV-2026-112", buyerName: "广州行政组", amount: "560.00", parseStatus: "待确认", tags: ["人工补录", "差旅"] },
        { id: "finance-3", invoiceNumber: "INV-2026-118", buyerName: "北京销售部", amount: "2,140.00", parseStatus: "可接收", tags: ["待入库"] },
        { id: "finance-4", invoiceNumber: "INV-2026-121", buyerName: "上海研发中心", amount: "910.00", parseStatus: "待确认", tags: ["编辑过", "待判断"] },
      ],
      inspector: {
        title: "当前焦点: 财务复核中的发票",
        sections: [
          {
            title: "财务关心什么",
            lines: ["为什么整批接收不可用", "哪些票是阻塞项", "最终会写入哪些标签和人员字段"],
          },
          {
            title: "布局目标",
            lines: ["摘要与门控优先", "异常票有单独决策区", "原始协议文本降级到下层"],
          },
        ],
      },
      preview: {
        title: "提交前预览",
        groups: [
          {
            title: "调试次级区",
            items: ["原始摘要载荷", "原始记录载荷"],
          },
        ],
      },
      gate: {
        title: "接收门控",
        status: "整批接收当前不可用",
        reasons: ["阻塞项 1 条: INV-2026-101 同号冲突", "待确认项 2 条仍未全部决策", "当前版本只支持整批接收或整批打回"],
      },
      specNotes: [
        { label: "查询区", detail: "先过滤异常票，再处理逐票判断。" },
        { label: "批量决策区", detail: "整批接收与整批打回必须独立凸显。" },
        { label: "二级菜单", detail: "字段菜单和筛选器应靠近表格上沿右侧。" },
      ],
    },
  },
};
