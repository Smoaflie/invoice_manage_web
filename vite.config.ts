import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { ocrProxyArtifactsPlugin } from "./src/features/ocr/proxy/vitePlugin";
import { createOcrViteProxyConfig } from "./src/features/ocr/proxy/viteProxy";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDemoBuild = (env.VITE_APP_VARIANT ?? "default") === "demo";

  return {
    plugins: [react(), ocrProxyArtifactsPlugin(isDemoBuild)],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return undefined;
            }
            if (id.includes("\\react\\") || id.includes("/react/") || id.includes("\\react-dom\\") || id.includes("/react-dom/")) {
              return "vendor-react";
            }
            if (id.includes("\\dexie\\") || id.includes("/dexie/")) {
              return "vendor-db";
            }
            if (id.includes("\\exceljs\\") || id.includes("/exceljs/")) {
              return "vendor-exceljs";
            }
            if (id.includes("\\pdf-lib\\") || id.includes("/pdf-lib/")) {
              return "vendor-pdf";
            }
            if (id.includes("\\jszip\\") || id.includes("/jszip/")) {
              return "vendor-zip";
            }
            return undefined;
          },
        },
      },
    },
    server: {
      proxy: createOcrViteProxyConfig(),
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
    },
  };
});
