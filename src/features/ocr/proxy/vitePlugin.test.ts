import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ocrProxyArtifactsPlugin, resolveBuildOutDir } from "./vitePlugin";

const tempRoots: string[] = [];

async function createTempRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "ocr-proxy-plugin-"));
  tempRoots.push(root);
  return root;
}

async function runPlugin(root: string, isDemoBuild: boolean) {
  const plugin = ocrProxyArtifactsPlugin(isDemoBuild);
  const outDir = path.join(root, "dist");

  const configResolvedHook = typeof plugin.configResolved === "function" ? plugin.configResolved : plugin.configResolved?.handler;
  configResolvedHook?.({
    root,
    build: { outDir: "dist" },
  } as never);

  const closeBundleHook = typeof plugin.closeBundle === "function" ? plugin.closeBundle : plugin.closeBundle?.handler;
  await closeBundleHook?.call({} as never);

  return {
    outDir,
    ocrProxyPath: path.join(outDir, "ocr-proxy.js"),
    vercelConfigPath: path.join(outDir, "vercel.json"),
  };
}

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map(async (root) => {
      await import("node:fs/promises").then(({ rm }) => rm(root, { recursive: true, force: true }));
    }),
  );
});

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

describe("ocrProxyArtifactsPlugin", () => {
  it("writes the standalone proxy script for normal builds and removes stale vercel config", async () => {
    const root = await createTempRoot();
    const outDir = path.join(root, "dist");
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, "vercel.json"), "{\"stale\":true}\n", "utf8");

    const paths = await runPlugin(root, false);
    const script = await readFile(paths.ocrProxyPath, "utf8");

    await expect(readFile(paths.vercelConfigPath, "utf8")).rejects.toThrow();
    expect(script).toContain('"/api/ocr/baidu/"');
    expect(script).toContain('"/api/ocr/tencent/"');
  });

  it("removes standalone proxy artifacts for demo builds without writing dist vercel config", async () => {
    const root = await createTempRoot();
    const outDir = path.join(root, "dist");
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, "ocr-proxy.js"), "// stale\n", "utf8");
    await writeFile(path.join(outDir, "vercel.json"), "{\"stale\":true}\n", "utf8");

    const paths = await runPlugin(root, true);

    await expect(readFile(paths.ocrProxyPath, "utf8")).rejects.toThrow();
    await expect(readFile(paths.vercelConfigPath, "utf8")).rejects.toThrow();
  });
});
