import type { ReactNode } from "react";
import { isDemoBuild } from "../../../app/runtimeConfig";

type SettingsWorkspaceProps = {
  settingsForm: ReactNode;
  invoiceDocuments?: unknown;
};

export function SettingsWorkspace({ settingsForm }: SettingsWorkspaceProps) {
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
    </section>
  );
}
