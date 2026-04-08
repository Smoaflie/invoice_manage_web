import { describe, expect, test } from "vitest";
import { buildWorkspaceFields, selectWorkspaceDisplayFields } from "./workspaceFields";

describe("buildWorkspaceFields", () => {
  test("combines builtin invoice fields and tag-group fields only", () => {
    const fields = buildWorkspaceFields({
      tagGroups: [{ id: "group-status", name: "报销状态", sortOrder: 1 }],
      tagGroupLinks: [
        { tagName: "待报销", groupId: "group-status" },
        { tagName: "已报销", groupId: "group-status" },
      ],
    });

    expect(fields.find((field) => field.id === "invoiceNumber")).toMatchObject({
      label: "发票号码",
      source: "builtin",
      type: "string",
    });

    expect(fields.find((field) => field.id === "tag-group:group-status")).toMatchObject({
      label: "报销状态",
      source: "tag_group",
      type: "multi_select",
      options: ["待报销", "已报销"],
    });

    expect(fields.some((field) => field.source === "custom")).toBe(false);
  });

  test("adds uploader and item-derived builtin fields and strips group prefixes from options", () => {
    const fields = buildWorkspaceFields({
      tagGroups: [{ id: "group-period", name: "时期", sortOrder: 1 }],
      tagGroupLinks: [
        { tagName: "时期:2024年", groupId: "group-period" },
        { tagName: "时期:2025年", groupId: "group-period" },
      ],
    });

    expect(fields.find((field) => field.id === "uploader")).toMatchObject({
      source: "builtin",
      type: "string",
    });
    expect(fields.find((field) => field.id === "itemBrief")).toMatchObject({
      source: "builtin",
      type: "string",
    });
    expect(fields.find((field) => field.id === "tags")).toMatchObject({
      label: "标签",
      source: "builtin",
      type: "multi_select",
    });
    expect(fields.find((field) => field.id === "tag-group:group-period")).toMatchObject({
      options: ["2024年", "2025年"],
      rawOptions: ["时期:2024年", "时期:2025年"],
    });
  });

  test("marks timestamp fields as numeric so filter dialogs can compare them", () => {
    const fields = buildWorkspaceFields({
      tagGroups: [],
      tagGroupLinks: [],
    });

    expect(fields.find((field) => field.id === "createdAt")?.type).toBe("number");
    expect(fields.find((field) => field.id === "updatedAt")?.type).toBe("number");
    expect(fields.find((field) => field.id === "ocrParsedAt")?.type).toBe("number");
  });

  test("marks fixed-option system fields as single-select for filter dialogs", () => {
    const fields = buildWorkspaceFields({
      tagGroups: [],
      tagGroupLinks: [],
    });

    expect(fields.find((field) => field.id === "bindingStatus")?.type).toBe("single_select");
    expect(fields.find((field) => field.id === "parseStatus")?.type).toBe("single_select");
    expect(fields.find((field) => field.id === "conflictStatus")?.type).toBe("single_select");
    expect(fields.find((field) => field.id === "sourceType")?.type).toBe("single_select");
    expect(fields.find((field) => field.id === "edited")?.type).toBe("single_select");
  });

  test("does not expose low-level binding errors as a workspace field", () => {
    const fields = buildWorkspaceFields({
      tagGroups: [],
      tagGroupLinks: [],
    });

    expect(fields.some((field) => field.id === "bindingErrorType")).toBe(false);
  });

  test("keeps item detail fields searchable but removes them from selectable display fields", () => {
    const fields = buildWorkspaceFields({
      tagGroups: [],
      tagGroupLinks: [],
    });
    const displayFields = selectWorkspaceDisplayFields(fields);

    expect(fields.some((field) => field.id === "itemDetail")).toBe(true);
    expect(fields.some((field) => field.id === "itemTax")).toBe(true);
    expect(displayFields.some((field) => field.id === "itemDetail")).toBe(false);
    expect(displayFields.some((field) => field.id === "itemTax")).toBe(false);
    expect(displayFields.some((field) => field.id === "itemBrief")).toBe(true);
  });
});
