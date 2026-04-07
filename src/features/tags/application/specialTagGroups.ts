import { createTagDefinition, createTagGroup, createTagGroupLink, loadTagMetadata } from "./tagMetadata";

export type ParsedSpecialTag = {
  groupName: string;
  tagName: string;
  canonicalTag: string;
};

export function parseSpecialTag(input: string): ParsedSpecialTag | null {
  const normalized = input.replace("：", ":");
  const separatorIndex = normalized.indexOf(":");

  if (separatorIndex <= 0) {
    return null;
  }

  const groupName = normalized.slice(0, separatorIndex).trim();
  const tagName = normalized.slice(separatorIndex + 1).trim();

  if (!groupName || !tagName) {
    return null;
  }

  return {
    groupName,
    tagName,
    canonicalTag: `${groupName}:${tagName}`,
  };
}

export async function syncSpecialTagGroups<TRow extends { tags: string[] }>(rows: TRow[]) {
  const parsedTagMap = new Map<string, ParsedSpecialTag>();

  for (const row of rows) {
    for (const rawTag of row.tags) {
      const parsed = parseSpecialTag(rawTag);
      if (parsed && !parsedTagMap.has(parsed.canonicalTag)) {
        parsedTagMap.set(parsed.canonicalTag, parsed);
      }
    }
  }

  const parsedTags = [...parsedTagMap.values()];
  if (parsedTags.length === 0) {
    return;
  }

  const snapshot = await loadTagMetadata();
  const groupsByName = new Map(snapshot.groups.map((group) => [group.name, group]));
  const definitionNames = new Set(snapshot.definitions.map((definition) => definition.name));
  const linkKeys = new Set(snapshot.links.map((link) => `${link.groupId}::${link.tagName}`));
  let nextSortOrder = snapshot.groups.reduce((max, group) => Math.max(max, group.sortOrder), 0) + 1;

  for (const parsed of parsedTags) {
    let group = groupsByName.get(parsed.groupName);
    if (!group) {
      group = await createTagGroup(parsed.groupName, nextSortOrder);
      groupsByName.set(group.name, group);
      nextSortOrder += 1;
    }

    if (!definitionNames.has(parsed.canonicalTag)) {
      await createTagDefinition({
        name: parsed.canonicalTag,
        color: "#7d71f4",
        description: "",
      });
      definitionNames.add(parsed.canonicalTag);
    }

    const linkKey = `${group.id}::${parsed.canonicalTag}`;
    if (!linkKeys.has(linkKey)) {
      await createTagGroupLink({ tagName: parsed.canonicalTag, groupId: group.id });
      linkKeys.add(linkKey);
    }
  }
}
