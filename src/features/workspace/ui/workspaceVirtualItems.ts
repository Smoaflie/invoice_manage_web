import type { ReferenceWorkspaceGroup } from "../application/referenceWorkspaceModel";
import type { WorkspaceRowState } from "../application/workspaceRowState";

export const TABLE_BODY_VIEWPORT_HEIGHT = 640;
const TABLE_GROUP_ROW_HEIGHT = 42;
const TABLE_DATA_ROW_HEIGHT = 49;
const TABLE_VIRTUAL_OVERSCAN = 320;

export type WorkspaceVirtualItem =
  | {
      key: string;
      kind: "group";
      top: number;
      height: number;
      groupId: string;
      label: string;
      count: number;
      expanded: boolean;
    }
  | {
      key: string;
      kind: "row";
      top: number;
      height: number;
      row: WorkspaceRowState;
      rowIndex: number;
    };

export function buildWorkspaceVirtualItems(groups: ReferenceWorkspaceGroup[], expandedGroupIdSet: Set<string>) {
  const items: WorkspaceVirtualItem[] = [];
  let top = 0;

  for (const group of groups) {
    const hiddenLabel = groups.length === 1 && group.name === "全部记录";
    const expanded = expandedGroupIdSet.has(group.id);

    if (!hiddenLabel) {
      items.push({
        key: `group:${group.id}`,
        kind: "group",
        top,
        height: TABLE_GROUP_ROW_HEIGHT,
        groupId: group.id,
        label: group.name,
        count: group.rows.length,
        expanded,
      });
      top += TABLE_GROUP_ROW_HEIGHT;
    }

    if (!expanded) {
      continue;
    }

    for (let rowIndex = 0; rowIndex < group.rows.length; rowIndex += 1) {
      const row = group.rows[rowIndex];
      items.push({
        key: `row:${row.id}`,
        kind: "row",
        top,
        height: TABLE_DATA_ROW_HEIGHT,
        row,
        rowIndex,
      });
      top += TABLE_DATA_ROW_HEIGHT;
    }
  }

  return {
    items,
    totalHeight: top,
  };
}

export function selectWorkspaceVirtualItems(items: WorkspaceVirtualItem[], scrollTop: number) {
  const start = Math.max(0, scrollTop - TABLE_VIRTUAL_OVERSCAN);
  const end = scrollTop + TABLE_BODY_VIEWPORT_HEIGHT + TABLE_VIRTUAL_OVERSCAN;

  return items.filter((item) => item.top + item.height > start && item.top < end);
}
