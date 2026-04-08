import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";

const FIXED_OPTION_LABELS: Record<string, Record<string, string>> = {
  bindingStatus: {
    readable: "可读取",
    unreadable: "无法读取",
    needs_reparse: "需重识别",
  },
  parseStatus: {
    idle: "未识别",
    parsed: "已识别",
    parse_failed: "识别失败",
    needs_reparse: "待重识别",
  },
  conflictStatus: {
    none: "无冲突",
    same_number_diff_hash: "同号异文件",
    same_hash_diff_invoice_data: "同文件异信息",
  },
  sourceType: {
    ocr: "OCR导入",
    manual: "手动录入",
  },
};

export function formatFieldOptionLabel(field: WorkspaceFieldDefinition | undefined, option: string) {
  const chineseLabel = field ? FIXED_OPTION_LABELS[field.id]?.[option] : undefined;
  if (!chineseLabel || chineseLabel === option) {
    return option;
  }

  return `${chineseLabel} (${option})`;
}
