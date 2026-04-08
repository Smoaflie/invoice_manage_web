import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { SettingsWorkspace } from "./SettingsWorkspace";

vi.mock("../../../app/runtimeConfig", () => ({
  isDemoBuild: true,
}));

vi.mock("../../tags/ui/TagManagerPanel", () => ({
  TagManagerPanel: () => <div>Mock tag manager</div>,
}));

vi.mock("../../filters/ui/RegexFilterGroupPanel", () => ({
  RegexFilterGroupPanel: () => <div>Mock regex filter group</div>,
}));

vi.mock("../../settings/ui/UserSettingsForm", () => ({
  UserSettingsForm: () => <div>Mock user settings form</div>,
}));

afterEach(() => {
  cleanup();
});

describe("SettingsWorkspace", () => {
  it("shows the demo-site api key notice", () => {
    const invoiceDocuments = [{ id: "doc-1" }] as InvoiceDocument[];

    render(<SettingsWorkspace settingsForm={<div>Mock OCR settings form</div>} invoiceDocuments={invoiceDocuments} />);

    expect(screen.getByText("示例网站提示")).toBeInTheDocument();
    expect(screen.getByText("我们不会存储你的 API Key。后端只负责把请求转发到目标 OCR 服务以处理 CORS。")).toBeInTheDocument();
    expect(screen.getByText("Mock user settings form")).toBeInTheDocument();
  });
});
