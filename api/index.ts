import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../artifacts/api-server/src/app";

/**
 * Vercel sends every /api request to this single function. The route capture is
 * passed as the internal __path query parameter by vercel.json, so restore the
 * original URL before handing the request to the existing Express application.
 */
function restoreApiUrl(rawUrl: string | undefined): string {
  const parsed = new URL(rawUrl ?? "/", "http://localhost");
  const capturedPath = parsed.searchParams.get("__path") ?? "";
  parsed.searchParams.delete("__path");

  const normalizedPath = capturedPath.replace(/^\/+|\/+$/g, "");
  const pathname = normalizedPath ? `/api/${normalizedPath}` : "/api";
  const query = parsed.searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export default function handler(
  request: IncomingMessage,
  response: ServerResponse,
): ReturnType<typeof app> {
  request.url = restoreApiUrl(request.url);
  return app(request, response);
}
