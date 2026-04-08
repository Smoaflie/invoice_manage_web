import { afterAll, afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { appDb } from "../../../shared/db/appDb";
import { createEmptyConditionGroup } from "../../../shared/types/filterGroup";
import { CollaborationWorkspace } from "./CollaborationWorkspace";

describe("CollaborationWorkspace", () => {
  afterEach(async () => {
    cleanup();
    await appDb.invoiceDocuments.clear();
    await appDb.filterGroupRules.clear();
    await appDb.filterGroups.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  it("renders the collaboration overview workspace shell", async () => {
    render(<CollaborationWorkspace />);

    await waitFor(() => expect(screen.getByText("协作工作区已加载。")).toBeInTheDocument());

    expect(screen.getByTestId("collaboration-workspace")).toBeInTheDocument();
    const overview = screen.getByTestId("collaboration-overview");
    expect(overview).toBeInTheDocument();
    expect(screen.getByTestId("collaboration-lane-finance")).toBeInTheDocument();
    expect(screen.getByTestId("collaboration-lane-employee")).toBeInTheDocument();
    expect(screen.queryByText("Finance Lane")).not.toBeInTheDocument();
    expect(screen.queryByText("Employee Lane")).not.toBeInTheDocument();
    expect(within(overview).getByText("01")).toBeInTheDocument();
    expect(within(overview).getByText("02")).toBeInTheDocument();
    expect(within(overview).getByText("03")).toBeInTheDocument();
    expect(within(overview).getByText("04")).toBeInTheDocument();
    expect(within(overview).getByText("暴露快照")).toBeInTheDocument();
    expect(within(overview).getByText("本地对账")).toBeInTheDocument();
    expect(within(overview).getByText("生成提交批次")).toBeInTheDocument();
    expect(within(overview).getByText("财务接收")).toBeInTheDocument();
  });

  it("supports snapshot matching, draft generation, and finance tag filling", async () => {
    await appDb.invoiceDocuments.bulkAdd([
      {
        id: "doc-1",
        contentHash: "hash-1",
        fileName: "invoice-1.pdf",
        fileSize: 1,
        lastModified: 1,
        handleRef: "",
        bindingStatus: "unreadable",
        bindingErrorType: "handle_missing",
        ocrVendor: null,
        ocrParsedAt: null,
        parseStatus: "parsed",
        conflictStatus: "none",
        conflictMessage: "",
        invoiceNumber: "INV-001",
        invoiceCode: "CODE-1",
        invoiceDate: "2026-04-01",
        totalAmount: 100,
        taxAmount: 10,
        amountWithoutTax: 90,
        buyerName: "Buyer Co",
        sellerName: "Seller Co",
        items: [],
        tags: [],
        remark: "",
        annotation: "",
        uploader: "",
        owner: "",
        collaborationStatus: "local_only",
        reviewStatus: "not_required",
        submittedBy: "",
        receivedBy: "",
        beneficiary: "",
        lastSubmissionId: null,
        sourceType: "ocr",
        edited: false,
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
      {
        id: "doc-2",
        contentHash: "hash-2",
        fileName: "invoice-2.pdf",
        fileSize: 1,
        lastModified: 1,
        handleRef: "",
        bindingStatus: "unreadable",
        bindingErrorType: "handle_missing",
        ocrVendor: null,
        ocrParsedAt: null,
        parseStatus: "parsed",
        conflictStatus: "none",
        conflictMessage: "",
        invoiceNumber: "INV-002",
        invoiceCode: "CODE-2",
        invoiceDate: "2026-04-02",
        totalAmount: 200,
        taxAmount: 20,
        amountWithoutTax: 180,
        buyerName: "Buyer Co",
        sellerName: "Seller Co",
        items: [],
        tags: [],
        remark: "",
        annotation: "餐补",
        uploader: "",
        owner: "",
        collaborationStatus: "local_only",
        reviewStatus: "not_required",
        submittedBy: "",
        receivedBy: "",
        beneficiary: "",
        lastSubmissionId: null,
        sourceType: "ocr",
        edited: false,
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
    ]);
    await appDb.filterGroups.bulkAdd([
      { id: "group-1", name: "Buyer", root: createEmptyConditionGroup("group-1-root"), createdAt: "2026-04-01T00:00:00.000Z", updatedAt: "2026-04-01T00:00:00.000Z" },
      { id: "group-2", name: "To Submit", root: createEmptyConditionGroup("group-2-root"), createdAt: "2026-04-01T00:00:00.000Z", updatedAt: "2026-04-01T00:00:00.000Z" },
    ]);
    await appDb.filterGroupRules.bulkAdd([
      { id: "rule-1", groupId: "group-1", label: "INV-001 only", field: "invoiceNumber", pattern: "INV-001" },
      { id: "rule-2", groupId: "group-2", label: "All INV", field: "invoiceNumber", pattern: "INV-00" },
    ]);

    render(<CollaborationWorkspace />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getAllByRole("option", { name: "Buyer" }).length).toBeGreaterThan(0));

    await user.selectOptions(screen.getByLabelText("暴露筛选组"), "group-1");
    await user.click(screen.getByRole("button", { name: "生成暴露快照" }));

    const snapshotOutput = screen.getByLabelText("暴露快照内容") as HTMLTextAreaElement;
    expect(snapshotOutput.value).toContain("INV-001");
    expect(screen.getByText("快照摘要")).toBeInTheDocument();
    expect(screen.getByText("筛选组 Buyer")).toBeInTheDocument();
    expect(screen.getByText("票据 1 张")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("导入暴露快照"), { target: { value: snapshotOutput.value } });
    await user.click(screen.getByRole("button", { name: "导入并比对快照" }));

    expect(screen.getByText("命中票据")).toBeInTheDocument();
    expect(screen.getByText("INV-001")).toBeInTheDocument();
    expect(screen.getByText("未命中票据")).toBeInTheDocument();
    expect(screen.getByText("INV-002")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "为命中项打标签" }));

    await waitFor(async () => {
      const updated = await appDb.invoiceDocuments.get("doc-1");
      expect(updated?.tags).toContain("财务已登记");
      expect(updated?.collaborationStatus).toBe("matched_in_snapshot");
    });

    await user.selectOptions(screen.getByLabelText("提交筛选组"), "group-2");
    await user.clear(screen.getByLabelText("发送人"));
    await user.type(screen.getByLabelText("发送人"), "Alice");
    await user.clear(screen.getByLabelText("受益人"));
    await user.type(screen.getByLabelText("受益人"), "Alice");
    await user.clear(screen.getByLabelText("提交标签"));
    await user.type(screen.getByLabelText("提交标签"), "待报销");
    await user.click(screen.getByRole("button", { name: "生成提交批次" }));

    expect(screen.getByText("本次将提交")).toBeInTheDocument();
    expect(screen.getByText("命中快照后不再提交")).toBeInTheDocument();
    expect(screen.getByText("成功回写规则")).toBeInTheDocument();

    const draftOutput = screen.getByLabelText("提交批次内容") as HTMLTextAreaElement;
    expect(draftOutput.value).toContain("INV-002");
    expect(draftOutput.value).not.toContain("\"invoiceNumber\":\"INV-001\"");

    fireEvent.change(screen.getByLabelText("接收提交批次"), { target: { value: draftOutput.value } });
    await user.click(screen.getByRole("button", { name: "加载提交草稿" }));

    await waitFor(() => expect((screen.getByLabelText("员工端提交的标签") as HTMLInputElement).value).toBe("待报销"));
    expect(screen.getByText("批次摘要")).toBeInTheDocument();
    expect(screen.getByText("接收门控")).toBeInTheDocument();
    expect(screen.getByText("入库预览")).toBeInTheDocument();
    expect(screen.getByText("接收人 Finance")).toBeInTheDocument();
    expect(screen.getByText("受益人 Alice")).toBeInTheDocument();
    expect(screen.getByText("整批接收当前可用。")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "填入员工标签" }));
    expect(screen.getByText("标签 待报销")).toBeInTheDocument();
    expect((screen.getByLabelText("加入数据库时要打上的标签") as HTMLInputElement).value).toBe("待报销");
  });

  it("explains why whole-batch acceptance is blocked when review items are unresolved", async () => {
    await appDb.invoiceDocuments.bulkAdd([
      {
        id: "doc-manual",
        contentHash: "hash-manual",
        fileName: "manual.pdf",
        fileSize: 1,
        lastModified: 1,
        handleRef: "",
        bindingStatus: "unreadable",
        bindingErrorType: "handle_missing",
        ocrVendor: null,
        ocrParsedAt: null,
        parseStatus: "parsed",
        conflictStatus: "none",
        conflictMessage: "",
        invoiceNumber: "INV-MANUAL-1",
        invoiceCode: "CODE-MANUAL",
        invoiceDate: "2026-04-05",
        totalAmount: 50,
        taxAmount: 5,
        amountWithoutTax: 45,
        buyerName: "Manual Buyer",
        sellerName: "Manual Seller",
        items: [],
        tags: [],
        remark: "",
        annotation: "手工票",
        uploader: "",
        owner: "",
        collaborationStatus: "local_only",
        reviewStatus: "not_required",
        submittedBy: "",
        receivedBy: "",
        beneficiary: "",
        lastSubmissionId: null,
        sourceType: "manual",
        edited: true,
        createdAt: "2026-04-05T00:00:00.000Z",
        updatedAt: "2026-04-05T00:00:00.000Z",
      },
    ]);
    await appDb.filterGroups.add({
      id: "group-manual",
      name: "Manual Group",
      root: createEmptyConditionGroup("group-manual-root"),
      createdAt: "2026-04-05T00:00:00.000Z",
      updatedAt: "2026-04-05T00:00:00.000Z",
    });
    await appDb.filterGroupRules.add({ id: "rule-manual", groupId: "group-manual", label: "manual", field: "invoiceNumber", pattern: "INV-MANUAL" });

    render(<CollaborationWorkspace />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getAllByRole("option", { name: "Manual Group" }).length).toBeGreaterThan(0));

    await user.selectOptions(screen.getByLabelText("提交筛选组"), "group-manual");
    await user.clear(screen.getByLabelText("发送人"));
    await user.type(screen.getByLabelText("发送人"), "Alice");
    await user.clear(screen.getByLabelText("受益人"));
    await user.type(screen.getByLabelText("受益人"), "Alice");
    await user.click(screen.getByRole("button", { name: "生成提交批次" }));

    const draftOutput = screen.getByLabelText("提交批次内容") as HTMLTextAreaElement;
    fireEvent.change(screen.getByLabelText("接收提交批次"), { target: { value: draftOutput.value } });
    await user.click(screen.getByRole("button", { name: "加载提交草稿" }));

    await waitFor(() => expect(screen.getByText("整批接收当前不可用。")).toBeInTheDocument());
    expect(screen.getByText("待确认项 1 条仍未全部决策。")).toBeInTheDocument();
  });
});
