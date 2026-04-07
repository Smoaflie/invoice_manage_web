import { describe, expect, it } from "vitest";
import { buildReceivingGateViewModel } from "./collaborationPanelViewModel";
import type { SubmissionDraft, SubmissionPrecheckResult } from "../types/collaboration";

const draft: SubmissionDraft = {
  submissionId: "submission-1",
  createdAt: "2026-04-04T00:00:00.000Z",
  senderName: "Alice",
  beneficiaryName: "Alice",
  sourceSnapshotId: "",
  filterGroupId: "group-1",
  invoiceIds: ["doc-1"],
  invoiceNumbers: ["INV-001"],
  includeSourceFiles: false,
  submissionTags: ["待报销"],
  note: "",
  successAckLocalTag: "已发送财务",
  successAckLocalTagEnabled: true,
  items: [],
};

const precheck: SubmissionPrecheckResult = {
  acceptable: false,
  duplicateInvoiceNumbers: [],
  blockedItems: [],
  reviewRequiredItems: [
    {
      invoiceId: "doc-1",
      invoiceNumber: "INV-001",
      blockedReason: null,
      reviewRequired: true,
    },
  ],
};

describe("collaborationPanelViewModel", () => {
  it("treats rejected review items as resolved for whole-batch gating", () => {
    const gate = buildReceivingGateViewModel({
      loadedDraft: draft,
      precheck,
      reviewDecisions: { "doc-1": "reject_item" },
    });

    expect(gate.acceptDisabled).toBe(false);
    expect(gate.acceptanceStatusText).toBe("整批接收当前可用。");
    expect(gate.gateReasons).not.toContain("待确认项 1 条仍未全部决策。");
  });
});
