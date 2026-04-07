export const MIN_COLUMN_WIDTH = 88;
export const MAX_COLUMN_CHAR_COUNT = 20;
export const APPROX_CHAR_WIDTH = 14;
export const COLUMN_HORIZONTAL_PADDING = 24;

function longestTextLength(values: string[]) {
  return values.reduce((maxLength, value) => Math.max(maxLength, [...value].length), 0);
}

export function clampColumnWidth(width: number, minWidth = MIN_COLUMN_WIDTH, maxWidth = MAX_COLUMN_CHAR_COUNT * APPROX_CHAR_WIDTH + COLUMN_HORIZONTAL_PADDING) {
  return Math.min(Math.max(Math.round(width), minWidth), maxWidth);
}

export function computeAutoColumnWidth(input: { header: string; samples: string[]; minWidth?: number; maxCharCount?: number }) {
  const maxCharCount = input.maxCharCount ?? MAX_COLUMN_CHAR_COUNT;
  const headerLength = [...input.header].length;
  const sampleLength = longestTextLength(input.samples);
  const clampedLength = Math.min(Math.max(headerLength, sampleLength), maxCharCount);
  return clampColumnWidth(clampedLength * APPROX_CHAR_WIDTH + COLUMN_HORIZONTAL_PADDING, input.minWidth, maxCharCount * APPROX_CHAR_WIDTH + COLUMN_HORIZONTAL_PADDING);
}

export function toColumnSampleText(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "")).join(" ");
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(2);
  }

  return String(value ?? "").trim();
}

export function buildAutoColumnWidthMap<TKey extends string>(
  columns: readonly { key: TKey; label: string }[],
  sampleSource: Partial<Record<TKey, string[]>>,
  input: { minWidth?: number; maxCharCount?: number } = {},
) {
  return columns.reduce(
    (widths, column) => ({
      ...widths,
      [column.key]: computeAutoColumnWidth({
        header: column.label,
        samples: sampleSource[column.key] ?? [],
        minWidth: input.minWidth,
        maxCharCount: input.maxCharCount,
      }),
    }),
    {} as Record<TKey, number>,
  );
}

export function resizeColumnPair(input: { leftWidth: number; rightWidth: number; delta: number; minWidth?: number }) {
  const minWidth = input.minWidth ?? MIN_COLUMN_WIDTH;
  const totalWidth = input.leftWidth + input.rightWidth;
  const maxLeftWidth = totalWidth - minWidth;
  const nextLeftWidth = Math.min(Math.max(input.leftWidth + input.delta, minWidth), maxLeftWidth);
  return {
    leftWidth: Math.round(nextLeftWidth),
    rightWidth: Math.round(totalWidth - nextLeftWidth),
  };
}
