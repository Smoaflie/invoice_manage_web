import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { SettingsStatusBoard } from "./SettingsStatusBoard";
import { SettingsWorkspace } from "./SettingsWorkspace";

vi.mock("../../settings/ui/OcrBridgeStatus", () => ({
  OcrBridgeStatus: ({ connected }: { connected: boolean | null }) => (
    <div>{connected === null ? "Bridge pending" : connected ? "Bridge online" : "Bridge offline"}</div>
  ),
}));

vi.mock("../../tags/ui/TagManagerPanel", () => ({
  TagManagerPanel: () => <div>Mock tag manager</div>,
}));

vi.mock("../../filters/ui/RegexFilterGroupPanel", () => ({
  RegexFilterGroupPanel: () => <div>Mock regex filter group</div>,
}));

afterEach(() => {
  cleanup();
});

describe("SettingsWorkspace status ordering", () => {
  it("renders the system status board with bridge health and browser scope", () => {
    render(<SettingsStatusBoard message="本地工作台数据已加载。" bridgeConnected={false} />);

    expect(screen.getByText("系统状态看板")).toBeInTheDocument();
    expect(screen.getByText("桥接健康")).toBeInTheDocument();
    expect(screen.getByText("当前浏览器范围")).toBeInTheDocument();
    expect(screen.getByText("本地工作台数据已加载。")).toBeInTheDocument();
    expect(screen.getByText("Bridge offline")).toBeInTheDocument();
  });

  it("renders the system status board before the OCR settings form", () => {
    const invoiceDocuments = [{ id: "doc-1" }] as InvoiceDocument[];

    render(
      <SettingsWorkspace
        message="本地工作台数据已加载。"
        settingsForm={<div>Mock OCR settings form</div>}
        bridgeConnected={true}
        invoiceDocuments={invoiceDocuments}
      />,
    );

    const statusBoardHeading = screen.getByRole("heading", { level: 2, name: "系统状态看板" });
    const settingsForm = screen.getByText("Mock OCR settings form");

    expect(statusBoardHeading).toBeInTheDocument();
    expect(screen.getByText("桥接健康")).toBeInTheDocument();
    expect(screen.getByText("当前浏览器范围")).toBeInTheDocument();
    expect(statusBoardHeading.compareDocumentPosition(settingsForm) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
