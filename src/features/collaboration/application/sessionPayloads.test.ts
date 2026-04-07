import { describe, expect, test } from "vitest";
import {
  decodeFinanceInvitationPayload,
  decodeResponsePayload,
  decodeSubmissionRecordsPayload,
  decodeSubmissionSummaryPayload,
  encodeFinanceInvitationPayload,
  encodeResponsePayload,
  encodeSubmissionRecordsPayload,
  encodeSubmissionSummaryPayload,
} from "./sessionPayloads";

describe("sessionPayloads", () => {
  test("round-trips the finance invitation payload", () => {
    const encoded = encodeFinanceInvitationPayload({
      kind: "finance-invitation",
      sessionId: "session-1",
      offer: "offer-sdp",
      financeName: "Finance",
      allowSourceFiles: true,
      defaultTagDraft: "",
      expiresAt: "2026-04-01T12:00:00.000Z",
    });

    expect(decodeFinanceInvitationPayload(encoded)).toEqual({
      kind: "finance-invitation",
      sessionId: "session-1",
      offer: "offer-sdp",
      financeName: "Finance",
      allowSourceFiles: true,
      defaultTagDraft: "",
      expiresAt: "2026-04-01T12:00:00.000Z",
    });
  });

  test("round-trips the employee response payload", () => {
    const encoded = encodeResponsePayload({
      kind: "employee-response",
      sessionId: "session-1",
      answer: "answer-sdp",
      senderName: "Alice",
      beneficiaryName: "Alice",
      submissionSummary: {
        submissionId: "submission-1",
        invoiceCount: 2,
        invoiceNumbers: ["INV-001", "INV-002"],
        includeSourceFiles: true,
        containsEditedInvoices: false,
        submissionTags: ["待报销"],
      },
    });

    expect(decodeResponsePayload(encoded)).toEqual({
      kind: "employee-response",
      sessionId: "session-1",
      answer: "answer-sdp",
      senderName: "Alice",
      beneficiaryName: "Alice",
      submissionSummary: {
        submissionId: "submission-1",
        invoiceCount: 2,
        invoiceNumbers: ["INV-001", "INV-002"],
        includeSourceFiles: true,
        containsEditedInvoices: false,
        submissionTags: ["待报销"],
      },
    });
  });

  test("round-trips staged submission payloads", () => {
    const summaryEncoded = encodeSubmissionSummaryPayload({
      kind: "submission-summary",
      submissionId: "submission-1",
      invoiceCount: 1,
      invoiceNumbers: ["INV-001"],
      includeSourceFiles: false,
      containsEditedInvoices: true,
      submissionTags: ["待报销"],
      senderName: "Alice",
      beneficiaryName: "Alice",
    });
    const recordsEncoded = encodeSubmissionRecordsPayload({
      kind: "submission-records",
      submissionId: "submission-1",
      invoiceNumbers: ["INV-001"],
      records: [
        {
          invoiceId: "doc-1",
          invoiceNumber: "INV-001",
          contentHash: "hash-1",
          sourceType: "ocr",
          edited: true,
          parseStatus: "parsed",
          conflictStatus: "none",
          fileIncluded: false,
          annotation: "",
        },
      ],
    });

    expect(decodeSubmissionSummaryPayload(summaryEncoded)).toMatchObject({
      kind: "submission-summary",
      submissionId: "submission-1",
      senderName: "Alice",
    });
    expect(decodeSubmissionRecordsPayload(recordsEncoded)).toMatchObject({
      kind: "submission-records",
      submissionId: "submission-1",
      invoiceNumbers: ["INV-001"],
    });
  });
});
