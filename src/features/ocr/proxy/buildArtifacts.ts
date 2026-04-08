import { getOcrProxyRoutes } from "./routes";

export function renderOcrProxyScript() {
  const routes = JSON.stringify(getOcrProxyRoutes(), null, 2);

  return `import http from "node:http";
import https from "node:https";

const routes = ${routes};
const port = Number(process.env.PORT ?? 9099);

function matchRoute(pathname) {
  return routes.find((route) => pathname.startsWith(route.prefix));
}

function proxyRequest(clientRequest, clientResponse) {
  const requestUrl = new URL(clientRequest.url ?? "/", \`http://127.0.0.1:\${port}\`);
  const route = matchRoute(requestUrl.pathname);

  if (!route) {
    clientResponse.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    clientResponse.end(JSON.stringify({ message: "Not Found" }));
    return;
  }

  const upstreamPath = requestUrl.pathname.slice(route.prefix.length - 1) + requestUrl.search;
  const upstreamUrl = new URL(upstreamPath, route.upstreamOrigin);
  const headers = { ...clientRequest.headers };
  delete headers.host;
  const requestOptions = {
    method: clientRequest.method,
    headers,
  };
  const transport = upstreamUrl.protocol === "http:" ? http : https;
  const upstreamRequest = transport.request(upstreamUrl, requestOptions, (upstreamResponse) => {
    clientResponse.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
    upstreamResponse.pipe(clientResponse);
  });

  upstreamRequest.on("error", (error) => {
    clientResponse.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    clientResponse.end(JSON.stringify({ message: error.message }));
  });

  clientRequest.pipe(upstreamRequest);
}

http.createServer(proxyRequest).listen(port);
`;
}

export function renderVercelConfig() {
  return {
    rewrites: getOcrProxyRoutes().map((route) => ({
      source: `${route.prefix}:path*`,
      destination: `${route.upstreamOrigin}/:path*`,
    })),
  };
}
