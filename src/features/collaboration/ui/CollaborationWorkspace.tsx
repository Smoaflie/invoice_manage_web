import { useEffect, useMemo, useState } from "react";
import { appDb } from "../../../shared/db/appDb";
import type { FilterGroup, FilterGroupRule } from "../../../shared/types/filterGroup";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { applyMatchTagToInvoices, selectDocumentsForFilterGroup } from "../application/collaborationInvoices";
import { buildExposureSummary, buildReceivingGateViewModel, buildReceivingImportPreview } from "../application/collaborationPanelViewModel";
import { buildExposureSnapshot, matchExposureSnapshot } from "../application/exposureSnapshots";
import { buildSubmissionDraft } from "../application/submissionDrafts";
import { applyAcceptedReceiptToLocalInvoices, buildImportedFinanceDocuments, buildSubmissionPrecheck, buildSubmissionReceipt } from "../application/submissionReceipts";
import type { ExposureMatchResult, ExposureSnapshot, SubmissionDraft, SubmissionPrecheckResult } from "../types/collaboration";
import { CollaborationEmployeeLane } from "./CollaborationEmployeeLane";
import { CollaborationFinanceLane } from "./CollaborationFinanceLane";
import { CollaborationOverview } from "./CollaborationOverview";
import { encodeSubmissionRecordsPayload, encodeSubmissionSummaryPayload } from "../application/sessionPayloads";

function parseJson<T>(value: string) {
  return JSON.parse(value) as T;
}

function compareFilterGroups(left: FilterGroup, right: FilterGroup) {
  const legacyLeftOrder = (left as FilterGroup & { sortOrder?: number }).sortOrder;
  const legacyRightOrder = (right as FilterGroup & { sortOrder?: number }).sortOrder;

  if (typeof legacyLeftOrder === "number" || typeof legacyRightOrder === "number") {
    return (legacyLeftOrder ?? Number.MAX_SAFE_INTEGER) - (legacyRightOrder ?? Number.MAX_SAFE_INTEGER);
  }

  return left.name.localeCompare(right.name, "zh-CN");
}

