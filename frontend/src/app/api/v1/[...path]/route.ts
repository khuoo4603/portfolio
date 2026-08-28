import { isIP } from "node:net";
import { randomUUID } from "node:crypto";
import { getBackendBaseUrl } from "@/lib/api/backend-url";

const REQUEST_ID_HEADER = "X-Request-Id";
const FORWARDED_FOR_HEADER = "X-Forwarded-For";
const ALLOWED_REQUEST_ID = /^[A-Za-z0-9_-]{1,64}$/;
const BODYLESS_METHODS = new Set(["GET", "HEAD"]);
const HOP_BY_HOP_HEADERS = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

type ProxyContext = {
  params: Promise<{ path: string[] }>;
};

function requestId(headers: Headers) {
  const candidate = headers.get(REQUEST_ID_HEADER);
  return candidate && ALLOWED_REQUEST_ID.test(candidate) ? candidate : randomUUID();
}

function normalizedClientIp(headers: Headers) {
  const forwarded = headers.get(FORWARDED_FOR_HEADER)?.split(",", 1)[0]?.trim();
  if (forwarded && isIP(forwarded)) {
    return forwarded;
  }
  const realIp = headers.get("X-Real-IP")?.trim();
  return realIp && isIP(realIp) ? realIp : null;
}

function requestHeaders(request: Request, traceId: string) {
  const headers = new Headers(request.headers);
  HOP_BY_HOP_HEADERS.forEach((name) => headers.delete(name));
  headers.delete("host");
  headers.delete("content-length");
  headers.delete(FORWARDED_FOR_HEADER);
  headers.delete(REQUEST_ID_HEADER);

  const clientIp = normalizedClientIp(request.headers);
  if (clientIp) {
    headers.set(FORWARDED_FOR_HEADER, clientIp);
  }
  headers.set(REQUEST_ID_HEADER, traceId);
  return headers;
}

function responseHeaders(upstream: Response) {
  const headers = new Headers(upstream.headers);
  HOP_BY_HOP_HEADERS.forEach((name) => headers.delete(name));
  headers.delete("content-length");

  const upstreamHeaders = upstream.headers as Headers & { getSetCookie?: () => string[] };
  const cookies = upstreamHeaders.getSetCookie?.() ?? [];
  if (cookies.length > 0) {
    headers.delete("set-cookie");
    cookies.forEach((cookie) => headers.append("set-cookie", cookie));
  }
  return headers;
}

// `/api/v1/**` Browser 요청의 Backend Same-Origin 전달
async function proxy(request: Request, context: ProxyContext) {
  const traceId = requestId(request.headers);

  try {
    const { path } = await context.params;
    const incoming = new URL(request.url);
    const target = new URL(`/api/v1/${path.map(encodeURIComponent).join("/")}${incoming.search}`, getBackendBaseUrl());
    const method = request.method.toUpperCase();
    const body = BODYLESS_METHODS.has(method) ? undefined : await request.arrayBuffer();
    const upstream = await fetch(target, {
      method,
      headers: requestHeaders(request, traceId),
      body: body && body.byteLength > 0 ? body : undefined,
      redirect: "manual",
    });
    const headers = responseHeaders(upstream);
    const responseBody = upstream.status === 204 || method === "HEAD" ? null : upstream.body;
    return new Response(responseBody, { status: upstream.status, statusText: upstream.statusText, headers });
  } catch {
    return Response.json(
      {
        code: "COMMON_INTERNAL_ERROR",
        message: "요청 처리 중 오류가 발생했습니다.",
        traceId,
        fieldErrors: [],
      },
      { status: 502, headers: { [REQUEST_ID_HEADER]: traceId } },
    );
  }
}

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
