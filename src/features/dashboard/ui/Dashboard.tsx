import { useEffect, useState } from "react";
import { appDb } from "../../../shared/db/appDb";
import { getStoredHandle } from "../../../shared/fs/fileHandles";
import type { InvoiceAuditLog } from "../../../shared/types/invoiceAuditLog";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { deleteInvoiceDocuments } from "../../documents/application/deleteInvoiceDocuments";
import { rehydrateBindings } from "../../files/application/rehydrateBindings";
import { hasOcrExtensionBridge } from "../../ocr/bridge/extensionBridge";
import { parseInvoice } from "../../ocr/application/parseInvoice";
import { requestInvoiceOcr } from "../../ocr/infrastructure/ocrClients";
import { bulkReparseInvoiceDocuments } from "./dashboardMutations";
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
  const [bridgeConnected, setBridgeConnected] = useState<boolean | null>(null);
  const [detailInvoiceDocumentId, setDetailInvoiceDocumentId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<InvoiceAuditLog[]>([]);
  const [editSession, setEditSession] = useState<EditSession | null>(null);
  const setWorkspaceSidebarStatus = useDashboardSidebarStatus({
    activeView,
    dashboardMessage,
    invoiceDocumentCount: invoiceDocuments.length,
    bridgeConnected,
    onSidebarStatusChange,
  });

  const refreshDashboardRows = async () => {
    setInvoiceDocuments(await loadDashboardRows());
  };

  const selectedTargetId = detailInvoiceDocumentId ?? editSession?.invoiceDocumentId ?? null;
  const selectedInvoiceDocument = selectedTargetId ? invoiceDocuments.find((row) => row.id === selectedTargetId) ?? null : null;

  const openDetailDrawer = async (invoiceDocumentId: string) => {
    const logs = await appDb.invoiceAuditLogs.where("invoiceDocumentId").equals(invoiceDocumentId).sortBy("changedAt");
    setAuditLogs(logs.reverse());
    setDetailInvoiceDocumentId(invoiceDocumentId);
  };

  const handleOpenPdf = async (invoiceDocumentId: string) => {
    try {
      await openStoredInvoicePdf(invoiceDocumentId);
    } catch (error) {
      setDashboardMessage(error instanceof Error ? error.message : "打开 PDF 失败。");
    }
  };

  const handleParseInvoice = async (invoiceDocumentId: string) => {
    setParsingInvoiceDocumentId(invoiceDocumentId);
    setDashboardMessage("正在识别发票...");

    try {
      if (!(await hasOcrExtensionBridge())) {
        throw new Error("OCR 扩展未连接。");
      }

      const ocrConfig = toOcrClientConfig(await loadDashboardOcrSettings());
      const parsedInvoice = await parseInvoice(invoiceDocumentId, {
        vendor: ocrConfig.vendor,
        loadFile: loadFileFromStoredHandle,
        requestOcr: (file) => requestInvoiceOcr(file, ocrConfig),
        now: () => new Date().toISOString(),
      });

      await refreshDashboardRows();
      setDashboardMessage(`已识别发票 ${parsedInvoice.invoiceNumber}。`);
    } catch (error) {
      setDashboardMessage(error instanceof Error ? error.message : "发票识别失败。");
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
    const result = await bulkReparseInvoiceDocuments(invoiceDocuments, invoiceDocumentIds, handleParseInvoice);
    setDashboardMessage(`批量识别完成：成功 ${result.parsedIds.length}，跳过 ${result.skippedIds.length}，失败 ${result.failedIds.length}。`);
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

  useEffect(() => {
    let active = true;

    void hasOcrExtensionBridge()
      .then((connected) => {
        if (active) {
          setBridgeConnected(connected);
        }
      })
      .catch(() => {
        if (active) {
          setBridgeConnected(false);
        }
      });

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
        message={dashboardMessage}
        settingsForm={<OcrSettingsForm />}
        bridgeConnected={bridgeConnected}
        invoiceDocuments={invoiceDocuments}
      />
    );
  }

  if (activeView === "collaboration") {
    return <CollaborationWorkspace />;
  }

  return null;
}
