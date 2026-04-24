import { NextRequest } from "next/server";
import { getClientIp } from "./get-client-ip";

const FLASK_API_URL = process.env.FLASK_API_URL;

function buildHeaders(req: NextRequest, authHeader: string, serverIdHeader: string) {
  const originHeader = req.headers.get("Origin") || "";
  const bypassHeader = req.headers.get("X-Dashboard-Bypass-Token") || "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: authHeader,
    "X-Discord-Server-ID": serverIdHeader,
    Origin: originHeader,
    "X-Forwarded-For": getClientIp(req),
    "X-Forwarded-Proto": "https",
  };

  if (bypassHeader) {
    headers["X-Dashboard-Bypass-Token"] = bypassHeader;
  }

  return headers;
}

async function fetchFlask(url: string, headers: Record<string, string>, body?: unknown) {
  return await fetch(url, {
    method: body ? "POST" : "GET",
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
}

export async function proxyFlaskFetch(req: NextRequest, body: unknown) {
  if (!FLASK_API_URL) {
    return {
      status: 500,
      data: {
        status: "error",
        message: "Flask API URL is not configured",
      },
    };
  }

  const authHeader = req.headers.get("Authorization") || "";
  const serverIdHeader = req.headers.get("X-Discord-Server-ID") || "";
  const headers = buildHeaders(req, authHeader, serverIdHeader);

  const enterpriseResponse = await fetchFlask(`${FLASK_API_URL}/api/v1/fetch`, headers, body);
  let data = await enterpriseResponse.json();
  let status = enterpriseResponse.status;

  if (enterpriseResponse.status === 403) {
    const premiumResponse = await fetchFlask(`${FLASK_API_URL}/api/v1/premium/fetch`, headers, body);
    data = await premiumResponse.json();
    status = premiumResponse.status;
  }

  return { status, data };
}

export async function proxyFlaskQuota(req: NextRequest) {
  if (!FLASK_API_URL) {
    return {
      status: 500,
      data: {
        status: "error",
        message: "Flask API URL is not configured",
      },
    };
  }

  const authHeader = req.headers.get("Authorization") || "";
  const serverIdHeader = req.headers.get("X-Discord-Server-ID") || "";
  const headers = buildHeaders(req, authHeader, serverIdHeader);

  const enterpriseResponse = await fetchFlask(`${FLASK_API_URL}/api/v1/quota`, headers);
  let data = await enterpriseResponse.json();
  let status = enterpriseResponse.status;

  if (enterpriseResponse.status === 403) {
    const premiumResponse = await fetchFlask(`${FLASK_API_URL}/api/v1/premium/quota`, headers);
    data = await premiumResponse.json();
    status = premiumResponse.status;
  }

  return { status, data };
}

export async function proxyFlaskCommandLogs(req: NextRequest) {
  if (!FLASK_API_URL) {
    return {
      status: 500,
      data: {
        status: "error",
        message: "Flask API URL is not configured",
      },
    };
  }

  const authHeader = req.headers.get("Authorization") || "";
  const serverIdHeader = req.headers.get("X-Discord-Server-ID") || "";
  const headers = buildHeaders(req, authHeader, serverIdHeader);
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";

  const enterpriseResponse = await fetchFlask(
    `${FLASK_API_URL}/api/v1/command-logs${qs}`,
    headers
  );
  let data = await enterpriseResponse.json();
  let status = enterpriseResponse.status;

  if (enterpriseResponse.status === 403) {
    const premiumResponse = await fetchFlask(
      `${FLASK_API_URL}/api/v1/premium/command-logs${qs}`,
      headers
    );
    data = await premiumResponse.json();
    status = premiumResponse.status;
  }

  return { status, data };
}

/**
 * Proxy verse-scripts requests to Flask.
 * Tries enterprise endpoint first, falls back to premium on 403.
 * Forwards any ?file_id= query param from the original request.
 */
export async function proxyFlaskVerseScripts(req: NextRequest) {
  if (!FLASK_API_URL) {
    return {
      status: 500,
      data: {
        status: "error",
        message: "Flask API URL is not configured",
      },
    };
  }

  const authHeader = req.headers.get("Authorization") || "";
  const serverIdHeader = req.headers.get("X-Discord-Server-ID") || "";
  const headers = buildHeaders(req, authHeader, serverIdHeader);

  // Preserve any query params (e.g. ?file_id=xxx) from the incoming request.
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";

  const enterpriseResponse = await fetchFlask(
    `${FLASK_API_URL}/api/v1/verse-scripts${qs}`,
    headers
  );
  let data = await enterpriseResponse.json();
  let status = enterpriseResponse.status;

  if (enterpriseResponse.status === 403) {
    const premiumResponse = await fetchFlask(
      `${FLASK_API_URL}/api/v1/premium/verse-scripts${qs}`,
      headers
    );
    data = await premiumResponse.json();
    status = premiumResponse.status;
  }

  return { status, data };
}