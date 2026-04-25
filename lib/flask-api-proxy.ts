import crypto from "crypto";
import { NextRequest } from "next/server";

const FLASK_API_URL = process.env.FLASK_API_URL;
const ENTERPRISE_API_TOKEN = process.env.ENTERPRISE_API_TOKEN;
const FLASK_INTERNAL_API_KEY = process.env.FLASK_INTERNAL_API_KEY;
const ENTERPRISE_API_ORIGIN = process.env.ENTERPRISE_API_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createSignature(body: string) {
  const token = requireEnv(ENTERPRISE_API_TOKEN, "ENTERPRISE_API_TOKEN");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto.createHmac("sha256", token).update(`${timestamp}.${body}`).digest("hex");
  return `Bearer ${timestamp}.${signature}`;
}

function buildHeaders(guildId: string, body: string) {
  const internalKey = requireEnv(FLASK_INTERNAL_API_KEY, "FLASK_INTERNAL_API_KEY");
  return {
    "Content-Type": "application/json",
    Authorization: createSignature(body),
    "X-Discord-Server-ID": guildId,
    "X-Internal-API-Key": internalKey,
    Origin: ENTERPRISE_API_ORIGIN,
  };
}

async function fetchFlask(url: string, headers: Record<string, string>, body?: unknown) {
  return await fetch(url, {
    method: body ? "POST" : "GET",
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
}

function buildErrorResponse(message: string) {
  return {
    status: 500,
    data: {
      status: "error",
      message,
    },
  };
}

export async function proxyFlaskFetch(req: NextRequest, body: unknown, guildId: string) {
  if (!FLASK_API_URL) {
    return buildErrorResponse("Flask API URL is not configured");
  }
  if (!guildId) {
    return buildErrorResponse("Missing guild ID for internal request");
  }

  const bodyStr = JSON.stringify(body || {});
  const headers = buildHeaders(guildId, bodyStr);

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

export async function proxyFlaskQuota(req: NextRequest, guildId: string) {
  if (!FLASK_API_URL) {
    return buildErrorResponse("Flask API URL is not configured");
  }
  if (!guildId) {
    return buildErrorResponse("Missing guild ID for internal request");
  }

  const headers = buildHeaders(guildId, "");
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

export async function proxyFlaskCommandLogs(req: NextRequest, guildId: string) {
  if (!FLASK_API_URL) {
    return {
      status: 500,
      data: {
        status: "error",
        message: "Flask API URL is not configured",
      },
    };
  }

  const headers = buildHeaders(guildId, "");
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
export async function proxyFlaskVerseScripts(req: NextRequest, guildId: string) {
  if (!FLASK_API_URL) {
    return {
      status: 500,
      data: {
        status: "error",
        message: "Flask API URL is not configured",
      },
    };
  }

  const headers = buildHeaders(guildId, "");

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