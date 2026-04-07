import { useLayoutEffect, useRef, useState } from "react";
import { resolveExpandableTextPreview, type ExpandableTextPreview } from "./workspaceExpandableText";

type UseWorkspaceMeasuredTextPreviewInput = {
  text: string;
  columnWidth?: number;
  outerHorizontalPadding?: number;
};

function readFont(style: CSSStyleDeclaration) {
  return (
    style.font ||
    [style.fontStyle, style.fontVariant, style.fontWeight, `${style.fontSize}/${style.lineHeight}`, style.fontFamily]
      .filter((part) => part && part !== "normal")
      .join(" ")
  );
}

export function useWorkspaceMeasuredTextPreview(input: UseWorkspaceMeasuredTextPreviewInput) {
  const measureRef = useRef<HTMLElement | null>(null);
  const [preview, setPreview] = useState<ExpandableTextPreview>(() =>
    resolveExpandableTextPreview(input.text, Math.max((input.columnWidth ?? 0) - (input.outerHorizontalPadding ?? 0), 1)),
  );

  useLayoutEffect(() => {
    if (!measureRef.current || typeof window === "undefined") {
      setPreview(resolveExpandableTextPreview(input.text, Math.max((input.columnWidth ?? 0) - (input.outerHorizontalPadding ?? 0), 1)));
      return;
    }

    const style = window.getComputedStyle(measureRef.current);
    const selfPadding = Number.parseFloat(style.paddingLeft || "0") + Number.parseFloat(style.paddingRight || "0");
    const availableWidth = Math.max((input.columnWidth ?? measureRef.current.clientWidth) - (input.outerHorizontalPadding ?? 0) - selfPadding, 1);
    setPreview(resolveExpandableTextPreview(input.text, availableWidth, readFont(style)));
  }, [input.columnWidth, input.outerHorizontalPadding, input.text]);

  return {
    measureRef,
    expandable: preview.expandable,
    previewText: preview.previewText,
  };
}
