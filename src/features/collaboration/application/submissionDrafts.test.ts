import { describe, expect, test } from "vitest";
import { buildSubmissionDraft } from "./submissionDrafts";
import { makeInvoiceDocument } from "./testUtils";

describe("submissionDrafts", () => {
  test("builds a batch draft with the default local success tag", () => {
    const draft = buildSubmissionDraft({
      senderName: "Alice",
      beneficiaryName: "Alice",
      sourceSnapshotId: "snapshot-1",
      filterGroupId: "group-1",
      documents: [
        makeInvoiceDocument({ id: "doc-1", invoiceNumber: "INV-001", annotation: "差旅" }),
        makeInvoiceDocument({ id: "doc-2", invoiceNumber: "INV-002", annotation: "餐补" }),
      ],
      includeSourceFiles: true,
      submissionTagsText: "待报销 项目A",
      note: "四月提交",
      successAckLocalTag: "",
      successAckLocalTagEnabled: true,
      now: () => "2026-04-01T10:00:00.000Z",
    });

    expect(draft).toMatchObject({
      senderName: "Alice",
      beneficiaryName: "Alice",
      includeSourceFiles: true,
      submissionTags: ["待报销", "项目A"],
      successAckLocalTag: "已发送财务",
      successAckLocalTagEnabled: true,
      invoiceIds: ["doc-1", "doc-2"],
      invoiceNumbers: ["INV-001", "INV-002"],
    });
    expect(draft.items[0]).toMatchObject({
      invoiceId: "doc-1",
      fileIncluded: true,
      annotation: "差旅",
    });
  });
});
