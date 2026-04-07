import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { appDb } from "../../../shared/db/appDb";

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

async function loadWorkspaceSelection() {
  const stored = await appDb.settings.get("ui.workspaceSelectedIds");
  return Array.isArray(stored?.value) ? stored.value.filter((value): value is string => typeof value === "string") : [];
}

async function saveWorkspaceSelection(value: string[]) {
  await appDb.settings.put({
    key: "ui.workspaceSelectedIds",
    value,
    updatedAt: new Date().toISOString(),
  });
}

export function usePersistedWorkspaceSelection(documentIds: string[]) {
  const [selectedIdSet, setSelectedIdSet] = useState<Set<string>>(() => new Set());
  const hydratedRef = useRef(false);
  const userChangedRef = useRef(false);
  const selectedIdSetRef = useRef(selectedIdSet);

  useEffect(() => {
    selectedIdSetRef.current = selectedIdSet;
  }, [selectedIdSet]);

  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }

    let cancelled = false;
    void loadWorkspaceSelection().then((storedIds) => {
      if (cancelled) {
        return;
      }
      hydratedRef.current = true;
      if (userChangedRef.current) {
        void saveWorkspaceSelection([...selectedIdSetRef.current]);
        return;
      }
      const availableIds = new Set(documentIds);
      setSelectedIdSet(new Set(storedIds.filter((id) => availableIds.has(id))));
    });

    return () => {
      cancelled = true;
    };
  }, [documentIds]);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }

    void saveWorkspaceSelection([...selectedIdSet]);
  }, [selectedIdSet]);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }

    const documentIdSet = new Set(documentIds);
    setSelectedIdSet((current) => {
      const nextIds = [...current].filter((id) => documentIdSet.has(id));
      return sameIds([...current], nextIds) ? current : new Set(nextIds);
    });
  }, [documentIds]);

  const updateSelectedIdSet = useCallback((value: SetStateAction<Set<string>>) => {
    userChangedRef.current = true;
    setSelectedIdSet(value);
  }, []);

  return { selectedIdSet, setSelectedIdSet: updateSelectedIdSet };
}
