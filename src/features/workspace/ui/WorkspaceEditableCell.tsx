import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { expandedRows } from "./workspaceExpandableText";
import { useWorkspaceMeasuredTextPreview } from "./useWorkspaceMeasuredTextPreview";

type WorkspaceEditableCellProps = {
  field: WorkspaceFieldDefinition;
  value: unknown;
  columnWidth?: number;
  rowId?: string;
  onSave?: (value: unknown) => void;
};

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

function buildPanelStyle(trigger: HTMLButtonElement) {
  const rect = trigger.getBoundingClientRect();
  const maxWidth = Math.max(DETAIL_PANEL_MIN_WIDTH, Math.min(DETAIL_PANEL_MAX_WIDTH, window.innerWidth - DETAIL_PANEL_VIEWPORT_PADDING * 2));
  const width = Math.min(Math.max(rect.width, DETAIL_PANEL_MIN_WIDTH), maxWidth);
  const maxLeft = Math.max(DETAIL_PANEL_VIEWPORT_PADDING, window.innerWidth - width - DETAIL_PANEL_VIEWPORT_PADDING);
  const left = Math.min(Math.max(rect.left, DETAIL_PANEL_VIEWPORT_PADDING), maxLeft);
  const top = Math.min(rect.bottom + DETAIL_PANEL_OFFSET, window.innerHeight - DETAIL_PANEL_VIEWPORT_PADDING);
  return { left, top, width };
}

function formatCellValue(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "number") {
    return value.toFixed(2);
  }

  return String(value ?? "");
}

function hasDisplayText(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return String(value ?? "").trim().length > 0;
}

function WorkspaceEditableCellInner({ field, value, columnWidth }: WorkspaceEditableCellProps) {
  const [expanded, setExpanded] = useState(false);
  const [panelStyle, setPanelStyle] = useState<{ left: number; top: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLTextAreaElement | null>(null);
  const formattedValue = field.type === "multi_select" ? (Array.isArray(value) ? value : []) : formatCellValue(value);
  const stringText = field.type === "string" ? String(formattedValue ?? "") : "";
  const previewColumnWidth = field.type === "string" ? columnWidth ?? field.width : undefined;
  const textPreview = useWorkspaceMeasuredTextPreview({ text: stringText, columnWidth: previewColumnWidth });
  const canExpandString = field.type === "string" && textPreview.expandable;

  useLayoutEffect(() => {
    if (!canExpandString || !expanded || !triggerRef.current || typeof window === "undefined") {
      return;
    }

    const updatePanelStyle = () => {
      if (!triggerRef.current) {
        return;
      }

      setPanelStyle(buildPanelStyle(triggerRef.current));
    };

    updatePanelStyle();
    window.addEventListener("resize", updatePanelStyle);
    window.addEventListener("scroll", updatePanelStyle, true);

    return () => {
      window.removeEventListener("resize", updatePanelStyle);
      window.removeEventListener("scroll", updatePanelStyle, true);
    };
  }, [canExpandString, expanded]);

  useEffect(() => {
    if (!canExpandString || !expanded) {
      return;
    }

    panelRef.current?.focus();
  }, [canExpandString, expanded]);

  useEffect(() => {
    if (!canExpandString || !expanded || typeof document === "undefined") {
      return;
    }

    const isInsideDetail = (target: EventTarget | null) =>
      target instanceof Node && (rootRef.current?.contains(target) || panelRef.current?.contains(target));
    const handleMouseDown = (event: MouseEvent) => {
      if (isInsideDetail(event.target)) {
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
  }, [canExpandString, expanded]);

  useEffect(() => {
    if (canExpandString) {
      return;
    }

    setExpanded(false);
    setPanelStyle(null);
  }, [canExpandString]);

  const handleTriggerClick = () => {
    setExpanded((current) => {
      const nextExpanded = !current;
      if (nextExpanded && triggerRef.current && typeof window !== "undefined") {
        setPanelStyle(buildPanelStyle(triggerRef.current));
      }
      if (!nextExpanded) {
        setPanelStyle(null);
      }
      return nextExpanded;
    });
  };

  const handlePanelKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    setExpanded(false);
    triggerRef.current?.focus();
  };

  if (field.type === "multi_select") {
    const tags = Array.isArray(formattedValue) ? formattedValue : [];
    return tags.length > 0 ? (
      <span className="workspace-cell__tags">
        {tags.map((tag) => (
          <span key={String(tag)} className="workspace-cell__tag">
            {String(tag)}
          </span>
        ))}
      </span>
    ) : (
      <span className="editable-cell__placeholder">空</span>
    );
  }

  if (field.type === "string") {
    const text = stringText;
    const placeholder = text.length === 0 ? "空" : undefined;
    const previewText = textPreview.previewText;

    return (
      <div ref={rootRef} className="workspace-cell-detail">
        <span
          ref={textPreview.measureRef}
          aria-hidden="true"
          className="workspace-cell-detail__trigger workspace-cell-detail__trigger--inline editable-cell__input editable-cell__input--readonly"
          style={HIDDEN_MEASURE_STYLE}
        />
        {canExpandString ? (
          <button
            ref={triggerRef}
            type="button"
            aria-label={text}
            aria-expanded={expanded}
            className="workspace-cell-detail__trigger workspace-cell-detail__trigger--inline editable-cell__input editable-cell__input--readonly"
            onClick={handleTriggerClick}
          >
            {previewText}
          </button>
        ) : (
          <input
            readOnly
            type="text"
            value={text}
            placeholder={placeholder}
            className="editable-cell__input editable-cell__input--readonly"
          />
        )}
        {canExpandString && expanded && panelStyle && typeof document !== "undefined"
            ? createPortal(
                <textarea
                  ref={panelRef}
                  readOnly
                  aria-label={`${field.label}详情`}
                  value={text}
                  rows={expandedRows(text)}
                  className="workspace-cell-detail__panel editable-cell__input editable-cell__input--readonly editable-cell__textarea"
                  style={{
                    left: `${panelStyle.left}px`,
                    top: `${panelStyle.top}px`,
                    width: `${panelStyle.width}px`,
                  }}
                  onKeyDown={handlePanelKeyDown}
                />,
                document.body,
              )
            : null}
      </div>
    );
  }

  const formattedText = hasDisplayText(formattedValue) ? String(formatCellValue(value)) : "";

  return (
    <input
      readOnly
      type="text"
      value={formattedText}
      placeholder={formattedText.length === 0 ? "空" : undefined}
      className="editable-cell__input editable-cell__input--readonly"
    />
  );
}

export const WorkspaceEditableCell = memo(WorkspaceEditableCellInner);
