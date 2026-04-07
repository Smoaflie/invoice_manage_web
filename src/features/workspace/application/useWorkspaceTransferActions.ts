import { useCallback } from "react";
import { persistFileHandle } from "../../../shared/fs/fileHandles";
import { importFiles } from "../../files/application/importFiles";
import { exportData } from "../../transfer/application/exportData";
import { importData } from "../../transfer/application/importData";
import { readFileAsText, triggerJsonDownload } from "../../transfer/application/browserTransfer";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

type UseWorkspaceTransferActionsInput = {
  onRefresh: () => void | Promise<void>;
  setWorkspaceMessage: (value: string) => void;
  setSelectedIdSet: React.Dispatch<React.SetStateAction<Set<string>>>;
  setImportingFiles: (value: boolean) => void;
};

export function useWorkspaceTransferActions(input: UseWorkspaceTransferActionsInput) {
  const handleImportPickedFiles = useCallback(async (pickedFiles: Array<{ file: File; handle: FileSystemFileHandle | null }>) => {
    if (pickedFiles.length === 0) {
      input.setWorkspaceMessage("未检测到可导入的 PDF 文件。");
      return;
    }

    input.setImportingFiles(true);
    try {
      const result = await importFiles(pickedFiles, { persistHandle: persistFileHandle, now: () => new Date().toISOString() });
      const importedIds = [...result.created, ...result.rebound].map((item: InvoiceDocument) => item.id);
      if (importedIds.length > 0) {
        input.setSelectedIdSet((current) => new Set([...current, ...importedIds]));
      }
      await input.onRefresh();
      input.setWorkspaceMessage(`已新增 ${result.created.length} 条记录，重绑 ${result.rebound.length} 条记录。`);
    } catch (error) {
      input.setWorkspaceMessage(error instanceof Error ? error.message : "导入 PDF 失败。");
    } finally {
      input.setImportingFiles(false);
    }
  }, [input]);

  const handleImportDataFile = useCallback(async (file: File) => {
    try {
      const parsedPayload = JSON.parse(await readFileAsText(file)) as unknown;
      const result = await importData(parsedPayload);
      await input.onRefresh();
      input.setWorkspaceMessage(`已覆盖本地数据并导入 ${result.importedInvoiceDocuments} 条发票记录。`);
    } catch (error) {
      input.setWorkspaceMessage(error instanceof Error ? error.message : "导入数据失败。");
    }
  }, [input]);

  const handleExportData = useCallback(async () => {
    try {
      triggerJsonDownload(await exportData());
      input.setWorkspaceMessage("JSON 导出文件已生成，可直接下载。");
    } catch (error) {
      input.setWorkspaceMessage(error instanceof Error ? error.message : "导出数据失败。");
    }
  }, [input]);

  return { handleImportPickedFiles, handleImportDataFile, handleExportData };
}
