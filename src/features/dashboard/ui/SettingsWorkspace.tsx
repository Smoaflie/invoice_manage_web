import type { ReactNode } from "react";
import { isDemoBuild } from "../../../app/runtimeConfig";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { RegexFilterGroupPanel } from "../../filters/ui/RegexFilterGroupPanel";
import { UserSettingsForm } from "../../settings/ui/UserSettingsForm";
import { TagManagerPanel } from "../../tags/ui/TagManagerPanel";

type SettingsWorkspaceProps = {
  settingsForm: ReactNode;
  invoiceDocuments: InvoiceDocument[];
};

export function SettingsWorkspace({ settingsForm, invoiceDocuments }: SettingsWorkspaceProps) {
  return (
    <section className="workspace-page workspace-page--settings">
      <div className="workspace-grid workspace-grid--settings">
        <section className="workspace-card workspace-card--settings-form workspace-card--settings-form-primary">
          <div className="workspace-card__header">
            <div>
              <p className="workspace-card__eyebrow">识别偏好</p>
              <h2>OCR配置</h2>
            </div>
          </div>
          {isDemoBuild ? <p className="workspace-card__copy">示例网站提示</p> : null}
          {isDemoBuild ? <p className="workspace-card__copy">我们不会存储你的 API Key。后端只负责把请求转发到目标 OCR 服务以处理 CORS。</p> : null}
          {settingsForm}
        </section>
      </div>

      <div className="workspace-grid workspace-grid--settings-modules">
        <section className="workspace-card workspace-card--settings-form">
          <div className="workspace-card__header">
            <div>
              <p className="workspace-card__eyebrow">用户偏好</p>
              <h2>使用者设置</h2>
              <p className="workspace-card__copy">设置当前浏览器默认使用者名字，供新导入记录自动带入上传者。</p>
            </div>
          </div>
          <UserSettingsForm />
        </section>

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
