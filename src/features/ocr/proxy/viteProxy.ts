import type { ProxyOptions } from "vite";
import { getOcrProxyRoutes } from "./routes";

function toRewritePrefix(prefix: string) {
  return prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
}

export function createOcrViteProxyConfig(): Record<string, string | ProxyOptions> {
  return Object.fromEntries(
    getOcrProxyRoutes().map((route) => [
      route.prefix,
      {
        target: route.upstreamOrigin,
        changeOrigin: true,
        rewrite: (path: string) => {
          const rewritten = path.replace(toRewritePrefix(route.prefix), "");
          return rewritten.length > 0 ? rewritten : "/";
        },
      } satisfies ProxyOptions,
    ]),
  );
}
