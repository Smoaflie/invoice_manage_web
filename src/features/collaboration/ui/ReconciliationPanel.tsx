export type ReconciliationPanelProps = {
  importedSnapshotText: string;
  matchTag: string;
  matchedCount: number;
  unmatchedCount: number;
  matchedInvoiceNumbers: string[];
  unmatchedInvoiceNumbers: string[];
  onImportedSnapshotTextChange: (value: string) => void;
  onMatchTagChange: (value: string) => void;
  onImport: () => void;
  onApplyTag: () => void;
};

export function ReconciliationPanel({
  importedSnapshotText,
  matchTag,
  matchedCount,
  unmatchedCount,
  matchedInvoiceNumbers,
  unmatchedInvoiceNumbers,
  onImportedSnapshotTextChange,
  onMatchTagChange,
  onImport,
  onApplyTag,
}: ReconciliationPanelProps) {
  return (
    <section className="workspace-card">
      <div className="workspace-card__header">
        <div>
          <p className="workspace-card__eyebrow">员工端</p>
          <h2>本地对账</h2>
        </div>
      </div>
      <label>
        导入暴露快照
        <textarea value={importedSnapshotText} rows={8} onChange={(event) => onImportedSnapshotTextChange(event.target.value)} />
      </label>
      <button type="button" onClick={onImport} disabled={!importedSnapshotText.trim()}>
        导入并比对快照
      </button>
      <div className="workspace-card__summary">
        <strong>比对结果</strong>
        <p>命中 {matchedCount} 条，未命中 {unmatchedCount} 条。</p>
      </div>
      <div className="workspace-card__summary">
        <strong>命中票据</strong>
        <p>{matchedInvoiceNumbers.length > 0 ? matchedInvoiceNumbers.join(" / ") : "暂无命中票据。"}</p>
      </div>
      <div className="workspace-card__summary">
        <strong>未命中票据</strong>
        <p>{unmatchedInvoiceNumbers.length > 0 ? unmatchedInvoiceNumbers.join(" / ") : "暂无未命中票据。"}</p>
      </div>
      <label>
        命中项标签
        <input value={matchTag} onChange={(event) => onMatchTagChange(event.target.value)} />
      </label>
      <button type="button" onClick={onApplyTag} disabled={matchedCount === 0}>
        为命中项打标签
      </button>
    </section>
  );
}
