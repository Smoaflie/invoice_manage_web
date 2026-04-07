import { describe, expect, test } from "vitest";
import { applyMatchTagToInvoices } from "./collaborationInvoices";
import { makeInvoiceDocument } from "./testUtils";

describe("collaborationInvoices", () => {
  test("tags matched invoices and marks them as matched in snapshot", () => {
    const updated = applyMatchTagToInvoices({
      documents: [
        makeInvoiceDocument({ id: "doc-1", tags: ["差旅"] }),
        makeInvoiceDocument({ id: "doc-2", tags: [] }),
      ],
      matchedInvoiceIds: ["doc-1"],
      tag: "财务已登记",
      now: () => "2026-04-01T09:30:00.000Z",
    });

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({
      id: "doc-1",
      tags: ["差旅", "财务已登记"],
      collaborationStatus: "matched_in_snapshot",
      updatedAt: "2026-04-01T09:30:00.000Z",
    });
  });

  test("does not duplicate existing tags or change unmatched invoices", () => {
    const updated = applyMatchTagToInvoices({
      documents: [
        makeInvoiceDocument({ id: "doc-1", tags: ["财务已登记"], collaborationStatus: "matched_in_snapshot" }),
        makeInvoiceDocument({ id: "doc-2", tags: [] }),
      ],
      matchedInvoiceIds: ["doc-1"],
      tag: "财务已登记",
      now: () => "2026-04-01T09:30:00.000Z",
    });

    expect(updated).toEqual([]);
  });
});
