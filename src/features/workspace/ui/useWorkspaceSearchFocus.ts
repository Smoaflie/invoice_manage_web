import { useCallback, useEffect, type RefObject } from "react";
import type { WorkspaceSavedViewQuery } from "../../../shared/types/savedView";
import { isEditableTarget } from "./referenceWorkspaceController.shared";

type SearchFocusState = {
  query: WorkspaceSavedViewQuery;
  setQuery: (updater: (current: WorkspaceSavedViewQuery) => WorkspaceSavedViewQuery) => void;
};

export function useWorkspaceSearchFocus(searchInputRef: RefObject<HTMLInputElement | null>, savedViewState: SearchFocusState) {
  const focusWorkspaceSearch = useCallback(
    (options?: { seedFromSelection?: boolean }) => {
      const selectionText = options?.seedFromSelection ? globalThis.getSelection?.()?.toString().trim() ?? "" : "";
      if (selectionText && savedViewState.query.searchText.trim().length === 0) {
        savedViewState.setQuery((current) => ({ ...current, searchText: selectionText }));
      }

      globalThis.setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 0);
    },
    [savedViewState, searchInputRef],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "f") {
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
      focusWorkspaceSearch({ seedFromSelection: true });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusWorkspaceSearch]);

  return focusWorkspaceSearch;
}
