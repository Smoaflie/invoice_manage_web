import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { appDb } from "../../../shared/db/appDb";
import { OcrSettingsForm } from "./OcrSettingsForm";

describe("OcrSettingsForm", () => {
  afterEach(async () => {
    cleanup();
    vi.restoreAllMocks();
    await appDb.settings.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  it("persists the default tencent vendor and its dedicated credentials", async () => {
    const user = userEvent.setup();
    render(<OcrSettingsForm />);

    await waitFor(() => expect(screen.getByLabelText("OCR服务商")).toHaveValue("tencent"));
    await user.type(screen.getByLabelText("SecretId"), "tencent-id");
    await user.type(screen.getByLabelText("SecretKey"), "tencent-key");
    expect(await appDb.settings.get("ocr.tencentSecretId")).toBeUndefined();
    expect(await appDb.settings.get("ocr.tencentSecretKey")).toBeUndefined();
    await user.click(screen.getByRole("button", { name: "保存 OCR 设置" }));
    await screen.findByText("OCR 设置已保存。");

    expect(await appDb.settings.get("ocr.vendor")).toMatchObject({ value: "tencent" });
    expect(await appDb.settings.get("ocr.enabled")).toMatchObject({ value: true });
    expect(await appDb.settings.get("ocr.baiduApiKey")).toMatchObject({ value: null });
    expect(await appDb.settings.get("ocr.baiduSecretKey")).toMatchObject({ value: null });
    expect(await appDb.settings.get("ocr.tencentSecretId")).toMatchObject({ value: "tencent-id" });
    expect(await appDb.settings.get("ocr.tencentSecretKey")).toMatchObject({ value: "tencent-key" });
  });

  it("keeps vendor credentials isolated", async () => {
    const user = userEvent.setup();
    render(<OcrSettingsForm />);

    await waitFor(() => expect(screen.getByLabelText("OCR服务商")).toHaveValue("tencent"));
    await user.type(screen.getByLabelText("SecretId"), "tencent-id");
    await user.type(screen.getByLabelText("SecretKey"), "tencent-key");
    await user.selectOptions(screen.getByLabelText("OCR服务商"), "baidu");
    await user.type(screen.getByLabelText("API_KEY"), "baidu-api-key");
    await user.type(screen.getByLabelText("SECRET_KEY"), "baidu-secret-key");
    await user.selectOptions(screen.getByLabelText("OCR服务商"), "tencent");
    expect(screen.getByLabelText("SecretId")).toHaveValue("tencent-id");
    expect(screen.getByLabelText("SecretKey")).toHaveValue("tencent-key");
    await user.click(screen.getByRole("button", { name: "保存 OCR 设置" }));
    await screen.findByText("OCR 设置已保存。");

    expect(await appDb.settings.get("ocr.baiduApiKey")).toMatchObject({ value: "baidu-api-key" });
    expect(await appDb.settings.get("ocr.baiduSecretKey")).toMatchObject({ value: "baidu-secret-key" });
    expect(await appDb.settings.get("ocr.tencentSecretId")).toMatchObject({ value: "tencent-id" });
    expect(await appDb.settings.get("ocr.tencentSecretKey")).toMatchObject({ value: "tencent-key" });
  });

  it("hides the saved status after form state changes and shows it again only after resubmitting", async () => {
    const user = userEvent.setup();
    render(<OcrSettingsForm />);

    await waitFor(() => expect(screen.getByLabelText("OCR服务商")).toHaveValue("tencent"));
    await user.type(screen.getByLabelText("SecretId"), "tencent-id");
    await user.click(screen.getByRole("button", { name: "保存 OCR 设置" }));
    await screen.findByText("OCR 设置已保存。");

    await user.type(screen.getByLabelText("SecretId"), "2");
    await waitFor(() => expect(screen.queryByText("OCR 设置已保存。")).not.toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText("OCR服务商"), "baidu");
    expect(screen.queryByText("OCR 设置已保存。")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "保存 OCR 设置" }));
    await screen.findByText("OCR 设置已保存。");
  });

  it("tests Baidu credentials without persisting them", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "baidu-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<OcrSettingsForm />);

    await waitFor(() => expect(screen.getByLabelText("OCR服务商")).toHaveValue("tencent"));
    await user.selectOptions(screen.getByLabelText("OCR服务商"), "baidu");
    await user.type(screen.getByLabelText("API_KEY"), "baidu-api-key");
    await user.type(screen.getByLabelText("SECRET_KEY"), "baidu-secret-key");
    await user.click(screen.getByRole("button", { name: "测试" }));

    await screen.findByText("百度 OCR 鉴权通过。");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ocr/baidu/oauth/2.0/token?grant_type=client_credentials&client_id=baidu-api-key&client_secret=baidu-secret-key",
      expect.objectContaining({ method: "POST" }),
    );
    expect(await appDb.settings.get("ocr.vendor")).toBeUndefined();
    expect(await appDb.settings.get("ocr.baiduApiKey")).toBeUndefined();
    expect(await appDb.settings.get("ocr.baiduSecretKey")).toBeUndefined();
  });

  it("shows the Tencent test note and clears the test result after form changes", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          Response: {
            Error: {
              Code: "FailedOperation.ImageDecodeFailed",
              Message: "图片解析失败",
            },
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    render(<OcrSettingsForm />);

    await waitFor(() => expect(screen.getByLabelText("OCR服务商")).toHaveValue("tencent"));
    expect(screen.getByText("测试腾讯 OCR 会模拟一次真实识别调用，这将会消耗供应商侧额度。")).toBeInTheDocument();
    await user.type(screen.getByLabelText("SecretId"), "tencent-id");
    await user.type(screen.getByLabelText("SecretKey"), "tencent-key");
    await user.click(screen.getByRole("button", { name: "测试" }));

    await screen.findByText("腾讯 OCR 鉴权已通过");
    expect(await appDb.settings.get("ocr.tencentSecretId")).toBeUndefined();

    await user.type(screen.getByLabelText("SecretId"), "2");
    await waitFor(() =>
      expect(screen.queryByText("腾讯 OCR 鉴权已通过")).not.toBeInTheDocument(),
    );
  });
});
