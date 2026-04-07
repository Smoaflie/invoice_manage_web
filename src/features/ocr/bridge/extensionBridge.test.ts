import { afterEach, describe, expect, it, vi } from "vitest";
import { extensionBridgeParse, hasOcrExtensionBridge, openOcrExtensionOptions } from "./extensionBridge";

describe("extensionBridge", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports bridge unavailable when no bridge exists", async () => {
    await expect(hasOcrExtensionBridge(1)).resolves.toBe(false);
  });

  it("returns OCR data from the extension bridge response", async () => {
    const postMessageSpy = vi.spyOn(window, "postMessage").mockImplementation((message: unknown) => {
      const request = message as { type?: string; requestId?: string };

      if (request.type !== "OCR_PARSE_REQUEST" || !request.requestId) {
        return;
      }

      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            type: "OCR_PARSE_RESULT",
            requestId: request.requestId,
            ok: true,
            data: {
              invoiceNumber: "INV-EXT-001",
            },
          },
        }),
      );
    });

    await expect(
      extensionBridgeParse({
        vendor: "baidu",
        fileName: "invoice.pdf",
        mimeType: "application/pdf",
        fileBase64: "YWJj",
        fileKind: "pdf",
      }),
    ).resolves.toMatchObject({
      invoiceNumber: "INV-EXT-001",
    });

    expect(postMessageSpy).toHaveBeenCalledTimes(1);
  });

  it("opens the extension options page through the bridge", async () => {
    const postMessageSpy = vi.spyOn(window, "postMessage").mockImplementation((message: unknown) => {
      const request = message as { type?: string; requestId?: string };

      if (request.type !== "OCR_BRIDGE_OPEN_OPTIONS" || !request.requestId) {
        return;
      }

      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            type: "OCR_BRIDGE_OPTIONS_OPENED",
            requestId: request.requestId,
          },
        }),
      );
    });

    await expect(openOcrExtensionOptions()).resolves.toBeUndefined();
    expect(postMessageSpy).toHaveBeenCalledTimes(1);
  });
});
