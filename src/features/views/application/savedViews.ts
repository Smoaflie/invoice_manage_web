import { appDb } from "../../../shared/db/appDb";
import type { SavedView, SavedViewQuery, SavedViewScope } from "../../../shared/types/savedView";

export function buildDefaultViewName(scope: SavedViewScope) {
  if (scope === "invoices") {
    return "默认发票视图";
  }
  if (scope === "files") {
    return "默认文件视图";
  }
  return "默认工作区视图";
}

export async function listSavedViews(scope: SavedViewScope) {
  const views = await appDb.savedViews.where("scope").equals(scope).toArray();
  return views.sort((left, right) => Number(right.isDefault) - Number(left.isDefault) || right.updatedAt.localeCompare(left.updatedAt));
}

export async function saveSavedView(input: {
  id?: string;
  scope: SavedViewScope;
  name: string;
  isDefault: boolean;
  query: SavedViewQuery;
  visibleColumns: string[];
  now: () => string;
}) {
  const timestamp = input.now();
  const siblingViews = await appDb.savedViews.where("scope").equals(input.scope).toArray();
  const existingView =
    (input.id ? siblingViews.find((view) => view.id === input.id) : undefined) ??
    siblingViews.find((view) => view.name === input.name.trim());
  const view: SavedView = {
    id: existingView?.id ?? globalThis.crypto.randomUUID(),
    scope: input.scope,
    name: input.name.trim(),
    isDefault: input.isDefault,
    query: input.query,
    visibleColumns: [...input.visibleColumns],
    createdAt: existingView?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  await appDb.transaction("rw", appDb.savedViews, async () => {
    if (view.isDefault) {
      await Promise.all(
        siblingViews
          .filter((item) => item.id !== view.id && item.isDefault)
          .map((item) => appDb.savedViews.put({ ...item, isDefault: false, updatedAt: timestamp })),
      );
    }

    await appDb.savedViews.put(view);
  });

  return view;
}

export async function loadSavedView(viewId: string | null) {
  if (!viewId) {
    return null;
  }
  return (await appDb.savedViews.get(viewId)) ?? null;
}

export async function deleteSavedView(viewId: string) {
  await appDb.savedViews.delete(viewId);
}

export async function loadDefaultSavedView(scope: SavedViewScope) {
  const views = await listSavedViews(scope);
  return views.find((view) => view.isDefault) ?? null;
}

export async function saveActiveViewId(
  key: "ui.activeInvoiceViewId" | "ui.activeFileViewId" | "ui.dashboardInvoiceViewId" | "ui.activeWorkspaceViewId",
  value: string | null,
  now: () => string,
) {
  await appDb.settings.put({
    key,
    value,
    updatedAt: now(),
  });
}

export async function loadActiveViewId(key: "ui.activeInvoiceViewId" | "ui.activeFileViewId" | "ui.dashboardInvoiceViewId" | "ui.activeWorkspaceViewId") {
  const stored = await appDb.settings.get(key);
  return typeof stored?.value === "string" || stored?.value === null ? stored.value : null;
}
