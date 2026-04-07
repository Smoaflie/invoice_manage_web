import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { FilterGroupRule } from "../../../shared/types/filterGroup";
import { matchesFilterRule } from "../../filters/application/matchFilterRules";

type ApplyMatchTagInput = {
  documents: InvoiceDocument[];
  matchedInvoiceIds: string[];
  tag: string;
  now: () => string;
};

export function applyMatchTagToInvoices(input: ApplyMatchTagInput): InvoiceDocument[] {
  const normalizedTag = input.tag.trim();
  if (!normalizedTag) {
    return [];
  }

  const matchedIds = new Set(input.matchedInvoiceIds);
  const updatedAt = input.now();

  return input.documents.flatMap((document) => {
    if (!matchedIds.has(document.id)) {
      return [];
    }

    const nextTags = [...new Set([...document.tags, normalizedTag])];
    const nextStatus = "matched_in_snapshot" as const;
    const changed =
      nextStatus !== (document.collaborationStatus ?? "local_only") || JSON.stringify(nextTags) !== JSON.stringify(document.tags);

    if (!changed) {
      return [];
    }

    return [
      {
        ...document,
        tags: nextTags,
        collaborationStatus: nextStatus,
        updatedAt,
      },
    ];
  });
}

export function selectDocumentsForFilterGroup(documents: InvoiceDocument[], rules: FilterGroupRule[], groupId: string) {
  if (!groupId) {
    return [];
  }

  const groupRules = rules.filter((rule) => rule.groupId === groupId);
  if (groupRules.length === 0) {
    return [];
  }

  return documents.filter((document) => groupRules.some((rule) => matchesFilterRule(document, rule)));
}
