import type { ReactNode } from "react";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { RegexFilterGroupPanel } from "../../filters/ui/RegexFilterGroupPanel";
import { TagManagerPanel } from "../../tags/ui/TagManagerPanel";
import { SettingsStatusBoard } from "./SettingsStatusBoard";

type SettingsWorkspaceProps = {
  message: string;
  settingsForm: ReactNode;
  bridgeConnected: boolean | null;
  invoiceDocuments: InvoiceDocument[];
};

export function SettingsWorkspace({ message, settingsForm, bridgeConnected, invoiceDocuments }: SettingsWorkspaceProps) {
  return (
    <section className="workspace-page workspace-page--settings">
      <SettingsStatusBoard message={message} bridgeConnected={bridgeConnected} />

      <div className="workspace-grid workspace-grid--settings">
        <section className="workspace-card workspace-card--settings-form">
          <div className="workspace-card__header">
            <div>
              <p className="workspace-card__eyebrow">识别偏好</p>
              <h2>默认识别配置</h2>
              <p className="workspace-card__copy">设置供应商和当前浏览器内是否启用 OCR。</p>
            </div>
          </div>
          {settingsForm}
        </section>
      </div>

      <div className="workspace-grid workspace-grid--settings-modules">
        <section className="workspace-card workspace-card--settings-form">
          <div className="workspace-card__header">
            <div>
              <p className="workspace-card__eyebrow">标签管理</p>
              <h2>标签与标签组</h2>
              <p className="workspace-card__copy">维护标签定义与标签组映射，供发票页按标签和标签组筛选。</p>
            </div>
          </div>
          <TagManagerPanel invoiceDocuments={invoiceDocuments} />
        </section>

        <section className="workspace-card workspace-card--settings-form">
          <div className="workspace-card__header">
            <div>
              <p className="workspace-card__eyebrow">规则筛选</p>
              <h2>正则筛选组</h2>
              <p className="workspace-card__copy">按发票已有字段建立正则规则，供发票页快速筛选匹配结果。</p>
            </div>
          </div>
          <RegexFilterGroupPanel />
        </section>
      </div>
    </section>
  );
}
