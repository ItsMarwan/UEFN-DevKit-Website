import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

type DownloadTokenData = {
  guildId: string;
  assetId: string;
  filename: string;
  expiresAt: number;
  nonce: string;
};

const DOWNLOAD_TOKEN_TTL_SECONDS = 60;
const usedDownloadTokens = new Set<string>();

function getDownloadTokenSecret(): string {
  const secret = process.env.DOWNLOAD_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ENTERPRISE_API_TOKEN;
  if (!secret) {
    throw new Error('Download token secret is not configured');
  }
  return secret;
}

function signPayload(payload: string): string {
  return createHmac('sha256', getDownloadTokenSecret()).update(payload).digest('base64url');
}

function encodeTokenData(tokenData: Omit<DownloadTokenData, 'nonce'>): string {
  const fullTokenData: DownloadTokenData = {
    ...tokenData,
    nonce: randomUUID(),
  };
  const payload = Buffer.from(JSON.stringify(fullTokenData), 'utf8').toString('base64url');
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function decodeTokenData(token: string): DownloadTokenData | null {
  const [payload, signature] = token.split('.', 2);
  if (!payload || !signature) return null;

  const expectedSignature = signPayload(payload);
  const signatureBuf = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  if (signatureBuf.length !== expectedBuf.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuf, expectedBuf)) {
    return null;
  }

  try {
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(decoded) as DownloadTokenData;
  } catch {
    return null;
  }
}

export function createDownloadToken(data: Omit<DownloadTokenData, 'expiresAt' | 'nonce'>): string {
  const tokenData = {
    ...data,
    expiresAt: Math.floor(Date.now() / 1000) + DOWNLOAD_TOKEN_TTL_SECONDS,
  };
  return encodeTokenData(tokenData);
}

export function consumeDownloadToken(token: string): DownloadTokenData | null {
  if (usedDownloadTokens.has(token)) return null;

  const tokenData = decodeTokenData(token);
  if (!tokenData) return null;
  if (Math.floor(Date.now() / 1000) > tokenData.expiresAt) {
    return null;
  }

  usedDownloadTokens.add(token);
  return tokenData;
}

export function peekDownloadToken(token: string): DownloadTokenData | null {
  if (usedDownloadTokens.has(token)) return null;
  return decodeTokenData(token);
}
