import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type WorkspaceTagCellProps = {
  label: string;
  tags: string[];
  columnWidth?: number;
};

type TagPreview = {
  visibleTags: string[];
  hiddenTags: string[];
};

const DETAIL_PANEL_OFFSET = 8;
const DETAIL_PANEL_MAX_WIDTH = 420;
const DETAIL_PANEL_MIN_WIDTH = 280;
const DETAIL_PANEL_VIEWPORT_PADDING = 16;
const TAG_GAP = 6;
const TAG_HORIZONTAL_PADDING = 16;
const PREVIEW_HORIZONTAL_PADDING = 0;

function buildPanelStyle(trigger: HTMLButtonElement) {
  const rect = trigger.getBoundingClientRect();
  const maxWidth = Math.max(DETAIL_PANEL_MIN_WIDTH, Math.min(DETAIL_PANEL_MAX_WIDTH, window.innerWidth - DETAIL_PANEL_VIEWPORT_PADDING * 2));
  const width = Math.min(Math.max(rect.width, DETAIL_PANEL_MIN_WIDTH), maxWidth);
  const maxLeft = Math.max(DETAIL_PANEL_VIEWPORT_PADDING, window.innerWidth - width - DETAIL_PANEL_VIEWPORT_PADDING);
  const left = Math.min(Math.max(rect.left, DETAIL_PANEL_VIEWPORT_PADDING), maxLeft);
  const top = Math.min(rect.bottom + DETAIL_PANEL_OFFSET, window.innerHeight - DETAIL_PANEL_VIEWPORT_PADDING);
  return { left, top, width };
}

function readFont(style: CSSStyleDeclaration) {
  return (
    style.font ||
    [style.fontStyle, style.fontVariant, style.fontWeight, `${style.fontSize}/${style.lineHeight}`, style.fontFamily]
      .filter((part) => part && part !== "normal")
      .join(" ")
  );
}

function measureTextWidth(text: string, _font: string) {
  return [...text].reduce((sum, char) => sum + (/[\u0000-\u00ff]/u.test(char) ? 6 : 10), 0);
}

function measureChipWidth(text: string, font: string) {
  return Math.ceil(measureTextWidth(text, font) + TAG_HORIZONTAL_PADDING);
}

function resolveTagPreview(tags: string[], availableWidth: number, font: string): TagPreview {
  if (tags.length === 0) {
    return { visibleTags: [], hiddenTags: [] };
  }

  const ellipsisWidth = measureChipWidth("...", font);
  const visibleTags: string[] = [];
  let usedWidth = 0;

  for (let index = 0; index < tags.length; index += 1) {
    const tag = tags[index];
    const tagWidth = measureChipWidth(tag, font);
    const gapBefore = visibleTags.length > 0 ? TAG_GAP : 0;
    const hiddenCountAfterCurrent = tags.length - index - 1;
    const reserveWidth = hiddenCountAfterCurrent > 0 ? TAG_GAP + ellipsisWidth : 0;

    if (usedWidth + gapBefore + tagWidth + reserveWidth > availableWidth) {
      break;
    }

    visibleTags.push(tag);
    usedWidth += gapBefore + tagWidth;
  }

  if (visibleTags.length > 0) {
    return {
      visibleTags,
      hiddenTags: tags.slice(visibleTags.length),
    };
  }

  return {
    visibleTags: [tags[0]],
    hiddenTags: tags.slice(1),
  };
}

export function WorkspaceTagCell(props: WorkspaceTagCellProps) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<{ left: number; top: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [font, setFont] = useState('500 12px "Segoe UI"');
  const preview = useMemo(
    () => resolveTagPreview(props.tags, Math.max((props.columnWidth ?? 0) - PREVIEW_HORIZONTAL_PADDING, 1), font),
    [font, props.columnWidth, props.tags],
  );

  useLayoutEffect(() => {
    if (!measureRef.current || typeof window === "undefined") {
      return;
    }

    setFont(readFont(window.getComputedStyle(measureRef.current)));
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || typeof window === "undefined") {
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
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (props.tags.length === 0) {
    return <span className="editable-cell__placeholder">空</span>;
  }

  return (
    <div ref={rootRef} className="workspace-tag-cell">
      <span ref={measureRef} aria-hidden="true" className="workspace-tag-cell__measure workspace-cell__tag">
        标签测量
      </span>
      <button
        ref={triggerRef}
        type="button"
        className="workspace-tag-cell__trigger"
        aria-label={props.label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={preview.hiddenTags.length > 0 ? preview.hiddenTags.join("、") : undefined}
        onClick={() =>
          setOpen((current) => {
            const nextOpen = !current;
            if (nextOpen && triggerRef.current && typeof window !== "undefined") {
              setPanelStyle(buildPanelStyle(triggerRef.current));
            }
            if (!nextOpen) {
              setPanelStyle(null);
            }
            return nextOpen;
          })
        }
      >
        <span className="workspace-tag-cell__preview">
          {preview.visibleTags.map((tag) => (
            <span key={tag} className="workspace-cell__tag workspace-tag-cell__chip">
              {tag}
            </span>
          ))}
          {preview.hiddenTags.length > 0 ? (
            <span className="workspace-cell__tag workspace-tag-cell__chip workspace-tag-cell__chip--ellipsis">...</span>
          ) : null}
        </span>
      </button>
      {open && panelStyle && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className="workspace-tag-cell__menu"
              role="menu"
              aria-label={props.label}
              style={{
                left: `${panelStyle.left}px`,
                top: `${panelStyle.top}px`,
                width: `${panelStyle.width}px`,
              }}
            >
              <div className="workspace-tag-cell__menu-list">
                {props.tags.map((tag) => (
                  <span key={tag} className="workspace-cell__tag workspace-tag-cell__menu-chip">
                    {tag}
                  </span>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
