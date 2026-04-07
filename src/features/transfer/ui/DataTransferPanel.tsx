import { useRef, useState, type ChangeEvent } from "react";
import { readFileAsText, triggerJsonDownload } from "../application/browserTransfer";
import { exportData } from "../application/exportData";
import { importData } from "../application/importData";

type DataTransferPanelProps = {
  onImportComplete?: () => void | Promise<void>;
};

export function DataTransferPanel({ onImportComplete }: DataTransferPanelProps) {
  const [message, setMessage] = useState("可通过 JSON 导出或导入本地数据。");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = async () => {
    setBusy(true);

    try {
      const payload = await exportData();
      triggerJsonDownload(payload);
      setMessage("JSON 导出文件已生成，可直接下载。");
    } catch {
      setMessage("导出失败。");
    } finally {
      setBusy(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setBusy(true);

    try {
      const parsedPayload = JSON.parse(await readFileAsText(file)) as unknown;
      const result = await importData(parsedPayload);
      await onImportComplete?.();
      setMessage(`已覆盖本地数据并导入 ${result.importedInvoiceDocuments} 条发票记录。`);
    } catch {
      setMessage("导入失败。");
    } finally {
      event.target.value = "";
      setBusy(false);
    }
  };

  return (
    <section className="utility-panel">
      <p className="utility-panel__label">传输</p>
      <p className="utility-panel__copy">通过 JSON 快照在不同浏览器间迁移台账记录，文件句柄不会随导出一起转移。</p>
      <div className="utility-panel__actions">
        <button type="button" onClick={handleExport} disabled={busy}>
          {busy ? "导出中..." : "导出 JSON"}
        </button>
        <button type="button" onClick={handleImportClick} disabled={busy}>
          导入 JSON
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={handleImportChange}
      />
      <p className="utility-panel__status">{message}</p>
    </section>
  );
}
