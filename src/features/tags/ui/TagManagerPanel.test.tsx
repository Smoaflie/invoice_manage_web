import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, describe, expect, test } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { TagManagerPanel } from "./TagManagerPanel";

const invoiceDocument: InvoiceDocument = {
  id: "doc-1",
  contentHash: "hash-1",
  fileName: "demo.pdf",
  fileSize: 10,
  lastModified: 1,
  handleRef: "handle-1",
  bindingStatus: "readable",
  bindingErrorType: null,
  ocrVendor: null,
  ocrParsedAt: null,
  parseStatus: "parsed",
  conflictStatus: "none",
  conflictMessage: "",
  invoiceNumber: "INV-001",
  invoiceCode: "",
  invoiceDate: "",
  totalAmount: 1,
  taxAmount: 0,
  amountWithoutTax: 1,
  buyerName: "",
  sellerName: "",
  items: [],
  tags: ["已报销"],
  annotation: "",
  uploader: "",
  owner: "",
  sourceType: "ocr",
  edited: false,
  createdAt: "2026-03-31T00:00:00.000Z",
  updatedAt: "2026-03-31T00:00:00.000Z",
};

describe("TagManagerPanel", () => {
  afterEach(async () => {
    cleanup();
    await appDb.tagDefinitions.clear();
    await appDb.tagGroups.clear();
    await appDb.tagGroupLinks.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  test("creates groups, definitions and group links", async () => {
    const user = userEvent.setup();
    render(<TagManagerPanel invoiceDocuments={[invoiceDocument]} />);

    await screen.findByText("标签管理数据已加载。");
    await user.type(screen.getByLabelText("标签组名称"), "报销状态");
    await user.click(screen.getByRole("button", { name: "保存标签组" }));
    await waitFor(async () => expect(await appDb.tagGroups.count()).toBe(1));

    await user.type(screen.getByLabelText("标签名称"), "差旅");
    await user.click(screen.getByRole("button", { name: "保存标签定义" }));
    await waitFor(async () => expect(await appDb.tagDefinitions.count()).toBe(1));

    await user.selectOptions(screen.getByRole("combobox", { name: "标签" }), "已报销");
    const group = await appDb.tagGroups.toCollection().first();
    await user.selectOptions(screen.getByRole("combobox", { name: "标签组" }), group?.id ?? "");
    await user.click(screen.getByRole("button", { name: "保存映射" }));

    await waitFor(async () => expect(await appDb.tagGroupLinks.count()).toBe(1));
    expect(screen.getAllByText("报销状态")).toHaveLength(2);
  });
});
