import { appDb } from "../../../shared/db/appDb";
import type { WorkspaceSavedViewQuery } from "../../../shared/types/savedView";

const BUILTIN_WORKSPACE_VIEW_DRAFT_ID = "__builtin__";

export type WorkspaceViewDraftState = {
  query: WorkspaceSavedViewQuery;
  visibleColumns: string[];
};

type WorkspaceViewDraftRecord = {
  key: string;
  value: WorkspaceViewDraftState;
  updatedAt: string;
};

function workspaceViewDraftSettings() {
  return appDb.table<WorkspaceViewDraftRecord, string>("settings");
}

export function workspaceViewDraftKey(viewId: string) {
  return `ui.workspaceViewDraft.${viewId || BUILTIN_WORKSPACE_VIEW_DRAFT_ID}`;
}

export function cloneWorkspaceViewDraftState<T extends WorkspaceViewDraftState>(state: T): T {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(state);
  }

  return JSON.parse(JSON.stringify(state)) as T;
}

export function workspaceViewDraftStateEquals(left: WorkspaceViewDraftState, right: WorkspaceViewDraftState) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export async function loadWorkspaceViewDraft(viewId: string) {
  const stored = await workspaceViewDraftSettings().get(workspaceViewDraftKey(viewId));
  return stored?.value ? cloneWorkspaceViewDraftState(stored.value) : null;
}

export async function saveWorkspaceViewDraft(viewId: string, draft: WorkspaceViewDraftState, now: () => string) {
  await workspaceViewDraftSettings().put({
    key: workspaceViewDraftKey(viewId),
    value: cloneWorkspaceViewDraftState(draft),
    updatedAt: now(),
  });
}

export async function clearWorkspaceViewDraft(viewId: string) {
  await workspaceViewDraftSettings().delete(workspaceViewDraftKey(viewId));
}
