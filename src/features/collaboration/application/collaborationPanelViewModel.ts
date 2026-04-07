import type { ExposureSnapshot, SubmissionDraft, SubmissionPrecheckResult } from "../types/collaboration";

type ReviewDecision = "pending" | "accept_item" | "reject_item";

export type ExposureSummaryViewModel = {
  createdBy: string;
  filterGroupName: string;
  invoiceCount: number;
  digest: string;
  invoiceNumbers: string[];
};

export type ReceivingGateViewModel = {
  acceptDisabled: boolean;
  acceptanceStatusText: string;
  gateReasons: string[];
};

export type ReceivingImportPreviewViewModel = {
  assignedTags: string[];
  beneficiary: string;
  invoiceNumbers: string[];
  pendingReviewCount: number;
  readyImportCount: number;
  receivedBy: string;
};

function parseTags(text: string) {
  return [...new Set(text.split(/[\s,，]+/u).map((tag) => tag.trim()).filter(Boolean))];
}

export function buildExposureSummary(snapshot: ExposureSnapshot | null): ExposureSummaryViewModel | null {
  if (!snapshot) {
    return null;
  }

  return {
    createdBy: snapshot.createdBy,
    filterGroupName: snapshot.filterGroupName,
    invoiceCount: snapshot.invoiceCount,
    digest: snapshot.digest,
    invoiceNumbers: snapshot.invoiceNumbers,
  };
}

export function buildReceivingGateViewModel(input: {
  loadedDraft: SubmissionDraft | null;
  precheck: SubmissionPrecheckResult | null;
  reviewDecisions: Record<string, ReviewDecision>;
}): ReceivingGateViewModel {
  if (!input.loadedDraft || !input.precheck) {
    return {
      acceptDisabled: true,
      acceptanceStatusText: "请先加载员工提交批次。",
      gateReasons: ["未加载提交批次。"],
    };
  }

  const unresolvedReviewCount = input.precheck.reviewRequiredItems.filter((item) => (input.reviewDecisions[item.invoiceId] ?? "pending") === "pending").length;
  const acceptDisabled = input.precheck.blockedItems.length > 0 || unresolvedReviewCount > 0;

  return {
    acceptDisabled,
    acceptanceStatusText: acceptDisabled ? "整批接收当前不可用。" : "整批接收当前可用。",
    gateReasons: [
      ...input.precheck.blockedItems.map((item) => `阻塞项: ${item.invoiceNumber} / ${item.blockedReason}`),
      ...(unresolvedReviewCount > 0 ? [`待确认项 ${unresolvedReviewCount} 条仍未全部决策。`] : []),
      "当前版本仅支持整批接收或整批打回。",
      ...(input.precheck.blockedItems.length === 0 && unresolvedReviewCount === 0 ? ["当前批次已满足整批接收条件。"] : []),
    ],
  };
}

export function buildReceivingImportPreview(input: {
  loadedDraft: SubmissionDraft | null;
  financeTagsText: string;
  financeBeneficiary: string;
  receivedBy: string;
}): ReceivingImportPreviewViewModel | null {
  if (!input.loadedDraft) {
    return null;
  }

  const pendingReviewCount = input.loadedDraft.items.filter((item) => item.edited || item.sourceType === "manual" || item.parseStatus === "parse_failed").length;

  return {
    assignedTags: parseTags(input.financeTagsText),
    beneficiary: input.financeBeneficiary.trim() || input.loadedDraft.beneficiaryName,
    invoiceNumbers: input.loadedDraft.invoiceNumbers,
    pendingReviewCount,
    readyImportCount: input.loadedDraft.invoiceIds.length - pendingReviewCount,
    receivedBy: input.receivedBy.trim(),
  };
}
