import type { WorkspaceTableColumnWidths } from "../../../shared/types/savedView";

export const SELECT_COLUMN_WIDTH = 36;
export const INDEX_COLUMN_WIDTH = 54;
export const ITEM_DETAILS_COLUMN_WIDTH = 120;
export const ACTIONS_COLUMN_WIDTH = 286;
export const ITEM_DETAILS_COLUMN_MIN_WIDTH = 96;
export const ACTIONS_COLUMN_MIN_WIDTH = 240;

export const DEFAULT_TABLE_COLUMN_WIDTHS: WorkspaceTableColumnWidths = {
  itemDetails: ITEM_DETAILS_COLUMN_WIDTH,
  actions: ACTIONS_COLUMN_WIDTH,
};

export function resolveWorkspaceTableColumnWidths(overrides?: Partial<WorkspaceTableColumnWidths>): WorkspaceTableColumnWidths {
  return {
    ...DEFAULT_TABLE_COLUMN_WIDTHS,
    ...overrides,
  };
}

export function cellWidth(width: number) {
  return { width, minWidth: width, maxWidth: width };
}
