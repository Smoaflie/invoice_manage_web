import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

const mockedDeps = vi.hoisted(() => ({
  syncSpecialTagGroupsMock: vi.fn(),
  loadTagMetadataMock: vi.fn(async () => ({
    definitions: [],
    groups: [{ id: "group-period", name: "时期", sortOrder: 1 }],
    links: [{ tagName: "时期:2024年", groupId: "group-period" }],
  })),
}));

vi.mock("../../tags/application/specialTagGroups", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../tags/application/specialTagGroups")>();
  return {
    ...actual,
    syncSpecialTagGroups: mockedDeps.syncSpecialTagGroupsMock,
  };
});

vi.mock("../../tags/application/tagMetadata", () => ({
  loadTagMetadata: mockedDeps.loadTagMetadataMock,
}));

import { useWorkspaceSchema } from "./useWorkspaceSchema";

const invoiceDocuments: InvoiceDocument[] = [
  {
    id: "doc-1",
    contentHash: "hash-1",
    fileName: "demo.pdf",
    fileSize: 10,
    lastModified: 1,
    handleRef: "handle-1",
    bindingStatus: "readable",
    bindingErrorType: null,
    ocrVendor: "baidu",
    ocrParsedAt: "2026-04-01T00:00:00.000Z",
    parseStatus: "parsed",
    conflictStatus: "none",
    conflictMessage: "",
    invoiceNumber: "INV-001",
    invoiceCode: "CODE-001",
    invoiceDate: "2026-04-01",
    totalAmount: 100,
    taxAmount: 10,
    amountWithoutTax: 90,
    buyerName: "华东买方",
    sellerName: "上海供应商",
    items: [],
    tags: ["时期:2024年"],
    annotation: "",
    uploader: "",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
  },
];

describe("useWorkspaceSchema", () => {
  afterEach(() => {
    mockedDeps.syncSpecialTagGroupsMock.mockReset();
    mockedDeps.loadTagMetadataMock.mockClear();
  });

  test("syncs special tags from provided invoice rows without re-reading app db", async () => {
    const { result } = renderHook(() => useWorkspaceSchema(invoiceDocuments));

    await waitFor(() => expect(result.current.fields.some((field) => field.id === "tag-group:group-period")).toBe(true));

    expect(mockedDeps.syncSpecialTagGroupsMock).toHaveBeenCalledWith(invoiceDocuments);
    expect(mockedDeps.loadTagMetadataMock).toHaveBeenCalled();
  });

  test("skips special tag sync when rerendered rows keep the same special tag set", async () => {
    const { rerender } = renderHook(({ rows }) => useWorkspaceSchema(rows), {
      initialProps: { rows: invoiceDocuments },
    });

    await waitFor(() => expect(mockedDeps.syncSpecialTagGroupsMock).toHaveBeenCalledTimes(1));

    rerender({
      rows: invoiceDocuments.map((row) => ({
        ...row,
        tags: [...row.tags],
      })),
    });

    await waitFor(() => expect(mockedDeps.loadTagMetadataMock).toHaveBeenCalled());
    expect(mockedDeps.syncSpecialTagGroupsMock).toHaveBeenCalledTimes(1);
  });
});
