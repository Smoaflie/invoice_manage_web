import { APPROX_CHAR_WIDTH } from "./workspaceColumnWidths";

const ELLIPSIS = "...";
let cachedMeasureContext: CanvasRenderingContext2D | null | undefined;

function firstLineText(text: string) {
  return text.split(/\r?\n/u)[0] ?? "";
}

function getMeasureContext() {
  if (cachedMeasureContext !== undefined) {
    return cachedMeasureContext;
  }

  if (typeof document === "undefined") {
    cachedMeasureContext = null;
    return cachedMeasureContext;
  }

  const isJsdom = typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");
  const getContext = HTMLCanvasElement.prototype.getContext as typeof HTMLCanvasElement.prototype.getContext & { mock?: unknown };
  if (isJsdom && !("mock" in getContext)) {
    cachedMeasureContext = null;
    return cachedMeasureContext;
  }

  cachedMeasureContext = document.createElement("canvas").getContext("2d");
  return cachedMeasureContext;
}

function measureTextWidth(text: string, font?: string) {
  const context = getMeasureContext();
  if (!context) {
    return [...text].length * APPROX_CHAR_WIDTH;
  }

  if (font) {
    context.font = font;
  }

  return context.measureText(text).width;
}

function fitPreviewText(text: string, availableWidth: number, font?: string) {
  if (measureTextWidth(text, font) <= availableWidth) {
    return text;
  }

  const ellipsisWidth = measureTextWidth(ELLIPSIS, font);
  if (availableWidth <= ellipsisWidth) {
    return ELLIPSIS;
  }

  const characters = [...text];
  let low = 0;
  let high = characters.length;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    const preview = `${characters.slice(0, middle).join("")}${ELLIPSIS}`;
    if (measureTextWidth(preview, font) <= availableWidth) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }

  return `${characters.slice(0, low).join("")}${ELLIPSIS}`;
}

export type ExpandableTextPreview = {
  expandable: boolean;
  previewText: string;
};

export function resolveExpandableTextPreview(text: string, availableWidth: number, font?: string): ExpandableTextPreview {
  const firstLine = firstLineText(text);
  const preview = fitPreviewText(firstLine, Math.max(availableWidth, 1), font);

  if (text.includes("\n")) {
    return {
      expandable: true,
      previewText: preview === firstLine ? `${firstLine}${ELLIPSIS}` : preview,
    };
  }

  return {
    expandable: preview !== firstLine,
    previewText: preview,
  };
}

export function expandedRows(text: string) {
  return Math.min(Math.max(text.split(/\r?\n/u).length, 2), 8);
}
