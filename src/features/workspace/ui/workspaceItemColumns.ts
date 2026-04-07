export const WORKSPACE_ITEM_COLUMNS = [
  { key: "name", label: "商品" },
  { key: "type", label: "规格" },
  { key: "unit", label: "单位" },
  { key: "num", label: "数量" },
  { key: "unit_price", label: "单价" },
  { key: "amount", label: "金额" },
  { key: "tax_rate", label: "税率" },
  { key: "tax", label: "税额" },
] as const;

export type WorkspaceItemColumnKey = (typeof WORKSPACE_ITEM_COLUMNS)[number]["key"];
