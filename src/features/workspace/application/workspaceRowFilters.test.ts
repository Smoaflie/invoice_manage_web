import { describe, expect, test } from "vitest";
import type { WorkspaceRowState } from "./workspaceRowState";
import { createConditionMatcher, createWorkspaceFilterMatcher, createWorkspaceSearchMatcher } from "./workspaceRowFilters";

const rowState: WorkspaceRowState = {
  id: "doc-1",
  row: {} as WorkspaceRowState["row"],
  tags: ["时期:2025年", "待报销"],
  values: {
    buyerName: "华北买方",
    "tag-group:group-period": ["2025年"],
  },
  searchText: "华北买方 2025年 待报销",
};

describe("workspaceRowFilters", () => {
  test("matches array-valued fields for includes_any without repeated callers needing to normalize values", () => {
    const matcher = createWorkspaceFilterMatcher({
      fieldId: "tag-group:group-period",
      operator: "includes_any",
      value: ["2025年"],
    });

    expect(matcher(rowState)).toBe(true);
  });

  test("matches search text using the precomputed row search index", () => {
    const matcher = createWorkspaceSearchMatcher("华北");

    expect(matcher(rowState)).toBe(true);
  });

  test("compares numeric filters using greater-than and less-than operators", () => {
    const totalAmountRow: WorkspaceRowState = {
      ...rowState,
      values: {
        ...rowState.values,
        totalAmount: 188,
      },
    };

    expect(
      createWorkspaceFilterMatcher({
        fieldId: "totalAmount",
        operator: "greater_than",
        value: 120,
      })(totalAmountRow),
    ).toBe(true);
    expect(
      createWorkspaceFilterMatcher({
        fieldId: "totalAmount",
        operator: "less_than",
        value: 120,
      })(totalAmountRow),
    ).toBe(false);
  });

  test("treats timestamp fields as numeric values when filtering", () => {
    const timestampRow: WorkspaceRowState = {
      ...rowState,
      values: {
        ...rowState.values,
        updatedAt: "2026-04-01T01:30:00.000Z",
      },
    };

    expect(
      createWorkspaceFilterMatcher({
        fieldId: "updatedAt",
        operator: "greater_than",
        value: Date.parse("2026-04-01T01:00:00.000Z"),
      })(timestampRow),
    ).toBe(true);
    expect(
      createWorkspaceFilterMatcher({
        fieldId: "updatedAt",
        operator: "equals",
        value: Date.parse("2026-04-01T01:30:00.000Z"),
      })(timestampRow),
    ).toBe(true);
  });

  test("supports filtering string fields by not-empty", () => {
    const matcher = createWorkspaceFilterMatcher({
      fieldId: "buyerName",
      operator: "is_not_empty",
      value: true,
    });

    expect(matcher(rowState)).toBe(true);
    expect(
      matcher({
        ...rowState,
        values: {
          ...rowState.values,
          buyerName: "   ",
        },
      }),
    ).toBe(false);
  });

  test("evaluates nested condition groups with any/all semantics", () => {
    const matcher = createConditionMatcher({
      id: "root",
      kind: "group",
      mode: "all",
      children: [
        { id: "buyer", kind: "field", fieldId: "buyerName", operator: "contains", value: "华北" },
        {
          id: "status",
          kind: "group",
          mode: "any",
          children: [
            { id: "period", kind: "field", fieldId: "tag-group:group-period", operator: "includes_any", value: ["2025年"] },
            { id: "non-empty", kind: "field", fieldId: "buyerName", operator: "is_not_empty", value: true },
          ],
        },
      ],
    });

    expect(matcher(rowState)).toBe(true);
  });

  test("resolves referenced filter groups recursively and short-circuits cycles", () => {
    const nestedGroup = {
      id: "paid-root",
      kind: "group" as const,
      mode: "all" as const,
      children: [{ id: "buyer", kind: "field" as const, fieldId: "buyerName", operator: "contains" as const, value: "华北" }],
    };
    const cyclicGroup = {
      id: "cyclic-root",
      kind: "group" as const,
      mode: "all" as const,
      children: [{ id: "cyclic-ref", kind: "filter_group" as const, filterGroupId: "cyclic" }],
    };
    const resolveFilterGroup = (filterGroupId: string) => {
      if (filterGroupId === "paid") {
        return nestedGroup;
      }
      if (filterGroupId === "cyclic") {
        return cyclicGroup;
      }
      return null;
    };

    const matcher = createConditionMatcher(
      {
        id: "root",
        kind: "group",
        mode: "all",
        children: [{ id: "paid-ref", kind: "filter_group", filterGroupId: "paid" }],
      },
      resolveFilterGroup,
    );
    const cyclicMatcher = createConditionMatcher(
      {
        id: "root-cyclic",
        kind: "group",
        mode: "all",
        children: [{ id: "cyclic-ref", kind: "filter_group", filterGroupId: "cyclic" }],
      },
      resolveFilterGroup,
    );

    expect(matcher(rowState)).toBe(true);
    expect(cyclicMatcher(rowState)).toBe(false);
  });
});
