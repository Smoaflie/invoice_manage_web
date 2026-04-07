import { useEffect, useState } from "react";
import type { SavedView, SavedViewQuery, SavedViewScope } from "../../../shared/types/savedView";
import { buildDefaultViewName, deleteSavedView, listSavedViews, loadActiveViewId, loadSavedView, saveActiveViewId, saveSavedView } from "../application/savedViews";

type ActiveViewKey = "ui.activeInvoiceViewId" | "ui.activeFileViewId" | "ui.dashboardInvoiceViewId" | "ui.activeWorkspaceViewId";

type UseSavedViewStateOptions<TQuery extends SavedViewQuery, TColumn extends string> = {
  scope: SavedViewScope;
  activeViewKey: ActiveViewKey;
  createDefaultQuery: () => TQuery;
  createDefaultVisibleColumns: () => TColumn[];
};

export function useSavedViewState<TQuery extends SavedViewQuery, TColumn extends string = string>({
  scope,
  activeViewKey,
  createDefaultQuery,
  createDefaultVisibleColumns,
}: UseSavedViewStateOptions<TQuery, TColumn>) {
  const [ready, setReady] = useState(false);
  const [views, setViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState("");
  const [draftName, setDraftName] = useState("");
  const [query, setQuery] = useState<TQuery>(createDefaultQuery);
  const [visibleColumns, setVisibleColumns] = useState<TColumn[]>(createDefaultVisibleColumns);

  const applyView = (view: SavedView | null) => {
    if (!view) {
      setActiveViewId("");
      setDraftName("");
      setQuery(createDefaultQuery());
      setVisibleColumns(createDefaultVisibleColumns());
      return;
    }

    setActiveViewId(view.id);
    setDraftName(view.name);
    setQuery(view.query as TQuery);
    setVisibleColumns([...view.visibleColumns] as TColumn[]);
  };

  const refresh = async () => {
    const nextViews = await listSavedViews(scope);
    const storedViewId = await loadActiveViewId(activeViewKey);
    const resolvedView = (storedViewId ? nextViews.find((view) => view.id === storedViewId) : undefined) ?? nextViews.find((view) => view.isDefault) ?? null;
    setViews(nextViews);
    applyView(resolvedView);
    setReady(true);
  };

  const selectView = async (viewId: string) => {
    if (!viewId) {
      await saveActiveViewId(activeViewKey, null, () => new Date().toISOString());
      applyView(null);
      return;
    }

    const view = await loadSavedView(viewId);
    if (!view || view.scope !== scope) {
      await saveActiveViewId(activeViewKey, null, () => new Date().toISOString());
      applyView(null);
      return;
    }

    await saveActiveViewId(activeViewKey, view.id, () => new Date().toISOString());
    applyView(view);
  };

  const persistView = async (mode: "current" | "new") => {
    const currentView = views.find((view) => view.id === activeViewId);
    const nextName =
      mode === "new"
        ? draftName.trim()
        : currentView?.name || draftName.trim() || buildDefaultViewName(scope);
    const savedView = await saveSavedView({
      id: mode === "current" ? currentView?.id : undefined,
      scope,
      name: nextName,
      isDefault: mode === "current" ? currentView?.isDefault ?? activeViewId.length === 0 : false,
      query,
      visibleColumns,
      now: () => new Date().toISOString(),
    });

    await saveActiveViewId(activeViewKey, savedView.id, () => new Date().toISOString());
    await refresh();
  };

  const setDefaultView = async () => {
    const currentView = views.find((view) => view.id === activeViewId);
    if (!currentView) {
      return;
    }

    await saveSavedView({
      id: currentView.id,
      scope,
      name: currentView.name,
      isDefault: true,
      query,
      visibleColumns,
      now: () => new Date().toISOString(),
    });

    await saveActiveViewId(activeViewKey, currentView.id, () => new Date().toISOString());
    await refresh();
  };

  const renameCurrentView = async (nextName: string) => {
    const currentView = views.find((view) => view.id === activeViewId);
    const trimmedName = nextName.trim();
    if (!currentView || trimmedName.length === 0) {
      return;
    }

    await saveSavedView({
      id: currentView.id,
      scope,
      name: trimmedName,
      isDefault: currentView.isDefault,
      query,
      visibleColumns,
      now: () => new Date().toISOString(),
    });

    await saveActiveViewId(activeViewKey, currentView.id, () => new Date().toISOString());
    await refresh();
  };

  const duplicateCurrentView = async (nextName: string) => {
    const trimmedName = nextName.trim();
    if (trimmedName.length === 0) {
      return;
    }

    const savedView = await saveSavedView({
      scope,
      name: trimmedName,
      isDefault: false,
      query,
      visibleColumns,
      now: () => new Date().toISOString(),
    });

    await saveActiveViewId(activeViewKey, savedView.id, () => new Date().toISOString());
    await refresh();
  };

  const createNamedView = async (nextName: string) => {
    await duplicateCurrentView(nextName);
  };

  const deleteCurrentView = async () => {
    const currentView = views.find((view) => view.id === activeViewId);
    if (!currentView) {
      return;
    }

    await deleteSavedView(currentView.id);
    await saveActiveViewId(activeViewKey, null, () => new Date().toISOString());
    await refresh();
  };

  useEffect(() => {
    let active = true;

    void (async () => {
      const nextViews = await listSavedViews(scope);
      const storedViewId = await loadActiveViewId(activeViewKey);
      if (!active) {
        return;
      }

      const resolvedView = (storedViewId ? nextViews.find((view) => view.id === storedViewId) : undefined) ?? nextViews.find((view) => view.isDefault) ?? null;
      setViews(nextViews);
      applyView(resolvedView);
      setReady(true);
    })();

    return () => {
      active = false;
    };
  }, []);

  return {
    ready,
    views,
    activeViewId,
    draftName,
    query,
    visibleColumns,
    setDraftName,
    setQuery,
    setVisibleColumns,
    selectView,
    saveCurrentView: async () => persistView("current"),
    saveAsNewView: async () => persistView("new"),
    setDefaultView,
    renameCurrentView,
    duplicateCurrentView,
    createNamedView,
    deleteCurrentView,
    clearToBuiltin: async () => selectView(""),
  };
}
