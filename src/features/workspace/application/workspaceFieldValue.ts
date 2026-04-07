import type { InvoiceDocumentItem } from "../../../shared/types/invoiceDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { parseSpecialTag } from "../../tags/application/specialTagGroups";

function formatScalar(value: unknown) {
  return String(value ?? "").trim();
}

function joinItemValues(items: InvoiceDocumentItem[], picker: (item: InvoiceDocumentItem) => unknown) {
  return items.map((item) => formatScalar(picker(item))).filter(Boolean).join("\n");
}

export function buildItemBrief(items: InvoiceDocumentItem[]) {
  return joinItemValues(items, (item) => item.name);
}

export function buildItemDetail(items: InvoiceDocumentItem[]) {
  return items
    .map((item) =>
      [item.name, item.type, item.unit, item.num, item.unit_price, item.amount, item.tax_rate, item.tax]
        .map(formatScalar)
        .filter(Boolean)
        .join(" | "),
    )
    .filter(Boolean)
    .join("\n");
}

export function buildItemField(items: InvoiceDocumentItem[], key: string) {
  return joinItemValues(items, (item) => item[key]);
}

export function buildTagGroupOptions(groupName: string, rawTags: string[]) {
  const pairs = rawTags
    .map((rawTag) => {
      const parsed = parseSpecialTag(rawTag);
      return parsed && parsed.groupName === groupName
        ? { raw: parsed.canonicalTag, display: parsed.tagName }
        : { raw: rawTag, display: rawTag };
    })
    .filter((pair, index, items) => items.findIndex((item) => item.raw === pair.raw) === index)
    .sort((left, right) => left.display.localeCompare(right.display, "zh-CN"));

  return {
    options: pairs.map((pair) => pair.display),
    rawOptions: pairs.map((pair) => pair.raw),
  };
}

export function getTagGroupDisplayValues(tags: string[], field: WorkspaceFieldDefinition) {
  const rawOptions = field.rawOptions ?? field.options;
  const values: string[] = [];

  for (const tag of tags) {
    const parsed = parseSpecialTag(tag);
    if (parsed && parsed.groupName === field.label) {
      values.push(parsed.tagName);
      continue;
    }

    const optionIndex = rawOptions.indexOf(tag);
    if (optionIndex >= 0) {
      values.push(field.options[optionIndex] ?? tag);
    }
  }

  return [...new Set(values)];
}

export function writeTagGroupValues(currentTags: string[], field: WorkspaceFieldDefinition, nextValues: string[]) {
  const rawOptions = field.rawOptions ?? field.options;
  const specialGroup = rawOptions.some((rawTag) => parseSpecialTag(rawTag)?.groupName === field.label);
  const preservedTags = currentTags.filter((tag) => {
    const parsed = parseSpecialTag(tag);
    if (parsed && parsed.groupName === field.label) {
      return false;
    }

    return !rawOptions.includes(tag);
  });

  const nextTags = [...new Set(nextValues.map((value) => String(value).trim()).filter(Boolean))].map((value) => {
    const optionIndex = field.options.indexOf(value);
    if (optionIndex >= 0) {
      return rawOptions[optionIndex] ?? value;
    }

    return specialGroup ? `${field.label}:${value}` : value;
  });

  return [...preservedTags, ...nextTags];
}
