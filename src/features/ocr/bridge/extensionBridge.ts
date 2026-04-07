import type { OcrInvoiceResponse } from "../infrastructure/normalizeInvoice";

type OcrBridgeVendor = "baidu" | "tencent";

type OcrBridgePayload = {
  vendor: OcrBridgeVendor;
  fileName: string;
  mimeType: string;
  fileBase64: string;
  fileKind: "pdf" | "image";
};

type OcrParseRequestMessage = {
  type: "OCR_PARSE_REQUEST";
  requestId: string;
  payload: OcrBridgePayload;
};

type OcrParseResultMessage = {
  type: "OCR_PARSE_RESULT";
  requestId: string;
  ok: boolean;
  data?: OcrInvoiceResponse;
  error?: {
    code: string;
    message: string;
  };
};

type OcrBridgePingMessage = {
  type: "OCR_BRIDGE_PING";
  requestId: string;
};

type OcrBridgePongMessage = {
  type: "OCR_BRIDGE_PONG";
  requestId: string;
  version: string;
};

type OcrBridgeOpenOptionsMessage = {
  type: "OCR_BRIDGE_OPEN_OPTIONS";
  requestId: string;
};

type OcrBridgeOptionsOpenedMessage = {
  type: "OCR_BRIDGE_OPTIONS_OPENED";
  requestId: string;
};

type BridgeRequestMessage = OcrParseRequestMessage | OcrBridgePingMessage | OcrBridgeOpenOptionsMessage;
type BridgeResponseMessage = OcrParseResultMessage | OcrBridgePongMessage | OcrBridgeOptionsOpenedMessage;

function isBrowserBridgeContext() {
  return typeof window !== "undefined" && typeof window.postMessage === "function";
}

function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function waitForBridgeResponse<TResponse extends BridgeResponseMessage>(
  message: BridgeRequestMessage,
  expectedType: TResponse["type"],
  timeoutMs: number,
) {
  if (!isBrowserBridgeContext()) {
    return Promise.resolve(null as TResponse | null);
  }

  return new Promise<TResponse | null>((resolve) => {
    let settled = false;

    const cleanup = () => {
      settled = true;
      window.removeEventListener("message", handleMessage);
      window.clearTimeout(timeoutId);
    };

    const handleMessage = (event: MessageEvent<unknown>) => {
      if (settled) {
        return;
      }

      if (event.source && event.source !== window) {
        return;
      }

      const data = event.data as Partial<BridgeResponseMessage> | null;
      if (!data || data.type !== expectedType || data.requestId !== message.requestId) {
        return;
      }

      cleanup();
      resolve(data as TResponse);
    };

    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, timeoutMs);

    window.addEventListener("message", handleMessage);
    window.postMessage(message, window.location.origin);
  });
}

export async function hasOcrExtensionBridge(timeoutMs = 1_500) {
  const response = await waitForBridgeResponse<OcrBridgePongMessage>(
    {
      type: "OCR_BRIDGE_PING",
      requestId: createRequestId(),
    },
    "OCR_BRIDGE_PONG",
    timeoutMs,
  );

  return response !== null;
}

export async function extensionBridgeParse(payload: OcrBridgePayload, timeoutMs = 30_000) {
  const response = await waitForBridgeResponse<OcrParseResultMessage>(
    {
      type: "OCR_PARSE_REQUEST",
      requestId: createRequestId(),
      payload,
    },
    "OCR_PARSE_RESULT",
    timeoutMs,
  );

  if (!response) {
    throw new Error("OCR 扩展未连接。");
  }

  if (!response.ok) {
    throw new Error(response.error?.message || "OCR 请求失败。");
  }

  return response.data ?? {};
}

export async function openOcrExtensionOptions(timeoutMs = 1_500) {
  const response = await waitForBridgeResponse<OcrBridgeOptionsOpenedMessage>(
    {
      type: "OCR_BRIDGE_OPEN_OPTIONS",
      requestId: createRequestId(),
    },
    "OCR_BRIDGE_OPTIONS_OPENED",
    timeoutMs,
  );

  if (!response) {
    throw new Error("无法打开扩展设置页。");
  }
}
