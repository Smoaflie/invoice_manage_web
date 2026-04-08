import { useEffect, useState } from "react";
import { appDb } from "../../../shared/db/appDb";
import { getStoredHandle } from "../../../shared/fs/fileHandles";
import type { InvoiceAuditLog } from "../../../shared/types/invoiceAuditLog";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { batchParseInvoices } from "../../documents/application/batchParseInvoices";
import { deleteInvoiceDocuments } from "../../documents/application/deleteInvoiceDocuments";
import { rehydrateBindings } from "../../files/application/rehydrateBindings";
import { parseInvoice } from "../../ocr/application/parseInvoice";
import { requestInvoiceOcr } from "../../ocr/infrastructure/ocrClients";
import { InvoiceDetailsDrawer } from "../../invoices/ui/InvoiceDetailsDrawer";
import { InvoiceEditDialog, type InvoiceEditValues } from "../../invoices/ui/InvoiceEditDialog";
import { OcrSettingsForm } from "../../settings/ui/OcrSettingsForm";
import { InvoiceWorkspace } from "../../workspace/ui/InvoiceWorkspace";
import { useDashboardSidebarStatus } from "./useDashboardSidebarStatus";
import {
  loadDashboardOcrSettings,
  loadDashboardRows,
  loadFileFromStoredHandle,
  openStoredInvoicePdf,
  toOcrClientConfig,
} from "./dashboardDocumentActions";
import { saveDashboardInvoiceEdits } from "./dashboardInvoiceEdit";
import { SettingsWorkspace } from "./SettingsWorkspace";
import { CollaborationWorkspace } from "../../collaboration/ui/CollaborationWorkspace";
import type { DashboardSidebarStatus } from "./dashboardSidebarStatus";

export type DashboardView = "records" | "dashboard" | "collaboration" | "settings";

type EditSession = {
  invoiceDocumentId: string;
  mode: "manual-create" | "manual-edit";
};

type DashboardProps = {
  activeView?: DashboardView;
  onSelectView?: (view: Exclude<DashboardView, "settings">) => void;
  onSidebarStatusChange?: (status: DashboardSidebarStatus) => void;
};

