import { useEffect, useRef, useState } from "react";

type WorkspaceTagMenuProps = {
  selectedCount: number;
  sharedTags: string[];
  tagsText: string;
  onTagsTextChange: (value: string) => void;
  onAddTags: () => void;
  onRemoveTags: () => void;
};

export function WorkspaceTagMenu(props: WorkspaceTagMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hasTagsInput = props.tagsText.trim().length > 0;
  const hasSelection = props.selectedCount > 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node | null)) {
        setOpen(false);
      }
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

  return (
    <div className="reference-workspace__tag-menu" ref={rootRef}>
      <button type="button" className="workspace-toolbar-shell__ghost" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        编辑标签
      </button>
      {open ? (
        <div className="reference-workspace__tag-menu-panel" role="dialog" aria-label="编辑标签">
          <section className="reference-workspace__tag-menu-section" aria-label="共同标签">
            <p className="reference-workspace__tag-menu-title">共同标签</p>
            {hasSelection ? (
              props.sharedTags.length > 0 ? (
                <div className="reference-workspace__tag-menu-tags">
                  {props.sharedTags.map((tag) => (
                    <span key={tag} className="reference-workspace__tag-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="reference-workspace__tag-menu-empty">当前所选发票没有共同标签</p>
              )
            ) : (
              <p className="reference-workspace__tag-menu-empty">未选择发票</p>
            )}
          </section>

          <label className="reference-workspace__tag-field">
            <span>标签</span>
            <input value={props.tagsText} onChange={(event) => props.onTagsTextChange(event.target.value)} placeholder="用空格分隔多个标签" />
          </label>

          <div className="reference-workspace__tag-menu-actions">
            <button
              type="button"
              className="workspace-toolbar-shell__ghost"
              disabled={!hasSelection || !hasTagsInput}
              onClick={() => {
                props.onAddTags();
                setOpen(false);
              }}
            >
              添加标签
            </button>
            <button
              type="button"
              className="workspace-toolbar-shell__ghost"
              disabled={!hasSelection || !hasTagsInput}
              onClick={() => {
                props.onRemoveTags();
                setOpen(false);
              }}
            >
              删除标签
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
