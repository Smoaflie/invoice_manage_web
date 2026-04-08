import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SavedView, WorkspaceSavedViewQuery } from "../../../shared/types/savedView";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { createDefaultWorkspaceViewQuery } from "../../views/application/defaultSavedViews";
import { clearWorkspaceViewDraft, cloneWorkspaceViewDraftState, loadWorkspaceViewDraft, saveWorkspaceViewDraft, workspaceViewDraftKey, workspaceViewDraftStateEquals } from "../application/workspaceViewDrafts";
import { mergeFieldOrder, mergeVisibleFieldIds } from "../application/workspaceFieldLayout";

type WorkspaceSavedViewState = {
  ready: boolean;
  views: SavedView[];
  activeViewId: string;
  query: WorkspaceSavedViewQuery;
  visibleColumns: string[];
  setQuery: (updater: (current: WorkspaceSavedViewQuery) => WorkspaceSavedViewQuery) => void;
  setVisibleColumns: (nextVisibleColumns: string[]) => void;
  saveCurrentView: () => Promise<void>;
};

type UseWorkspaceViewDraftsInput = {
  fields: WorkspaceFieldDefinition[];
  savedViewState: WorkspaceSavedViewState;
  setWorkspaceMessage: (message: string) => void;
};

const DRAFT_PERSIST_DELAY_MS = 180;

export function useWorkspaceViewDrafts(input: UseWorkspaceViewDraftsInput) {
  const { ready, views, activeViewId, query, visibleColumns, setQuery, setVisibleColumns, saveCurrentView } = input.savedViewState;
  const currentView = useMemo(
    () => views.find((view) => view.id === activeViewId) ?? null,
    [activeViewId, views],
  );
  const defaultVisibleColumns = useMemo(() => input.fields.map((field) => field.id), [input.fields]);
  const baseQuery = useMemo(() => {
    const source = cloneWorkspaceViewDraftState({
      query: (currentView?.query as WorkspaceSavedViewQuery | undefined) ?? createDefaultWorkspaceViewQuery(),
      visibleColumns: [],
    }).query;

    return {
      ...source,
      sorters: (source.sorters ?? []).length > 0 ? source.sorters : [{ fieldId: "updatedAt", direction: "desc" as const }],
      fieldOrder: mergeFieldOrder(input.fields, source.fieldOrder ?? []),
    };
  }, [currentView, input.fields]);
  const baseVisibleColumns = useMemo(
    () => mergeVisibleFieldIds(input.fields, currentView?.visibleColumns ?? defaultVisibleColumns),
    [currentView, defaultVisibleColumns, input.fields],
  );
  const baseState = useMemo(
    () =>
      cloneWorkspaceViewDraftState({
        query: baseQuery,
        visibleColumns: baseVisibleColumns,
      }),
    [baseQuery, baseVisibleColumns],
  );
  const activeDraftKey = useMemo(() => workspaceViewDraftKey(activeViewId), [activeViewId]);
  const [loadedDraftKey, setLoadedDraftKey] = useState("");
  const applyingDraftRef = useRef(false);
  const currentState = useMemo(
    () =>
      cloneWorkspaceViewDraftState({
        query,
        visibleColumns,
      }),
    [query, visibleColumns],
  );
  const currentStateRef = useRef(currentState);

  useEffect(() => {
    currentStateRef.current = currentState;
  }, [currentState]);

  useEffect(() => {
    if (!ready || input.fields.length === 0) {
      return;
    }

    let cancelled = false;
    const initialState = currentStateRef.current;
    applyingDraftRef.current = true;

    void (async () => {
      const draft = await loadWorkspaceViewDraft(activeViewId);
      if (cancelled) {
        return;
      }

      if (!draft && !workspaceViewDraftStateEquals(currentStateRef.current, initialState)) {
        applyingDraftRef.current = false;
        setLoadedDraftKey(activeDraftKey);
        return;
      }

      const nextState = draft ?? baseState;
      const clonedState = cloneWorkspaceViewDraftState(nextState);
      setQuery(() => clonedState.query);
      setVisibleColumns(clonedState.visibleColumns);
      applyingDraftRef.current = false;
      setLoadedDraftKey(activeDraftKey);
    })();

    return () => {
      cancelled = true;
      applyingDraftRef.current = false;
    };
  }, [activeDraftKey, activeViewId, baseState, input.fields.length, ready, setQuery, setVisibleColumns]);

  const hasViewDraft = loadedDraftKey === activeDraftKey && !workspaceViewDraftStateEquals(currentState, baseState);

  useEffect(() => {
    if (!ready || input.fields.length === 0 || loadedDraftKey !== activeDraftKey || applyingDraftRef.current) {
      return;
    }

    if (!hasViewDraft) {
      void clearWorkspaceViewDraft(activeViewId);
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      void saveWorkspaceViewDraft(activeViewId, currentState, () => new Date().toISOString());
    }, DRAFT_PERSIST_DELAY_MS);

    return () => globalThis.clearTimeout(timeoutId);
  }, [activeDraftKey, activeViewId, currentState, hasViewDraft, input.fields.length, loadedDraftKey, ready]);

  const handleSaveViewDraft = useCallback(async () => {
    const draftViewId = activeViewId;
    await saveCurrentView();
    await clearWorkspaceViewDraft(draftViewId);
    input.setWorkspaceMessage("已保存当前视图。");
  }, [activeViewId, input.setWorkspaceMessage, saveCurrentView]);

  const handleDiscardViewDraft = useCallback(async () => {
    const clonedBaseState = cloneWorkspaceViewDraftState(baseState);
    applyingDraftRef.current = true;
    setQuery(() => clonedBaseState.query);
    setVisibleColumns(clonedBaseState.visibleColumns);
    await clearWorkspaceViewDraft(activeViewId);
    applyingDraftRef.current = false;
    setLoadedDraftKey(activeDraftKey);
    input.setWorkspaceMessage("已放弃当前视图草稿。");
  }, [activeDraftKey, activeViewId, baseState, input.setWorkspaceMessage, setQuery, setVisibleColumns]);

  return {
    currentView,
    hasViewDraft,
    handleSaveViewDraft,
    handleDiscardViewDraft,
  };
}
