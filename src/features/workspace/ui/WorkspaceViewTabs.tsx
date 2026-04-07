import { useEffect, useRef, useState } from "react";
import type { SavedView } from "../../../shared/types/savedView";

type WorkspaceViewTabsProps = {
  views: SavedView[];
  activeViewId: string;
  builtinLabel: string;
  canSetAsDefault: boolean;
  onSelectView: (viewId: string) => void | Promise<void>;
  onCreateView: (name: string) => void | Promise<void>;
  onRenameView: (name: string) => void | Promise<void>;
  onDuplicateView: (name: string) => void | Promise<void>;
  onDeleteView: () => void | Promise<void>;
  onSetDefaultView: () => void | Promise<void>;
};

function nextSuggestedName(activeLabel: string) {
  return `${activeLabel} 副本`;
}

export function WorkspaceViewTabs(props: WorkspaceViewTabsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const activeLabel = props.views.find((view) => view.id === props.activeViewId)?.name ?? props.builtinLabel;
  const hasActiveSavedView = props.activeViewId.length > 0;
  const tabItems = [{ id: "", label: props.builtinLabel }, ...props.views.map((view) => ({ id: view.id, label: view.name }))];

  useEffect(() => {
    setMenuOpen(false);
  }, [props.activeViewId]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node | null)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const openPrompt = (title: string, initialValue: string) => {
    const nextValue = window.prompt(title, initialValue);
    return nextValue?.trim() ?? "";
  };

  return (
    <div className="workspace-view-tabs" data-testid="reference-workspace-saved-views">
      <div className="workspace-view-tabs__list" role="tablist" aria-label="工作区视图">
        {tabItems.map((item) => {
          const active = props.activeViewId === item.id;
          const shellClassName = active ? "workspace-view-tabs__tab-shell workspace-view-tabs__tab-shell--active" : "workspace-view-tabs__tab-shell";
          return (
            <div key={item.id || "__builtin__"} className={shellClassName} ref={active ? menuRef : undefined}>
              <button
                type="button"
                role="tab"
                aria-selected={active}
                className="workspace-view-tabs__tab"
                onClick={() => void props.onSelectView(item.id)}
              >
                {item.label}
              </button>
              {active ? (
                <>
                  <button
                    type="button"
                    className="workspace-view-tabs__icon-button workspace-view-tabs__icon-button--inline"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label="更多视图操作"
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuOpen((current) => !current);
                    }}
                  >
                    更多
                  </button>
                  {menuOpen ? (
                    <div className="workspace-view-tabs__menu" role="menu" aria-label="视图操作">
                      <button
                        type="button"
                        role="menuitem"
                        disabled={!hasActiveSavedView}
                        onClick={() => {
                          const nextName = openPrompt("重命名视图", activeLabel);
                          if (nextName) {
                            void props.onRenameView(nextName);
                          }
                          setMenuOpen(false);
                        }}
                      >
                        重命名
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          const nextName = openPrompt("复制视图", nextSuggestedName(activeLabel));
                          if (nextName) {
                            void props.onDuplicateView(nextName);
                          }
                          setMenuOpen(false);
                        }}
                      >
                        复制视图
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={!props.canSetAsDefault || !hasActiveSavedView}
                        onClick={() => {
                          void props.onSetDefaultView();
                          setMenuOpen(false);
                        }}
                      >
                        设为默认
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={!hasActiveSavedView}
                        onClick={() => {
                          const confirmed = window.confirm(`删除视图“${activeLabel}”？`);
                          if (confirmed) {
                            void props.onDeleteView();
                          }
                          setMenuOpen(false);
                        }}
                      >
                        删除视图
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          );
        })}

        <button
          type="button"
          className="workspace-view-tabs__add-button"
          aria-label="新建视图"
          onClick={() => {
            const nextName = openPrompt("新建视图", "新视图");
            if (nextName) {
              void props.onCreateView(nextName);
            }
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
