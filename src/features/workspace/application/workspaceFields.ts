import type { TagGroup, TagGroupLink } from "../../../shared/types/tagDefinition";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { buildTagGroupOptions } from "./workspaceFieldValue";

const SEARCH_ONLY_FIELD_IDS = new Set([
  "itemDetail",
  "itemType",
  "itemUnit",
  "itemQuantity",
  "itemUnitPrice",
  "itemAmount",
  "itemTaxRate",
  "itemTax",
]);

const BUILTIN_FIELDS: WorkspaceFieldDefinition[] = [
  { id: "fileName", label: "文件名", source: "builtin", type: "string", options: [], visible: true, width: 220, editable: false },
  { id: "bindingStatus", label: "文件状态", source: "builtin", type: "string", options: ["readable", "needs_reparse", "unreadable"], visible: true, width: 140, editable: false },
  { id: "parseStatus", label: "识别状态", source: "builtin", type: "string", options: ["idle", "parsed", "parse_failed", "needs_reparse"], visible: true, width: 140, editable: false },
  { id: "conflictStatus", label: "冲突状态", source: "builtin", type: "string", options: ["none", "same_number_diff_hash"], visible: true, width: 160, editable: false },
  { id: "conflictMessage", label: "冲突说明", source: "builtin", type: "string", options: [], visible: false, width: 220, editable: false },
  { id: "invoiceNumber", label: "发票号码", source: "builtin", type: "string", options: [], visible: true, width: 180, editable: true },
  { id: "invoiceCode", label: "发票代码", source: "builtin", type: "string", options: [], visible: true, width: 180, editable: true },
  { id: "invoiceDate", label: "开票日期", source: "builtin", type: "string", options: [], visible: true, width: 140, editable: true },
  { id: "buyerName", label: "购买方", source: "builtin", type: "string", options: [], visible: true, width: 200, editable: true },
  { id: "sellerName", label: "销售方", source: "builtin", type: "string", options: [], visible: true, width: 200, editable: true },
  { id: "amountWithoutTax", label: "未税金额", source: "builtin", type: "number", options: [], visible: false, width: 140, editable: true },
  { id: "taxAmount", label: "税额", source: "builtin", type: "number", options: [], visible: false, width: 120, editable: true },
  { id: "totalAmount", label: "总金额", source: "builtin", type: "number", options: [], visible: true, width: 140, editable: true },
  { id: "remark", label: "备注", source: "builtin", type: "string", options: [], visible: true, width: 220, editable: true },
  { id: "annotation", label: "批注", source: "builtin", type: "string", options: [], visible: true, width: 220, editable: true },
  { id: "ocrVendor", label: "OCR来源", source: "builtin", type: "string", options: [], visible: false, width: 140, editable: false },
  { id: "ocrParsedAt", label: "OCR时间", source: "builtin", type: "number", options: [], visible: false, width: 180, editable: false },
  { id: "uploader", label: "上传人", source: "builtin", type: "string", options: [], visible: false, width: 160, editable: true },
  { id: "owner", label: "归属人", source: "builtin", type: "string", options: [], visible: false, width: 160, editable: true },
  { id: "sourceType", label: "来源方式", source: "builtin", type: "string", options: ["ocr", "manual"], visible: false, width: 140, editable: false },
  { id: "edited", label: "已编辑", source: "builtin", type: "string", options: ["是", "否"], visible: false, width: 120, editable: false },
  { id: "createdAt", label: "创建时间", source: "builtin", type: "number", options: [], visible: false, width: 180, editable: false },
  { id: "updatedAt", label: "更新时间", source: "builtin", type: "number", options: [], visible: false, width: 180, editable: false },
  { id: "itemBrief", label: "商品简介", source: "builtin", type: "string", options: [], visible: false, width: 260, editable: false },
  { id: "itemDetail", label: "商品详情", source: "builtin", type: "string", options: [], visible: false, width: 320, editable: false },
  { id: "itemType", label: "商品规格", source: "builtin", type: "string", options: [], visible: false, width: 180, editable: false },
  { id: "itemUnit", label: "商品单位", source: "builtin", type: "string", options: [], visible: false, width: 140, editable: false },
  { id: "itemQuantity", label: "商品数量", source: "builtin", type: "string", options: [], visible: false, width: 140, editable: false },
  { id: "itemUnitPrice", label: "商品单价", source: "builtin", type: "string", options: [], visible: false, width: 160, editable: false },
  { id: "itemAmount", label: "商品金额", source: "builtin", type: "string", options: [], visible: false, width: 160, editable: false },
  { id: "itemTaxRate", label: "商品税率", source: "builtin", type: "string", options: [], visible: false, width: 140, editable: false },
  { id: "itemTax", label: "商品税额", source: "builtin", type: "string", options: [], visible: false, width: 160, editable: false },
  { id: "tags", label: "标签", source: "builtin", type: "multi_select", options: [], visible: true, width: 180, editable: false },
];

function buildGroupTagMap(tagGroupLinks: TagGroupLink[]) {
  return tagGroupLinks.reduce<Record<string, string[]>>((accumulator, link) => {
    accumulator[link.groupId] ??= [];
    if (!accumulator[link.groupId].includes(link.tagName)) {
      accumulator[link.groupId].push(link.tagName);
    }
    return accumulator;
  }, {});
}

export function buildWorkspaceFields(input: { tagGroups: TagGroup[]; tagGroupLinks: TagGroupLink[] }) {
  const groupTagMap = buildGroupTagMap(input.tagGroupLinks);
  const tagGroupFields: WorkspaceFieldDefinition[] = [...input.tagGroups]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((group) => {
      const { options, rawOptions } = buildTagGroupOptions(group.name, groupTagMap[group.id] ?? []);

      return {
        id: `tag-group:${group.id}`,
        label: group.name,
        source: "tag_group",
        type: "multi_select",
        options,
        rawOptions,
        visible: true,
        width: 180,
        editable: true,
      };
    });

  return [...BUILTIN_FIELDS, ...tagGroupFields];
}

export function isWorkspaceSearchOnlyField(field: WorkspaceFieldDefinition) {
  return SEARCH_ONLY_FIELD_IDS.has(field.id);
}

export function selectWorkspaceDisplayFields(fields: WorkspaceFieldDefinition[]) {
  return fields.filter((field) => !isWorkspaceSearchOnlyField(field));
}
