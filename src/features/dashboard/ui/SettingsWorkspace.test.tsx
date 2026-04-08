import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsWorkspace } from "./SettingsWorkspace";

vi.mock("../../../app/runtimeConfig", () => ({
  isDemoBuild: true,
}));

afterEach(() => {
  cleanup();
});

describe("SettingsWorkspace", () => {
  it("shows only the OCR settings card", () => {
    render(<SettingsWorkspace settingsForm={<div>Mock OCR settings form</div>} />);

    expect(screen.getByText("示例网站提示")).toBeInTheDocument();
    expect(screen.getByText("我们不会存储你的 API Key。后端只负责把请求转发到目标 OCR 服务以处理 CORS。")).toBeInTheDocument();
    expect(screen.getByText("OCR配置")).toBeInTheDocument();
    expect(screen.getByText("Mock OCR settings form")).toBeInTheDocument();
    expect(screen.queryByText("使用者设置")).not.toBeInTheDocument();
    expect(screen.queryByText("标签与标签组")).not.toBeInTheDocument();
    expect(screen.queryByText("正则筛选组")).not.toBeInTheDocument();
  });
});
