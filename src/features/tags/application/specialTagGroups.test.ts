import { beforeEach, describe, expect, test } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { loadTagMetadata } from "./tagMetadata";
import { parseSpecialTag, syncSpecialTagGroups } from "./specialTagGroups";

describe("specialTagGroups", () => {
  beforeEach(async () => {
    await appDb.invoiceDocuments.clear();
    await appDb.tagGroupLinks.clear();
    await appDb.tagGroups.clear();
    await appDb.tagDefinitions.clear();
  });

  test("parses half-width and full-width grouped tags", () => {
    expect(parseSpecialTag("时期:2024年")).toEqual({
      groupName: "时期",
      tagName: "2024年",
      canonicalTag: "时期:2024年",
    });
    expect(parseSpecialTag("时期：2025年")).toEqual({
      groupName: "时期",
      tagName: "2025年",
      canonicalTag: "时期:2025年",
    });
    expect(parseSpecialTag("普通标签")).toBeNull();
    expect(parseSpecialTag("时期:")).toBeNull();
  });

  test("creates tag groups, definitions and links from invoice tags", async () => {
    await syncSpecialTagGroups([
      { id: "doc-1", tags: ["时期:2024年", "时期：2025年", "普通标签"] },
      { id: "doc-2", tags: ["阶段:立项"] },
    ]);

    const snapshot = await loadTagMetadata();
    expect(snapshot.groups.map((group) => group.name)).toEqual(["时期", "阶段"]);
    expect(snapshot.definitions.map((item) => item.name).sort()).toEqual(["时期:2024年", "时期:2025年", "阶段:立项"]);
    expect(snapshot.links).toHaveLength(3);
  });
});
