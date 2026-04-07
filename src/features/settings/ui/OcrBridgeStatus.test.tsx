import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OcrBridgeStatus } from "./OcrBridgeStatus";

describe("OcrBridgeStatus", () => {
  it("shows extension unavailable state", () => {
    render(<OcrBridgeStatus connected={false} />);
    expect(screen.getByText("OCR 扩展未连接。")).toBeInTheDocument();
  });
});
