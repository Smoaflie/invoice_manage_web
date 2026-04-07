import { useState } from "react";
import { importFiles, type PickedFile } from "../application/importFiles";
import { persistFileHandle } from "../../../shared/fs/fileHandles";

type FileImportPanelProps = {
  onImportComplete?: () => void | Promise<void>;
};

export function FileImportPanel({ onImportComplete }: FileImportPanelProps) {
  const [message, setMessage] = useState("还没有导入文件。");
  const [busy, setBusy] = useState(false);

  const pickFiles = async () => {
    const openFilePicker = window.showOpenFilePicker as
      | undefined
      | ((options: {
          multiple?: boolean;
          types?: Array<{
            description: string;
            accept: Record<string, string[]>;
          }>;
          excludeAcceptAllOption?: boolean;
        }) => Promise<FileSystemFileHandle[]>);

    if (!openFilePicker) {
      setMessage("当前浏览器不支持文件选择器。");
      return;
    }

    setBusy(true);

    try {
      const handles = await openFilePicker({
        multiple: true,
        types: [
          {
            description: "PDF 文件",
            accept: {
              "application/pdf": [".pdf"],
            },
          },
        ],
        excludeAcceptAllOption: true,
      });

      const pickedFiles: PickedFile[] = [];

      for (const handle of handles) {
        const file = await handle.getFile();
        pickedFiles.push({ file, handle });
      }

      const result = await importFiles(pickedFiles, {
        persistHandle: persistFileHandle,
        now: () => new Date().toISOString(),
      });

      await onImportComplete?.();
      setMessage(`已新增 ${result.created.length} 个文件，重绑 ${result.rebound.length} 个文件。`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setMessage("已取消文件选择。");
        return;
      }

      setMessage("导入失败。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="utility-panel">
      <p className="utility-panel__label">导入</p>
      <p className="utility-panel__copy">从本地文件系统选择发票 PDF，并将其绑定到当前浏览器台账。</p>
      <button type="button" onClick={pickFiles} disabled={busy}>
        {busy ? "导入中..." : "导入 PDF 文件"}
      </button>
      <p className="utility-panel__status">{message}</p>
    </section>
  );
}