export function Dashboard({ activeView = "records", onSelectView, onSidebarStatusChange }: DashboardProps) {
  const [invoiceDocuments, setInvoiceDocuments] = useState<InvoiceDocument[]>([]);
  const [dashboardMessage, setDashboardMessage] = useState("正在加载本地工作台数据...");
  const [parsingInvoiceDocumentId, setParsingInvoiceDocumentId] = useState<string | null>(null);
  const [detailInvoiceDocumentId, setDetailInvoiceDocumentId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<InvoiceAuditLog[]>([]);
  const [editSession, setEditSession] = useState<EditSession | null>(null);
  const setWorkspaceSidebarStatus = useDashboardSidebarStatus({
    activeView,
    dashboardMessage,
    invoiceDocumentCount: invoiceDocuments.length,
    onSidebarStatusChange,
  });

  const refreshDashboardRows = async () => {
    setInvoiceDocuments(await loadDashboardRows());
  };

  const selectedTargetId = detailInvoiceDocumentId ?? editSession?.invoiceDocumentId ?? null;
  const selectedInvoiceDocument = selectedTargetId ? invoiceDocuments.find((row) => row.id === selectedTargetId) ?? null : null;

  const refreshAuditLogs = async (invoiceDocumentId: string) => {
    const logs = await appDb.invoiceAuditLogs.where("invoiceDocumentId").equals(invoiceDocumentId).sortBy("changedAt");
    setAuditLogs(logs.reverse());
  };

  const openDetailDrawer = async (invoiceDocumentId: string) => {
    await refreshAuditLogs(invoiceDocumentId);
    setDetailInvoiceDocumentId(invoiceDocumentId);
  };

  const handleOpenPdf = async (invoiceDocumentId: string) => {
    try {
      await openStoredInvoicePdf(invoiceDocumentId);
    } catch (error) {
      setDashboardMessage(error instanceof Error ? error.message : "打开 PDF 失败。");
    }
  };

  const handleParseInvoice = async (
    invoiceDocumentId: string,
    statusMessages: {
      start?: string | null;
      success?: (invoiceNumber: string) => string | null;
      failure?: (message: string) => string | null;
    } = {
      start: "正在识别发票...",
      success: (invoiceNumber) => `已识别发票 ${invoiceNumber}。`,
      failure: (message) => message,
    },
  ) => {
    setParsingInvoiceDocumentId(invoiceDocumentId);
    if (statusMessages.start) {
      setDashboardMessage(statusMessages.start);
    }

    try {
      const ocrConfig = toOcrClientConfig(await loadDashboardOcrSettings());
      const parsedInvoice = await parseInvoice(invoiceDocumentId, {
        vendor: ocrConfig.vendor,
        loadFile: loadFileFromStoredHandle,
        requestOcr: (file) => requestInvoiceOcr(file, ocrConfig),
        now: () => new Date().toISOString(),
      });

      await refreshDashboardRows();
      if (detailInvoiceDocumentId === invoiceDocumentId) {
        await refreshAuditLogs(invoiceDocumentId);
      }
      const successMessage = statusMessages.success?.(parsedInvoice.invoiceNumber);
      if (successMessage) {
        setDashboardMessage(successMessage);
      }
      return parsedInvoice;
    } catch (error) {
      const message = error instanceof Error ? error.message : "发票识别失败。";
      const failureMessage = statusMessages.failure?.(message);
      if (failureMessage) {
        setDashboardMessage(failureMessage);
      }
      throw (error instanceof Error ? error : new Error(message));
    } finally {
      setParsingInvoiceDocumentId(null);
    }
  };

  const handleDeleteDocuments = async (invoiceDocumentIds: string[]) => {
    if (invoiceDocumentIds.length === 0) {
      return;
    }

    try {
      await deleteInvoiceDocuments(invoiceDocumentIds);
      await refreshDashboardRows();
      setDetailInvoiceDocumentId((current) => (current && invoiceDocumentIds.includes(current) ? null : current));
      setEditSession((current) => (current && invoiceDocumentIds.includes(current.invoiceDocumentId) ? null : current));
      setAuditLogs((current) => current.filter((log) => !invoiceDocumentIds.includes(log.invoiceDocumentId)));
      setDashboardMessage(`已删除 ${invoiceDocumentIds.length} 条记录。`);
    } catch (error) {
      setDashboardMessage(error instanceof Error ? error.message : "删除记录失败。");
    }
  };

  const handleBulkReparseInvoices = async (invoiceDocumentIds: string[]) => {
    const targetRows = invoiceDocuments.filter((row) => invoiceDocumentIds.includes(row.id));
    setDashboardMessage(`开始批量 OCR：共 ${targetRows.length} 条。`);
    const result = await batchParseInvoices(
      targetRows,
      (invoiceDocumentId) =>
        handleParseInvoice(invoiceDocumentId, {
          start: null,
          success: () => null,
          failure: () => null,
        }),
      (progress) => {
        setDashboardMessage(
          `批量 OCR 进行中：共 ${progress.totalCount} 条，已处理 ${progress.completedCount} 条，成功 ${progress.parsedCount}，失败 ${progress.failedCount}，跳过 ${progress.skippedCount}。`,
        );
      },
    );
    setDashboardMessage(`批量 OCR 完成：共 ${targetRows.length} 条，成功 ${result.parsedIds.length}，失败 ${result.failedIds.length}，跳过 ${result.skippedIds.length}。`);
  };

  const handleSaveEdits = async (values: InvoiceEditValues) => {
    if (!editSession) {
      return;
    }

    try {
      const savedDocument = await saveDashboardInvoiceEdits({
        invoiceDocumentId: editSession.invoiceDocumentId,
        mode: editSession.mode,
        invoiceDocuments,
        values,
        now: () => new Date().toISOString(),
      });

      await refreshDashboardRows();
      setEditSession(null);
      if (activeView === "records") {
        await openDetailDrawer(savedDocument.id);
      }
      setDashboardMessage(editSession.mode === "manual-create" ? "已保存手动录入的发票信息。" : "已保存发票修改。");
    } catch (error) {
      setDashboardMessage(error instanceof Error ? error.message : "保存发票修改失败。");
    }
  };

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        await refreshDashboardRows();
        if (!active) {
          return;
        }

        await rehydrateBindings({
          loadHandle: async (handleRef) => {
            const handle = await getStoredHandle(handleRef);

            return handle?.kind === "file" ? (handle as FileSystemFileHandle) : undefined;
          },
          now: () => new Date().toISOString(),
        });

        if (!active) {
          return;
        }

        await refreshDashboardRows();
        setDashboardMessage("本地工作台数据已加载。");
      } catch {
        if (active) {
          setDashboardMessage("工作台数据加载失败。");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (activeView === "records" || activeView === "dashboard") {
    return (
      <>
        <InvoiceWorkspace
          view={activeView}
          invoiceDocuments={invoiceDocuments}
          message={dashboardMessage}
          onSidebarStatusChange={setWorkspaceSidebarStatus}
          onSelectView={onSelectView}
          onOpenDetails={(invoiceDocumentId) => void openDetailDrawer(invoiceDocumentId)}
          onEdit={(invoiceDocumentId) => setEditSession({ invoiceDocumentId, mode: "manual-edit" })}
          onOpenPdf={handleOpenPdf}
          onDelete={handleDeleteDocuments}
          onReparseSingle={handleParseInvoice}
          onBulkReparse={handleBulkReparseInvoices}
          onRefresh={refreshDashboardRows}
        />
        <InvoiceDetailsDrawer
          invoiceDocument={selectedInvoiceDocument}
          auditLogs={auditLogs}
          open={detailInvoiceDocumentId !== null}
          onClose={() => setDetailInvoiceDocumentId(null)}
          onEdit={() => {
            if (detailInvoiceDocumentId) {
              setEditSession({ invoiceDocumentId: detailInvoiceDocumentId, mode: "manual-edit" });
              setDetailInvoiceDocumentId(null);
            }
          }}
          onOpenPdf={() => (detailInvoiceDocumentId ? handleOpenPdf(detailInvoiceDocumentId) : Promise.resolve())}
        />
        <InvoiceEditDialog
          invoiceDocument={selectedInvoiceDocument}
          open={editSession !== null}
          mode={editSession?.mode ?? "manual-edit"}
          onClose={() => setEditSession(null)}
          onSave={handleSaveEdits}
          onReparse={selectedInvoiceDocument ? () => handleParseInvoice(selectedInvoiceDocument.id) : undefined}
          reparseBusy={selectedInvoiceDocument?.id === parsingInvoiceDocumentId}
        />
      </>
    );
  }

  if (activeView === "settings") {
    return (
      <SettingsWorkspace
        settingsForm={<OcrSettingsForm />}
        invoiceDocuments={invoiceDocuments}
      />
    );
  }

  if (activeView === "collaboration") {
    return <CollaborationWorkspace />;
  }

  return null;
}
