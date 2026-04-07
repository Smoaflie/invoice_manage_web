import { describe, expect, it } from "vitest";
import { applyRules } from "./applyRules";

describe("applyRules", () => {
  it("adds matching tags from a regex rule group", () => {
    const result = applyRules(
      { invoiceNumber: "INV-001", buyerName: "南京理工大学", sellerName: "酒店", tags: [] },
      [{ name: "hotel", pattern: "酒店", tag: "住宿" }],
    );

    expect(result.tags).toContain("住宿");
  });

  it("removes a previously auto-applied tag when the rule no longer matches", () => {
    const result = applyRules(
      { invoiceNumber: "INV-001", buyerName: "南京理工大学", sellerName: "商店", tags: ["manual", "住宿"] },
      [{ name: "hotel", pattern: "酒店", tag: "住宿" }],
      ["住宿"],
    );

    expect(result.tags).toContain("manual");
    expect(result.tags).not.toContain("住宿");
  });
});
