import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { appDb } from "../../../shared/db/appDb";
import { OcrSettingsForm } from "./OcrSettingsForm";

const mockBridge = vi.hoisted(() => ({
  hasOcrExtensionBridge: vi.fn(async () => true),
  openOcrExtensionOptions: vi.fn(async () => undefined),
}));

vi.mock("../../ocr/bridge/extensionBridge", () => ({
  hasOcrExtensionBridge: mockBridge.hasOcrExtensionBridge,
  openOcrExtensionOptions: mockBridge.openOcrExtensionOptions,
}));

describe("OcrSettingsForm", () => {
  afterEach(async () => {
    cleanup();
    await appDb.settings.clear();
    mockBridge.hasOcrExtensionBridge.mockClear();
    mockBridge.openOcrExtensionOptions.mockClear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  it("persists OCR vendor settings and clears legacy page-side credentials", async () => {
    const user = userEvent.setup();
    render(<OcrSettingsForm />);

    await screen.findByText("OCR 设置已加载。");
    await screen.findByText("OCR 扩展已连接。");
    await user.selectOptions(await screen.findByLabelText("OCR 供应商"), "baidu");
    await user.click(screen.getByLabelText("启用 OCR"));
    await user.click(screen.getByRole("button", { name: "保存 OCR 设置" }));
    await screen.findByText("OCR 设置已保存。");

    expect(await appDb.settings.get("ocr.vendor")).toMatchObject({ value: "baidu" });
    expect(await appDb.settings.get("ocr.enabled")).toMatchObject({ value: true });
    expect(await appDb.settings.get("ocr.appId")).toMatchObject({ value: null });
    expect(await appDb.settings.get("ocr.apiKey")).toMatchObject({ value: null });
    expect(await appDb.settings.get("ocr.secretKey")).toMatchObject({ value: null });
  });

  it("opens the extension options page from the settings form", async () => {
    const user = userEvent.setup();
    render(<OcrSettingsForm />);

    await screen.findByText("OCR 设置已加载。");
    await user.click(screen.getByRole("button", { name: "打开扩展设置" }));

    expect(mockBridge.openOcrExtensionOptions).toHaveBeenCalledTimes(1);
  });
});
