import { describe, expect, test } from "vitest";
import { clampColumnWidth, computeAutoColumnWidth, resizeColumnPair } from "./workspaceColumnWidths";

describe("workspaceColumnWidths", () => {
  test("computes auto width from header and samples with a 20-character cap", () => {
    const width = computeAutoColumnWidth({
      header: "购买方名称",
      samples: ["短文本", "这是一个超过二十个字符的字段内容用于验证宽度上限"],
    });

    expect(width).toBe(clampColumnWidth(20 * 14 + 24));
  });

  test("resizes adjacent columns while preserving the combined width", () => {
    const result = resizeColumnPair({
      leftWidth: 180,
      rightWidth: 220,
      delta: 60,
    });

    expect(result.leftWidth).toBe(240);
    expect(result.rightWidth).toBe(160);
    expect(result.leftWidth + result.rightWidth).toBe(400);
  });

  test("stops at minimum width when dragging would collapse a column", () => {
    const result = resizeColumnPair({
      leftWidth: 120,
      rightWidth: 120,
      delta: -80,
    });

    expect(result.leftWidth).toBe(88);
    expect(result.rightWidth).toBe(152);
  });
});
