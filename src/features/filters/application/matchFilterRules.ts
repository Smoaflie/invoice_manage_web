import { FILTER_GROUP_NUMERIC_FIELDS, type FilterGroupRule } from "../../../shared/types/filterGroup";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

function fieldValue(row: InvoiceDocument, field: FilterGroupRule["field"]) {
  return row[field];
}

function numericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const direct = Number(value);
    if (Number.isFinite(direct)) {
      return direct;
    }
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }
  return null;
}

function textValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
}

export function matchesFilterRule(row: InvoiceDocument, rule: FilterGroupRule) {
  const operator = rule.operator ?? "regex";
  if (FILTER_GROUP_NUMERIC_FIELDS.has(rule.field) && operator !== "regex") {
    const left = numericValue(fieldValue(row, rule.field));
    const right = numericValue(rule.pattern);
    if (left === null || right === null) {
      return false;
    }
    if (operator === "equals") {
      return left === right;
    }
    return operator === "greater_than" ? left > right : left < right;
  }

  try {
    return new RegExp(rule.pattern, "u").test(textValue(fieldValue(row, rule.field)));
  } catch {
    return false;
  }
}
