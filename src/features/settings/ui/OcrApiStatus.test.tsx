import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OcrApiStatus } from "./OcrApiStatus";

describe("OcrApiStatus", () => {
  it("shows the same-origin API route state", () => {
    render(<OcrApiStatus />);
    expect(screen.getByText("OCR 将通过同源 API 代理处理。")).toBeInTheDocument();
  });
});
