import { OcrBridgeStatus } from "../../settings/ui/OcrBridgeStatus";

type SettingsStatusBoardProps = {
  message: string;
  bridgeConnected: boolean | null;
};

export function SettingsStatusBoard({ message, bridgeConnected }: SettingsStatusBoardProps) {
  const bridgeStatusLabel = bridgeConnected === null ? "桥接检测中" : bridgeConnected ? "桥接在线" : "桥接离线";

  return (
    <section className="workspace-card workspace-card--settings-info">
      <div className="workspace-card__header">
        <div>
          <p className="workspace-card__eyebrow">系统状态</p>
          <h2>系统状态看板</h2>
          <p className="workspace-card__copy">先确认桥接健康与当前浏览器范围，再进入 OCR 和工具表单。</p>
        </div>
      </div>

      <div className="workspace-status workspace-status--settings">
        <div>
          <p>{message}</p>
          <span>偏好仅保存在当前浏览器</span>
        </div>
        <span className={bridgeConnected ? "status-pill status-pill--success" : bridgeConnected === null ? "status-pill status-pill--neutral" : "status-pill status-pill--warning"}>
          {bridgeStatusLabel}
        </span>
      </div>

      <div className="settings-status-grid">
        <section className="settings-status-card">
          <div className="workspace-card__header">
            <div>
              <div className="workspace-card__eyebrow">
                <span>桥接健康</span>
                <span>扩展状态</span>
              </div>
              <h3>OCR 桥接连接</h3>
              <p className="workspace-card__copy">这里确认网页与浏览器扩展之间的桥接是否已就绪。</p>
            </div>
          </div>
          <OcrBridgeStatus connected={bridgeConnected} />
          <p className="workspace-card__copy">OCR 密钥保存在浏览器扩展中，当前页面只保存供应商偏好和开关状态。</p>
        </section>

        <section className="settings-status-card">
          <div className="workspace-card__header">
            <div>
              <p className="workspace-card__eyebrow">当前浏览器范围</p>
              <h3>本地作用域</h3>
              <p className="workspace-card__copy">设置会留在当前浏览器配置中，不会离开本地工作区。</p>
            </div>
          </div>
          <ul className="settings-checklist">
            <li>供应商偏好会写入 IndexedDB。</li>
            <li>OCR 密钥仅存在浏览器扩展内。</li>
            <li>文件绑定关系只保存在当前浏览器配置中。</li>
          </ul>
        </section>
      </div>
    </section>
  );
}
