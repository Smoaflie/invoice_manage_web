import { describe, expect, it } from "vitest";
import { resolveBuildOutDir } from "./vitePlugin";

describe("resolveBuildOutDir", () => {
  it("derives the artifact output path from Vite's resolved build.outDir", () => {
    expect(
      resolveBuildOutDir({
        root: "C:/workspace/Phase/00-Alliance/invoice_collection_web",
        build: { outDir: "custom-dist" },
      } as never),
    ).toBe("C:\\workspace\\Phase\\00-Alliance\\invoice_collection_web\\custom-dist");
  });
});
