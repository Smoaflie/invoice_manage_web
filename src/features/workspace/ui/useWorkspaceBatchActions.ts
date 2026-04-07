import { useCallback } from "react";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { bulkUpdateInvoiceTags } from "../../invoices/application/bulkUpdateInvoiceTags";
import { buildWorkspaceExcelExport, triggerWorkspaceExcelDownload } from "../application/workspaceExcelExport";

type UseWorkspaceBatchActionsInput = {
  selectedIdSet: Set<string>;
  bulkTagsText: string;
  selectedDocuments: InvoiceDocument[];
  allFields: WorkspaceFieldDefinition[];
  onRefresh: () => void | Promise<void>;
  setWorkspaceMessage: (message: string) => void;
};

export function useWorkspaceBatchActions(input: UseWorkspaceBatchActionsInput) {
  const handleBulkTagUpdate = useCallback(
    async (mode: "add" | "remove") => {
      const invoiceDocumentIds = [...input.selectedIdSet];
      const tagsText = input.bulkTagsText.trim();
      if (invoiceDocumentIds.length === 0 || tagsText.length === 0) {
        return;
      }

      try {
        const result = await bulkUpdateInvoiceTags({ invoiceDocumentIds, tagsText, mode, now: () => new Date().toISOString() });
        if (result.updatedCount > 0) {
          await input.onRefresh();
        }
        input.setWorkspaceMessage(result.updatedCount > 0 ? `已${mode === "add" ? "添加" : "删除"} ${result.updatedCount} 条记录的标签。` : "没有记录发生标签变化。");
      } catch (error) {
        input.setWorkspaceMessage(error instanceof Error ? error.message : "批量更新标签失败。");
      }
    },
    [input],
  );

  const handleExportExcel = useCallback(async () => {
    if (input.selectedDocuments.length === 0) {
      return;
    }

    try {
      const file = await buildWorkspaceExcelExport({
        invoiceDocuments: input.selectedDocuments,
        fields: input.allFields,
      });
      triggerWorkspaceExcelDownload(file);
      input.setWorkspaceMessage(`已导出 ${input.selectedDocuments.length} 条记录为 Excel。`);
    } catch (error) {
      input.setWorkspaceMessage(error instanceof Error ? error.message : "导出 Excel 失败。");
    }
  }, [input]);

  return {
    handleBulkTagUpdate,
    handleExportExcel,
  };
}
