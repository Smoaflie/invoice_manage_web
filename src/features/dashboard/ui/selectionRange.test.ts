import { describe, expect, test } from "vitest";
import { updateRangeSelection } from "./selectionRange";

describe("updateRangeSelection", () => {
  test("toggles a single row and resets anchor without shift", () => {
    expect(updateRangeSelection(["a", "b", "c"], [], "b", null, false)).toEqual({
      selectedIds: ["b"],
      anchorId: "b",
    });
  });

  test("selects the full range between anchor and clicked row when shift is pressed", () => {
    expect(updateRangeSelection(["a", "b", "c", "d"], ["b"], "d", "b", true)).toEqual({
      selectedIds: ["b", "c", "d"],
      anchorId: "b",
    });
  });

  test("keeps previous selection while extending the range", () => {
    expect(updateRangeSelection(["a", "b", "c", "d"], ["a", "b"], "d", "b", true)).toEqual({
      selectedIds: ["a", "b", "c", "d"],
      anchorId: "b",
    });
  });
});
