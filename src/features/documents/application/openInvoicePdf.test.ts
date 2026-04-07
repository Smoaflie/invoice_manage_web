import { beforeEach, describe, expect, test, vi } from "vitest";
import { openInvoicePdf } from "./openInvoicePdf";

describe("openInvoicePdf", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("opens a file in a new tab using a blob url", async () => {
    const file = new File(["pdf"], "demo.pdf", { type: "application/pdf" });
    const handle = {
      getFile: vi.fn().mockResolvedValue(file),
    } as unknown as FileSystemFileHandle;
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn().mockReturnValue("blob:test"),
      configurable: true,
    });
    const createObjectUrlSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");

    await openInvoicePdf(handle);

    expect(createObjectUrlSpy).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith("blob:test", "_blank", "noopener,noreferrer");
  });
});
