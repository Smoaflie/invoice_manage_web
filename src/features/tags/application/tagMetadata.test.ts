import { beforeEach, describe, expect, test } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import {
  createTagDefinition,
  createTagGroup,
  createTagGroupLink,
  deleteTagDefinition,
  deleteTagGroup,
  deleteTagGroupLink,
  loadTagMetadata,
} from "./tagMetadata";

describe("tagMetadata", () => {
  beforeEach(async () => {
    await appDb.tagGroupLinks.clear();
    await appDb.tagGroups.clear();
    await appDb.tagDefinitions.clear();
  });

  test("rejects duplicate groups, tags and links", async () => {
    const group = await createTagGroup("报销状态", 1);
    await expect(createTagGroup("报销状态", 2)).rejects.toThrow("标签组名称已存在。");

    await createTagDefinition({ name: "已报销", color: "#fff000", description: "" });
    await expect(createTagDefinition({ name: "已报销", color: "#fff000", description: "" })).rejects.toThrow("标签名称已存在。");

    await createTagGroupLink({ tagName: "已报销", groupId: group.id });
    await expect(createTagGroupLink({ tagName: "已报销", groupId: group.id })).rejects.toThrow("该标签已经在当前标签组中。");
  });

  test("deletes groups, definitions and links", async () => {
    const group = await createTagGroup("报销状态", 1);
    await createTagDefinition({ name: "已报销", color: "#fff000", description: "" });
    await createTagDefinition({ name: "差旅", color: "#111111", description: "" });
    await createTagGroupLink({ tagName: "已报销", groupId: group.id });
    await createTagGroupLink({ tagName: "差旅", groupId: group.id });

    await deleteTagGroupLink({ tagName: "差旅", groupId: group.id });
    let snapshot = await loadTagMetadata();
    expect(snapshot.links).toHaveLength(1);

    await deleteTagDefinition("已报销");
    snapshot = await loadTagMetadata();
    expect(snapshot.definitions.map((item) => item.name)).toEqual(["差旅"]);
    expect(snapshot.links).toHaveLength(0);

    await deleteTagGroup(group.id);
    snapshot = await loadTagMetadata();
    expect(snapshot.groups).toHaveLength(0);
  });
});
