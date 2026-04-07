import { describe, expect, test } from "vitest";
import { buildExposureSnapshot, matchExposureSnapshot } from "./exposureSnapshots";
import { makeInvoiceDocument } from "./testUtils";

describe("exposureSnapshots", () => {
  test("builds a deduplicated sorted number snapshot", () => {
    const snapshot = buildExposureSnapshot({
      createdBy: "Finance",
      filterGroupId: "group-1",
      filterGroupName: "已报销",
      labelSummary: "已报销",
      documents: [
        makeInvoiceDocument({ id: "doc-2", invoiceNumber: "INV-003" }),
        makeInvoiceDocument({ id: "doc-3", invoiceNumber: "INV-001" }),
        makeInvoiceDocument({ id: "doc-4", invoiceNumber: "INV-003" }),
        makeInvoiceDocument({ id: "doc-5", invoiceNumber: "" }),
      ],
      now: () => "2026-04-01T09:00:00.000Z",
    });

    expect(snapshot.invoiceNumbers).toEqual(["INV-001", "INV-003"]);
    expect(snapshot.invoiceCount).toBe(2);
    expect(snapshot.digest).toBe("INV-001|INV-003");
  });

  test("matches snapshot numbers against local invoices", () => {
    const snapshot = buildExposureSnapshot({
      createdBy: "Finance",
      filterGroupId: "group-1",
      filterGroupName: "已报销",
      labelSummary: "",
      documents: [makeInvoiceDocument({ invoiceNumber: "INV-001" }), makeInvoiceDocument({ invoiceNumber: "INV-004" })],
      now: () => "2026-04-01T09:00:00.000Z",
    });

    const result = matchExposureSnapshot(snapshot, [
      makeInvoiceDocument({ id: "doc-1", invoiceNumber: "INV-001" }),
      makeInvoiceDocument({ id: "doc-2", invoiceNumber: "INV-002" }),
      makeInvoiceDocument({ id: "doc-3", invoiceNumber: "INV-004" }),
    ]);

    expect(result.matchedInvoiceIds).toEqual(["doc-1", "doc-3"]);
    expect(result.matchedInvoiceNumbers).toEqual(["INV-001", "INV-004"]);
    expect(result.unmatchedInvoiceIds).toEqual(["doc-2"]);
  });
});
