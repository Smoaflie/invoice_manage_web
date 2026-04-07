import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { expandedRows } from "./workspaceExpandableText";
import { useWorkspaceMeasuredTextPreview } from "./useWorkspaceMeasuredTextPreview";

const DETAIL_PANEL_OFFSET = 8;
const DETAIL_PANEL_MAX_WIDTH = 420;
const DETAIL_PANEL_MIN_WIDTH = 280;
const DETAIL_PANEL_VIEWPORT_PADDING = 16;
const HIDDEN_MEASURE_STYLE = {
  position: "fixed",
  top: "-9999px",
  left: "-9999px",
  visibility: "hidden",
  pointerEvents: "none",
  whiteSpace: "nowrap",
} as const;

function buildDetailPanelStyle(trigger: HTMLButtonElement) {
  const rect = trigger.getBoundingClientRect();
  const maxWidth = Math.max(DETAIL_PANEL_MIN_WIDTH, Math.min(DETAIL_PANEL_MAX_WIDTH, window.innerWidth - DETAIL_PANEL_VIEWPORT_PADDING * 2));
  const width = Math.min(Math.max(rect.width, DETAIL_PANEL_MIN_WIDTH), maxWidth);
  const maxLeft = Math.max(DETAIL_PANEL_VIEWPORT_PADDING, window.innerWidth - width - DETAIL_PANEL_VIEWPORT_PADDING);
  const left = Math.min(Math.max(rect.left, DETAIL_PANEL_VIEWPORT_PADDING), maxLeft);
  const top = Math.min(rect.bottom + DETAIL_PANEL_OFFSET, window.innerHeight - DETAIL_PANEL_VIEWPORT_PADDING);
  return { left, top, width };
}

type WorkspaceMenuCellTextProps = {
  label: string;
  text: string;
  columnWidth: number;
};

export function WorkspaceMenuCellText(props: WorkspaceMenuCellTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [panelStyle, setPanelStyle] = useState<{ left: number; top: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLTextAreaElement | null>(null);
  const textPreview = useWorkspaceMeasuredTextPreview({ text: props.text, columnWidth: props.columnWidth, outerHorizontalPadding: 20 });
  const expandable = textPreview.expandable;
  const previewText = textPreview.previewText;

  useLayoutEffect(() => {
    if (!expandable || !expanded || !triggerRef.current || typeof window === "undefined") {
      return;
    }

    const updatePanelStyle = () => {
      if (!triggerRef.current) {
        return;
      }

      setPanelStyle(buildDetailPanelStyle(triggerRef.current));
    };

    updatePanelStyle();
    window.addEventListener("resize", updatePanelStyle);
    window.addEventListener("scroll", updatePanelStyle, true);
    return () => {
      window.removeEventListener("resize", updatePanelStyle);
      window.removeEventListener("scroll", updatePanelStyle, true);
    };
  }, [expandable, expanded]);

  useEffect(() => {
    if (!expandable || !expanded) {
      return;
    }

    panelRef.current?.focus();
  }, [expandable, expanded]);

  useEffect(() => {
    if (!expandable || !expanded) {
      return;
    }

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }

      setExpanded(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [expandable, expanded]);

  if (!expandable) {
    return (
      <>
        <span ref={textPreview.measureRef} aria-hidden="true" className="workspace-cell-menu__text-value" style={HIDDEN_MEASURE_STYLE} />
        <span className="workspace-cell-menu__text-value">{props.text || "-"}</span>
      </>
    );
  }

  return (
    <>
      <span ref={textPreview.measureRef} aria-hidden="true" className="workspace-cell-menu__text-value" style={HIDDEN_MEASURE_STYLE} />
      <button
        ref={triggerRef}
        type="button"
        className="workspace-cell-menu__text-trigger"
        aria-label={props.text}
        aria-expanded={expanded}
        onClick={() =>
          setExpanded((current) => {
            const nextExpanded = !current;
            if (nextExpanded && triggerRef.current && typeof window !== "undefined") {
              setPanelStyle(buildDetailPanelStyle(triggerRef.current));
            }
            if (!nextExpanded) {
              setPanelStyle(null);
            }
            return nextExpanded;
          })
        }
      >
        {previewText}
      </button>
      {expanded && panelStyle && typeof document !== "undefined"
        ? createPortal(
            <textarea
              ref={panelRef}
              readOnly
              data-workspace-cell-menu-detail=""
              aria-label={`${props.label}详情`}
              value={props.text}
              rows={expandedRows(props.text)}
              className="workspace-cell-menu__detail-panel"
              style={{
                left: `${panelStyle.left}px`,
                top: `${panelStyle.top}px`,
                width: `${panelStyle.width}px`,
              }}
            />,
            document.body,
          )
        : null}
    </>
  );
}
