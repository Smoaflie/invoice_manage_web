import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConditionGroup } from "../../../shared/types/filterGroup";
import type { DashboardDocument } from "../../../shared/types/dashboardDocument";
import { listFilterGroups, loadDashboardDocument, saveDashboardDocument } from "../../filters/application/filterGroups";

export function useWorkspaceAuxiliaryDocuments() {
  const [dashboardDocument, setDashboardDocument] = useState<Awaited<ReturnType<typeof loadDashboardDocument>>>(null);
  const [filterGroups, setFilterGroups] = useState<Array<{ id: string; name: string; root: ConditionGroup }>>([]);

  const refreshFilterGroups = useCallback(async () => {
    const groups = await listFilterGroups();
    setFilterGroups(groups.map((group) => ({ id: group.id, name: group.name, root: group.root })));
  }, []);

  const persistDashboardDocument = useCallback(async (document: DashboardDocument) => {
    await saveDashboardDocument(document);
    setDashboardDocument(document);
    return document;
  }, []);

  useEffect(() => {
    let active = true;

    void loadDashboardDocument().then((document) => {
      if (active) {
        setDashboardDocument(document);
      }
    });
    void refreshFilterGroups();

    return () => {
      active = false;
    };
  }, [refreshFilterGroups]);

  const filterGroupsById = useMemo(() => new Map(filterGroups.map((group) => [group.id, group.root])), [filterGroups]);
  const resolveFilterGroup = useCallback((filterGroupId: string) => filterGroupsById.get(filterGroupId) ?? null, [filterGroupsById]);

  return {
    dashboardDocument,
    filterGroups,
    saveDashboardDocument: persistDashboardDocument,
    refreshFilterGroups,
    resolveFilterGroup,
  };
}
