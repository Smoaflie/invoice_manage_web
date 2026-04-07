import { describe, expect, it } from "vitest";
import { hashFile } from "./hashFile";

describe("hashFile", () => {
  it("returns the expected sha-256 for fixed bytes", async () => {
    const file = new File(["abc"], "demo.pdf", { type: "application/pdf" });

    expect(await hashFile(file)).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("produces a different hash for different bytes", async () => {
    const firstFile = new File(["abc"], "demo.pdf", { type: "application/pdf" });
    const secondFile = new File(["abcd"], "demo.pdf", { type: "application/pdf" });

    expect(await hashFile(firstFile)).not.toBe(await hashFile(secondFile));
  });
});
