import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { ocrProxyArtifactsPlugin } from "./src/features/ocr/proxy/vitePlugin";
import { createOcrViteProxyConfig } from "./src/features/ocr/proxy/viteProxy";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDemoBuild = (env.VITE_APP_VARIANT ?? "default") === "demo";

  return {
    plugins: [react(), ocrProxyArtifactsPlugin(isDemoBuild)],
    server: {
      proxy: createOcrViteProxyConfig(),
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
    },
  };
});
