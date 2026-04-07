import { appDb } from "../../../shared/db/appDb";
import type { TagDefinition, TagGroup, TagGroupLink } from "../../../shared/types/tagDefinition";

export type TagMetadataSnapshot = {
  definitions: TagDefinition[];
  groups: TagGroup[];
  links: TagGroupLink[];
};

export async function loadTagMetadata(): Promise<TagMetadataSnapshot> {
  const [definitions, groups, links] = await Promise.all([
    appDb.tagDefinitions.toArray(),
    appDb.tagGroups.orderBy("sortOrder").toArray(),
    appDb.tagGroupLinks.toArray(),
  ]);

  return { definitions, groups, links };
}

export function buildGroupTagMap(links: TagGroupLink[]) {
  return links.reduce<Record<string, string[]>>((accumulator, link) => {
    accumulator[link.groupId] ??= [];
    if (!accumulator[link.groupId].includes(link.tagName)) {
      accumulator[link.groupId].push(link.tagName);
    }
    return accumulator;
  }, {});
}

export async function createTagGroup(name: string, sortOrder: number) {
  const normalizedName = name.trim();
  const existingGroup = await appDb.tagGroups.filter((group) => group.name === normalizedName).first();
  if (existingGroup) {
    throw new Error("标签组名称已存在。");
  }

  const group: TagGroup = {
    id: globalThis.crypto.randomUUID(),
    name: normalizedName,
    sortOrder,
  };
  await appDb.tagGroups.add(group);
  return group;
}

export async function createTagDefinition(input: { name: string; color: string; description: string }) {
  const normalizedName = input.name.trim();
  const existingDefinition = await appDb.tagDefinitions.get(normalizedName);
  if (existingDefinition) {
    throw new Error("标签名称已存在。");
  }

  const definition: TagDefinition = {
    name: normalizedName,
    color: input.color,
    enabled: true,
    description: input.description.trim(),
  };
  await appDb.tagDefinitions.put(definition);
  return definition;
}

export async function createTagGroupLink(input: TagGroupLink) {
  const existingLink = await appDb.tagGroupLinks.get([input.tagName, input.groupId]);
  if (existingLink) {
    throw new Error("该标签已经在当前标签组中。");
  }

  await appDb.tagGroupLinks.put(input);
  return input;
}

export async function deleteTagGroup(groupId: string) {
  await appDb.transaction("rw", appDb.tagGroups, appDb.tagGroupLinks, async () => {
    await appDb.tagGroupLinks.where("groupId").equals(groupId).delete();
    await appDb.tagGroups.delete(groupId);
  });
}

export async function deleteTagDefinition(tagName: string) {
  await appDb.transaction("rw", appDb.tagDefinitions, appDb.tagGroupLinks, async () => {
    await appDb.tagGroupLinks.where("tagName").equals(tagName).delete();
    await appDb.tagDefinitions.delete(tagName);
  });
}

export async function deleteTagGroupLink(input: TagGroupLink) {
  await appDb.tagGroupLinks.delete([input.tagName, input.groupId]);
}
