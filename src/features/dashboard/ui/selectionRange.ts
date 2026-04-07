export function updateRangeSelection(
  orderedIds: string[],
  selectedIds: string[],
  clickedId: string,
  anchorId: string | null,
  shiftKey: boolean,
) {
  if (!shiftKey || !anchorId) {
    const exists = selectedIds.includes(clickedId);
    return {
      selectedIds: exists ? selectedIds.filter((item) => item !== clickedId) : [...selectedIds, clickedId],
      anchorId: clickedId,
    };
  }

  const clickedIndex = orderedIds.indexOf(clickedId);
  const anchorIndex = orderedIds.indexOf(anchorId);

  if (clickedIndex === -1 || anchorIndex === -1) {
    return {
      selectedIds,
      anchorId: clickedId,
    };
  }

  const [start, end] = clickedIndex < anchorIndex ? [clickedIndex, anchorIndex] : [anchorIndex, clickedIndex];
  const rangeIds = orderedIds.slice(start, end + 1);
  const nextSelectedIds = [...new Set([...selectedIds, ...rangeIds])];

  return {
    selectedIds: nextSelectedIds,
    anchorId,
  };
}

export function sameSelection(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}
