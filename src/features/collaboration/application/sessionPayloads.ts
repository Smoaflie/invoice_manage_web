import { z } from "zod";

const financeInvitationPayloadSchema = z.object({
  kind: z.literal("finance-invitation"),
  sessionId: z.string(),
  offer: z.string(),
  financeName: z.string(),
  allowSourceFiles: z.boolean(),
  defaultTagDraft: z.string(),
  expiresAt: z.string(),
});

const submissionSummarySchema = z.object({
  submissionId: z.string(),
  invoiceCount: z.number(),
  invoiceNumbers: z.array(z.string()),
  includeSourceFiles: z.boolean(),
  containsEditedInvoices: z.boolean(),
  submissionTags: z.array(z.string()),
});

const responsePayloadSchema = z.object({
  kind: z.literal("employee-response"),
  sessionId: z.string(),
  answer: z.string(),
  senderName: z.string(),
  beneficiaryName: z.string(),
  submissionSummary: submissionSummarySchema,
});

const submissionSummaryPayloadSchema = submissionSummarySchema.extend({
  kind: z.literal("submission-summary"),
  senderName: z.string(),
  beneficiaryName: z.string(),
});

const submissionRecordsPayloadSchema = z.object({
  kind: z.literal("submission-records"),
  submissionId: z.string(),
  invoiceNumbers: z.array(z.string()),
  records: z.array(
    z.object({
      invoiceId: z.string(),
      invoiceNumber: z.string(),
      contentHash: z.string(),
      sourceType: z.enum(["ocr", "manual"]),
      edited: z.boolean(),
      parseStatus: z.string(),
      conflictStatus: z.string(),
      fileIncluded: z.boolean(),
      annotation: z.string(),
    }),
  ),
});

function encodePayload<T>(payload: T) {
  return globalThis.btoa(encodeURIComponent(JSON.stringify(payload)));
}

function decodePayload<T>(encoded: string, schema: z.ZodType<T>) {
  return schema.parse(JSON.parse(decodeURIComponent(globalThis.atob(encoded))));
}

export function encodeFinanceInvitationPayload(payload: z.infer<typeof financeInvitationPayloadSchema>) {
  return encodePayload(payload);
}

export function decodeFinanceInvitationPayload(encoded: string) {
  return decodePayload(encoded, financeInvitationPayloadSchema);
}

export function encodeResponsePayload(payload: z.infer<typeof responsePayloadSchema>) {
  return encodePayload(payload);
}

export function decodeResponsePayload(encoded: string) {
  return decodePayload(encoded, responsePayloadSchema);
}

export function encodeSubmissionSummaryPayload(payload: z.infer<typeof submissionSummaryPayloadSchema>) {
  return encodePayload(payload);
}

export function decodeSubmissionSummaryPayload(encoded: string) {
  return decodePayload(encoded, submissionSummaryPayloadSchema);
}

export function encodeSubmissionRecordsPayload(payload: z.infer<typeof submissionRecordsPayloadSchema>) {
  return encodePayload(payload);
}

export function decodeSubmissionRecordsPayload(encoded: string) {
  return decodePayload(encoded, submissionRecordsPayloadSchema);
}