export function CollaborationWorkspace() {
  const [invoiceDocuments, setInvoiceDocuments] = useState<InvoiceDocument[]>([]);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [filterRules, setFilterRules] = useState<FilterGroupRule[]>([]);
  const [message, setMessage] = useState("正在加载协作工作区...");
  const [exposureGroupId, setExposureGroupId] = useState("");
  const [snapshotText, setSnapshotText] = useState("");
  const [generatedSnapshot, setGeneratedSnapshot] = useState<ExposureSnapshot | null>(null);
  const [importedSnapshotText, setImportedSnapshotText] = useState("");
  const [importedSnapshot, setImportedSnapshot] = useState<ExposureSnapshot | null>(null);
  const [matchResult, setMatchResult] = useState<ExposureMatchResult | null>(null);
  const [matchTag, setMatchTag] = useState("财务已登记");
  const [submissionGroupId, setSubmissionGroupId] = useState("");
  const [senderName, setSenderName] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [submissionTagsText, setSubmissionTagsText] = useState("");
  const [includeSourceFiles, setIncludeSourceFiles] = useState(false);
  const [successAckLocalTagEnabled, setSuccessAckLocalTagEnabled] = useState(true);
  const [successAckLocalTag, setSuccessAckLocalTag] = useState("已发送财务");
  const [draftText, setDraftText] = useState("");
  const [summaryPayloadText, setSummaryPayloadText] = useState("");
  const [recordsPayloadText, setRecordsPayloadText] = useState("");
  const [draftInputText, setDraftInputText] = useState("");
  const [loadedDraft, setLoadedDraft] = useState<SubmissionDraft | null>(null);
  const [financeTagsText, setFinanceTagsText] = useState("");
  const [financeBeneficiary, setFinanceBeneficiary] = useState("");
  const [receivedBy, setReceivedBy] = useState("Finance");
  const [precheck, setPrecheck] = useState<SubmissionPrecheckResult | null>(null);
  const [reviewDecisions, setReviewDecisions] = useState<Record<string, "pending" | "accept_item" | "reject_item">>({});
  const refreshWorkspace = async () => {
    const [documents, groups, rules] = await Promise.all([
      appDb.invoiceDocuments.orderBy("updatedAt").reverse().toArray(),
      appDb.filterGroups.toArray(),
      appDb.filterGroupRules.toArray(),
    ]);
    setInvoiceDocuments(documents);
    setFilterGroups(groups.sort(compareFilterGroups));
    setFilterRules(rules);
  };
  const matchedInvoiceIds = useMemo(() => new Set(matchResult?.matchedInvoiceIds ?? []), [matchResult]);
  const matchedInvoiceNumbers = matchResult?.matchedInvoiceNumbers ?? [];
  const unmatchedInvoiceNumbers = useMemo(
    () => invoiceDocuments.filter((document) => matchResult?.unmatchedInvoiceIds.includes(document.id)).map((document) => document.invoiceNumber),
    [invoiceDocuments, matchResult],
  );
  const pendingSubmissionDocuments = useMemo(
    () => selectDocumentsForFilterGroup(invoiceDocuments, filterRules, submissionGroupId).filter((document) => !matchedInvoiceIds.has(document.id)),
    [filterRules, invoiceDocuments, matchedInvoiceIds, submissionGroupId],
  );
  const exposureSummary = useMemo(() => buildExposureSummary(generatedSnapshot), [generatedSnapshot]);
  const receivingGate = useMemo(() => buildReceivingGateViewModel({ loadedDraft, precheck, reviewDecisions }), [loadedDraft, precheck, reviewDecisions]);
  const importPreview = useMemo(
    () => buildReceivingImportPreview({ loadedDraft, financeTagsText, financeBeneficiary, receivedBy }),
    [financeBeneficiary, financeTagsText, loadedDraft, receivedBy],
  );
  const overviewMetrics = useMemo(() => ({ invoiceCount: invoiceDocuments.length, matchedCount: matchResult?.matchedInvoiceIds.length ?? 0, activeDraftCount: loadedDraft?.invoiceIds.length ?? 0, reviewRequiredCount: precheck?.reviewRequiredItems.length ?? 0 }), [invoiceDocuments.length, loadedDraft, matchResult, precheck]);
  useEffect(() => {
    void refreshWorkspace()
      .then(() => setMessage("协作工作区已加载。"))
      .catch(() => setMessage("协作工作区加载失败。"));
  }, []);
  const handleGenerateSnapshot = () => {
    const documents = selectDocumentsForFilterGroup(invoiceDocuments, filterRules, exposureGroupId);
    const group = filterGroups.find((item) => item.id === exposureGroupId);
    const snapshot = buildExposureSnapshot({
      createdBy: "Finance",
      filterGroupId: exposureGroupId,
      filterGroupName: group?.name ?? "",
      labelSummary: group?.name ?? "",
      documents,
      now: () => new Date().toISOString(),
    });
    setSnapshotText(JSON.stringify(snapshot, null, 2));
    setGeneratedSnapshot(snapshot);
    setMessage(`已生成 ${snapshot.invoiceCount} 条发票号码快照。`);
  };
  const handleImportSnapshot = () => {
    try {
      const snapshot = parseJson<ExposureSnapshot>(importedSnapshotText);
      const result = matchExposureSnapshot(snapshot, invoiceDocuments);
      setImportedSnapshot(snapshot);
      setMatchResult(result);
      setMessage(`快照比对完成：命中 ${result.matchedInvoiceIds.length} 条，未命中 ${result.unmatchedInvoiceIds.length} 条。`);
    } catch {
      setMessage("暴露快照解析失败。");
    }
  };
  const handleApplyMatchTag = async () => {
    if (!matchResult) {
      return;
    }
    const updatedDocuments = applyMatchTagToInvoices({
      documents: invoiceDocuments,
      matchedInvoiceIds: matchResult.matchedInvoiceIds,
      tag: matchTag,
      now: () => new Date().toISOString(),
    });
    if (updatedDocuments.length === 0) {
      setMessage("没有需要更新的命中项标签。");
      return;
    }
    await appDb.invoiceDocuments.bulkPut(updatedDocuments);
    await refreshWorkspace();
    setMessage(`已为 ${updatedDocuments.length} 条命中发票写入标签。`);
  };
  const handleGenerateDraft = () => {
    const draft = buildSubmissionDraft({
      senderName,
      beneficiaryName,
      sourceSnapshotId: importedSnapshot?.snapshotId ?? "",
      filterGroupId: submissionGroupId,
      documents: pendingSubmissionDocuments,
      includeSourceFiles,
      submissionTagsText,
      note: "",
      successAckLocalTag,
      successAckLocalTagEnabled,
      now: () => new Date().toISOString(),
    });
    setDraftText(JSON.stringify(draft, null, 2));
    setSummaryPayloadText(encodeSubmissionSummaryPayload({ kind: "submission-summary", submissionId: draft.submissionId, invoiceCount: draft.invoiceIds.length, invoiceNumbers: draft.invoiceNumbers, includeSourceFiles: draft.includeSourceFiles, containsEditedInvoices: draft.items.some((item) => item.edited), submissionTags: draft.submissionTags, senderName: draft.senderName, beneficiaryName: draft.beneficiaryName }));
    setRecordsPayloadText(encodeSubmissionRecordsPayload({ kind: "submission-records", submissionId: draft.submissionId, invoiceNumbers: draft.invoiceNumbers, records: draft.items }));
    setMessage(`已生成 ${draft.invoiceIds.length} 条发票的提交批次。`);
  };
  const handleLoadDraft = () => {
    try {
      const draft = parseJson<SubmissionDraft>(draftInputText);
      const financeExistingDocuments = invoiceDocuments.filter((document) => !draft.invoiceIds.includes(document.id));
      const nextPrecheck = buildSubmissionPrecheck({ draft, existingDocuments: financeExistingDocuments, requireSourceFiles: false });
      const nextDecisions = Object.fromEntries(nextPrecheck.reviewRequiredItems.map((item) => [item.invoiceId, "pending"])) as Record<string, "pending" | "accept_item" | "reject_item">;
      setLoadedDraft(draft);
      setFinanceBeneficiary(draft.beneficiaryName);
      setFinanceTagsText("");
      setPrecheck(nextPrecheck);
      setReviewDecisions(nextDecisions);
      setMessage(`已加载批次：阻塞 ${nextPrecheck.blockedItems.length} 条，待确认 ${nextPrecheck.reviewRequiredItems.length} 条。`);
    } catch {
      setMessage("提交批次解析失败。");
    }
  };
  const handleAcceptBatch = async () => {
    if (!loadedDraft || !precheck || receivingGate.acceptDisabled) {
      return;
    }
    const receipt = buildSubmissionReceipt({
      draft: loadedDraft,
      accepted: true,
      receiverName: receivedBy,
      assignedTagsText: financeTagsText,
      assignedBeneficiary: financeBeneficiary,
      receivedBy,
      duplicateInvoiceNumbers: precheck.duplicateInvoiceNumbers,
      conflictItems: [],
      now: () => new Date().toISOString(),
    });
    const importedDocuments = buildImportedFinanceDocuments({ draft: loadedDraft, receipt });
    if (importedDocuments.length > 0) {
      await appDb.invoiceDocuments.bulkAdd(importedDocuments);
    }
    await refreshWorkspace();
    setLoadedDraft(null);
    setDraftInputText("");
    setPrecheck(null);
    setReviewDecisions({});
    setMessage(`财务端已整批接收 ${receipt.acceptedInvoiceIds.length} 条发票。`);
  };
  const handleRejectBatch = async () => {
    if (!loadedDraft) {
      return;
    }
    const localUpdates = applyAcceptedReceiptToLocalInvoices({
      documents: invoiceDocuments,
      draft: loadedDraft,
      receipt: buildSubmissionReceipt({
        draft: loadedDraft,
        accepted: false,
        receiverName: receivedBy,
        assignedTagsText: financeTagsText,
        assignedBeneficiary: financeBeneficiary,
        receivedBy,
        duplicateInvoiceNumbers: precheck?.duplicateInvoiceNumbers ?? [],
        conflictItems: [],
        now: () => new Date().toISOString(),
      }),
      now: () => new Date().toISOString(),
    });
    if (localUpdates.length > 0) {
      await appDb.invoiceDocuments.bulkPut(localUpdates);
    }
    setLoadedDraft(null);
    setDraftInputText("");
    setPrecheck(null);
    setReviewDecisions({});
    setMessage("当前批次已整批打回。");
  };

  return (
    <section className="workspace-page collaboration-workspace" data-testid="collaboration-workspace">
      <CollaborationOverview message={message} {...overviewMetrics} />
      <div className="collaboration-workspace__board">
        <CollaborationFinanceLane
          exposurePanel={{
            filterGroups,
            selectedGroupId: exposureGroupId,
            snapshotText,
            summary: exposureSummary,
            onSelectedGroupChange: setExposureGroupId,
            onGenerate: handleGenerateSnapshot,
          }}
          receivingPanel={{
            draftInputText,
            loadedDraft,
            financeTagsText,
            beneficiary: financeBeneficiary,
            receivedBy,
            precheck,
            gateReasons: receivingGate.gateReasons,
            acceptanceStatusText: receivingGate.acceptanceStatusText,
            importPreview,
            reviewDecisions,
            onDraftInputTextChange: setDraftInputText,
            onLoadDraft: handleLoadDraft,
            onFinanceTagsTextChange: setFinanceTagsText,
            onFillFinanceTags: () => setFinanceTagsText(loadedDraft?.submissionTags.join(" ") ?? ""),
            onBeneficiaryChange: setFinanceBeneficiary,
            onReceivedByChange: setReceivedBy,
            onReviewDecisionChange: (invoiceId, value) => setReviewDecisions((current) => ({ ...current, [invoiceId]: value })),
            onAcceptBatch: () => void handleAcceptBatch(),
            onRejectBatch: () => void handleRejectBatch(),
            acceptDisabled: receivingGate.acceptDisabled,
          }}
        />
        <CollaborationEmployeeLane
          reconciliationPanel={{
            importedSnapshotText,
            matchTag,
            matchedCount: matchResult?.matchedInvoiceIds.length ?? 0,
            unmatchedCount: matchResult?.unmatchedInvoiceIds.length ?? 0,
            matchedInvoiceNumbers,
            unmatchedInvoiceNumbers,
            onImportedSnapshotTextChange: setImportedSnapshotText,
            onMatchTagChange: setMatchTag,
            onImport: handleImportSnapshot,
            onApplyTag: () => void handleApplyMatchTag(),
          }}
          submissionPanel={{
            filterGroups,
            selectedGroupId: submissionGroupId,
            senderName,
            beneficiaryName,
            submissionTagsText,
            successAckLocalTag,
            successAckLocalTagEnabled,
            includeSourceFiles,
            draftText,
            summaryPayloadText,
            recordsPayloadText,
            matchedInvoiceNumbers,
            pendingSubmissionInvoiceNumbers: pendingSubmissionDocuments.map((document) => document.invoiceNumber),
            onSelectedGroupChange: setSubmissionGroupId,
            onSenderNameChange: setSenderName,
            onBeneficiaryNameChange: setBeneficiaryName,
            onSubmissionTagsTextChange: setSubmissionTagsText,
            onSuccessAckLocalTagChange: setSuccessAckLocalTag,
            onSuccessAckLocalTagEnabledChange: setSuccessAckLocalTagEnabled,
            onIncludeSourceFilesChange: setIncludeSourceFiles,
            onGenerate: handleGenerateDraft,
          }}
        />
      </div>
    </section>
  );
}
