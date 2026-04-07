type WorkspaceSaveBarProps = {
  pendingCount: number;
  saving: boolean;
  onDiscard: () => void;
  onSave: () => void | Promise<void>;
};

export function WorkspaceSaveBar({ pendingCount, saving, onDiscard, onSave }: WorkspaceSaveBarProps) {
  return (
    <div className="workspace-savebar">
      <div>
        <strong>{pendingCount} 项修改待保存</strong>
        <span>行内编辑先进入草稿区，点击底栏后才会写入数据库。</span>
      </div>
      <div className="workspace-savebar__actions">
        <button type="button" className="workspace-toolbar-shell__ghost" onClick={onDiscard} disabled={saving}>
          放弃修改
        </button>
        <button type="button" onClick={() => void onSave()} disabled={saving}>
          {saving ? "保存中..." : "保存修改"}
        </button>
      </div>
    </div>
  );
}
