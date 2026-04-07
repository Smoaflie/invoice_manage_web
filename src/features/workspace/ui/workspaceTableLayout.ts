export const SELECT_COLUMN_WIDTH = 36;
export const INDEX_COLUMN_WIDTH = 54;
export const ITEM_DETAILS_COLUMN_WIDTH = 120;
export const ACTIONS_COLUMN_WIDTH = 286;

export function cellWidth(width: number) {
  return { width, minWidth: width, maxWidth: width };
}
