export const DISPLAY_TIME_ZONE = "Asia/Shanghai";

const DISPLAY_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  timeZone: DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  hourCycle: "h23",
});

function parseDisplayTimeInput(value: unknown) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number" || typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function formatDisplayDateTime(value: unknown) {
  const date = parseDisplayTimeInput(value);
  if (!date) {
    return "";
  }

  const parts = DISPLAY_TIME_FORMATTER.formatToParts(date);
  return `${getPart(parts, "year")}/${getPart(parts, "month")}/${getPart(parts, "day")} ${getPart(parts, "hour")}:${getPart(parts, "minute")}:${getPart(parts, "second")}`;
}
