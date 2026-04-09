import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import { renderOcrProxyScript } from "./buildArtifacts";

function resolveBuildOutDir(config: ResolvedConfig) {
  return path.resolve(config.root, config.build.outDir);
}

export function ocrProxyArtifactsPlugin(isDemoBuild: boolean): Plugin {
  let resolvedConfig: ResolvedConfig | null = null;

  return {
    name: "ocr-proxy-artifacts",
    apply: "build",
    configResolved(config) {
      resolvedConfig = config;
    },
    async closeBundle() {
      const outDir = resolvedConfig ? resolveBuildOutDir(resolvedConfig) : path.resolve(process.cwd(), "dist");
      await mkdir(outDir, { recursive: true });

      if (isDemoBuild) {
        await rm(path.join(outDir, "ocr-proxy.js"), { force: true });
        await rm(path.join(outDir, "vercel.json"), { force: true });
        return;
      }

      await rm(path.join(outDir, "vercel.json"), { force: true });
      await writeFile(path.join(outDir, "ocr-proxy.js"), `${renderOcrProxyScript()}\n`, "utf8");
    },
  };
}

export { resolveBuildOutDir };
