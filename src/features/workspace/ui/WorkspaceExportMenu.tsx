import { useEffect, useRef, useState } from "react";
import type { InvoiceBundleNamingMode } from "../../documents/application/invoicePdfExport";

type WorkspaceExportMenuProps = {
  disabled: boolean;
  onExportData: () => void | Promise<void>;
  onExportMergedPdf?: () => void | Promise<void>;
  onExportZip?: (bundleNamingMode: InvoiceBundleNamingMode) => void | Promise<void>;
};

export function WorkspaceExportMenu(props: WorkspaceExportMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [zipMenuOpen, setZipMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      setZipMenuOpen(false);
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node | null)) {
        setMenuOpen(false);
        setZipMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  const closeMenus = () => {
    setMenuOpen(false);
    setZipMenuOpen(false);
  };

  const runAction = async (action: () => void | Promise<void>) => {
    await action();
    closeMenus();
  };

  return (
    <div className="reference-workspace__export-menu" ref={containerRef}>
      <button
        type="button"
        className="workspace-toolbar-shell__ghost"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        disabled={props.disabled}
        onClick={() => setMenuOpen((current) => !current)}
      >
        导出
      </button>
      {menuOpen ? (
        <div className="reference-workspace__export-menu-panel" role="menu" aria-label="导出菜单">
          <button type="button" className="reference-workspace__export-menu-item" role="menuitem" onClick={() => void runAction(props.onExportData)}>
            导出数据 JSON
          </button>
          <button
            type="button"
            className="reference-workspace__export-menu-item"
            role="menuitem"
            onClick={() => props.onExportMergedPdf && void runAction(props.onExportMergedPdf)}
          >
            导出合并 PDF
          </button>
          <button
            type="button"
            className="reference-workspace__export-menu-item"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={zipMenuOpen}
            onClick={() => setZipMenuOpen((current) => !current)}
          >
            导出压缩包 ZIP(包含所有PDF文件及压缩包)
          </button>
          <button type="button" className="reference-workspace__export-menu-item" role="menuitem" onClick={closeMenus}>
            取消
          </button>
          {zipMenuOpen ? (
            <div className="reference-workspace__export-submenu-panel" role="menu" aria-label="ZIP 命名菜单">
              <button
                type="button"
                className="reference-workspace__export-menu-item"
                role="menuitem"
                onClick={() => props.onExportZip && void runAction(() => props.onExportZip?.("invoice_number"))}
              >
                按发票号码命名 PDF
              </button>
              <button
                type="button"
                className="reference-workspace__export-menu-item"
                role="menuitem"
                onClick={() => props.onExportZip && void runAction(() => props.onExportZip?.("total_amount"))}
              >
                按价税合计命名 PDF
              </button>
              <button type="button" className="reference-workspace__export-menu-item" role="menuitem" onClick={closeMenus}>
                取消
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
