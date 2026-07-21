import { NextRequest, NextResponse } from "next/server";

const BODYLESS_METHODS = new Set(["GET", "HEAD"]);
const BODYLESS_STATUSES = new Set([204, 205, 304]);
const PASSTHROUGH_RESPONSE_HEADERS = [
  "content-disposition",
  "location",
  "retry-after",
  "www-authenticate",
] as const;

const normalizeToken = (value: string | null | undefined) =>
  value
    ?.trim()
    .replace(/^(?:Bearer(?:\s+|$))+/i, "")
    .trim() ?? "";

const getAuthorization = (request: NextRequest) => {
  const headerToken = normalizeToken(request.headers.get("authorization"));
  const cookieToken = normalizeToken(
    request.cookies.get("access_token")?.value,
  );
  const token = headerToken || cookieToken;

  return token ? `Bearer ${token}` : null;
};

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_HOST?.trim().replace(/\/+$/, "") ?? "";

const createProxyError = (message: string, status: number) =>
  NextResponse.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );

export async function proxyMarketRequest(
  request: NextRequest,
  backendPath: string,
) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return createProxyError("The backend API URL is not configured.", 500);
  }

  try {
    const method = request.method.toUpperCase();
    const headers = new Headers();
    const authorization = getAuthorization(request);
    const accept = request.headers.get("accept");

    if (authorization) headers.set("Authorization", authorization);
    if (accept) headers.set("Accept", accept);

    let body: ArrayBuffer | undefined;

    if (!BODYLESS_METHODS.has(method)) {
      const requestBody = await request.arrayBuffer();

      if (requestBody.byteLength > 0) {
        body = requestBody;
        headers.set(
          "Content-Type",
          request.headers.get("content-type") ?? "application/json",
        );
      }
    }

    const backendResponse = await fetch(
      `${apiBaseUrl}${backendPath}${request.nextUrl.search}`,
      {
        method,
        headers,
        body,
        cache: "no-store",
        redirect: "manual",
        signal: request.signal,
      },
    );

    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    const contentType = backendResponse.headers.get("content-type");

    if (contentType) responseHeaders.set("Content-Type", contentType);

    for (const headerName of PASSTHROUGH_RESPONSE_HEADERS) {
      const value = backendResponse.headers.get(headerName);
      if (value) responseHeaders.set(headerName, value);
    }

    if (BODYLESS_STATUSES.has(backendResponse.status)) {
      return new NextResponse(null, {
        status: backendResponse.status,
        headers: responseHeaders,
      });
    }

    const responseBody = await backendResponse.arrayBuffer();

    return new NextResponse(responseBody.byteLength > 0 ? responseBody : null, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Market API proxy error:", error);
    return createProxyError("Unable to connect to the market API server.", 502);
  }
}
