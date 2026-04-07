import { useEffect, useMemo, useState } from "react";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { syncSpecialTagGroups } from "../../tags/application/specialTagGroups";
import { loadTagMetadata } from "../../tags/application/tagMetadata";
import { buildWorkspaceFields } from "./workspaceFields";

function buildSpecialTagSignature(invoiceDocuments: InvoiceDocument[]) {
  return [...new Set(invoiceDocuments.flatMap((row) => row.tags).filter((tag) => tag.includes(":") || tag.includes("：")))].sort().join("|");
}

export function useWorkspaceSchema(invoiceDocuments: InvoiceDocument[]) {
  const [tagGroups, setTagGroups] = useState<Array<{ id: string; name: string; sortOrder: number }>>([]);
  const [tagGroupLinks, setTagGroupLinks] = useState<Array<{ tagName: string; groupId: string }>>([]);
  const specialTagSignature = useMemo(() => buildSpecialTagSignature(invoiceDocuments), [invoiceDocuments]);

  const reloadMetadata = async () => {
    await syncSpecialTagGroups(invoiceDocuments);
    const tagMetadata = await loadTagMetadata();
    setTagGroups(tagMetadata.groups);
    setTagGroupLinks(tagMetadata.links);
  };

  useEffect(() => {
    void reloadMetadata();
  }, [specialTagSignature]);

  const fields = useMemo(
    () =>
      buildWorkspaceFields({
        tagGroups,
        tagGroupLinks,
      }),
    [tagGroupLinks, tagGroups],
  );

  return {
    fields,
    reloadMetadata,
  };
}
