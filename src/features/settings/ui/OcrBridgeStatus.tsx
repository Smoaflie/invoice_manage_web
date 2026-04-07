type OcrBridgeStatusProps = {
  connected: boolean | null;
};

export function OcrBridgeStatus({ connected }: OcrBridgeStatusProps) {
  if (connected === null) {
    return <p className="bridge-status">正在检查 OCR 扩展连接...</p>;
  }

  return (
    <p className={connected ? "bridge-status bridge-status--online" : "bridge-status bridge-status--offline"}>
      {connected ? "OCR 扩展已连接。" : "OCR 扩展未连接。"}
    </p>
  );
}
