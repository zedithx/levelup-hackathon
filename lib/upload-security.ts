import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const UPLOAD_SESSION_COOKIE_NAME = "levelup_upload_session";

const UPLOAD_SESSION_TTL_MS = 15 * 60 * 1000;
const SESSION_ISSUE_WINDOW_MS = 15 * 60 * 1000;
const SESSION_ISSUE_LIMIT = 8;
const SIGNED_UPLOAD_WINDOW_MS = 15 * 60 * 1000;
const SIGNED_UPLOAD_LIMIT = 24;

type UploadSessionPayload = {
  exp: number;
  sid: string;
  ua: string;
  v: 1;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

const sessionIssueBuckets = new Map<string, RateLimitState>();
const signedUploadBuckets = new Map<string, RateLimitState>();

function configuredOriginValues() {
  return (process.env.FRONTEND_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function normalizeOrigin(value: string | null) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function getAllowedOrigins(request: Request) {
  const allowedOrigins = new Set<string>();
  allowedOrigins.add(new URL(request.url).origin);

  for (const origin of configuredOriginValues()) {
    const normalized = normalizeOrigin(origin);

    if (normalized) {
      allowedOrigins.add(normalized);
    }
  }

  return allowedOrigins;
}

function getSessionSecret() {
  return process.env.UPLOAD_SESSION_SECRET?.trim() || null;
}

function encodePayload(payload: UploadSessionPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<UploadSessionPayload>;
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function hashUserAgent(userAgent: string | null) {
  return createHash("sha256")
    .update(userAgent?.trim() || "unknown")
    .digest("hex")
    .slice(0, 32);
}

function getClientIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstForwardedAddress = forwardedFor.split(",")[0]?.trim();

    if (firstForwardedAddress) {
      return firstForwardedAddress;
    }
  }

  const directAddress = request.headers.get("x-real-ip") || request.headers.get("cf-connecting-ip");

  if (directAddress?.trim()) {
    return directAddress.trim();
  }

  return hashUserAgent(request.headers.get("user-agent"));
}

function cleanupExpiredBuckets(store: Map<string, RateLimitState>, now: number) {
  if (store.size < 256) {
    return;
  }

  for (const [key, value] of store) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }
}

function consumeRateLimit(
  store: Map<string, RateLimitState>,
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  cleanupExpiredBuckets(store, now);

  const current = store.get(key);
  const bucket =
    current && current.resetAt > now
      ? current
      : {
          count: 0,
          resetAt: now + windowMs
        };

  bucket.count += 1;
  store.set(key, bucket);

  return {
    allowed: bucket.count <= limit,
    limit,
    remaining: Math.max(limit - bucket.count, 0),
    resetAt: bucket.resetAt
  };
}

export function isUploadSecurityConfigured() {
  return Boolean(getSessionSecret());
}

export function missingUploadSecurityMessage() {
  return "Upload signing is not configured. Add UPLOAD_SESSION_SECRET to .env or .env.local.";
}

export function createUploadSessionToken(userAgent: string | null) {
  const secret = getSessionSecret();

  if (!secret) {
    return null;
  }

  const payload: UploadSessionPayload = {
    exp: Date.now() + UPLOAD_SESSION_TTL_MS,
    sid: randomUUID(),
    ua: hashUserAgent(userAgent),
    v: 1
  };
  const encodedPayload = encodePayload(payload);
  const signature = signPayload(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyUploadSessionToken(token: string | undefined, userAgent: string | null) {
  if (!token) {
    return null;
  }

  const secret = getSessionSecret();

  if (!secret) {
    return null;
  }

  const [encodedPayload, signature, extraSegment] = token.split(".");

  if (!encodedPayload || !signature || extraSegment) {
    return null;
  }

  const expectedSignature = Buffer.from(signPayload(encodedPayload, secret), "utf8");
  const providedSignature = Buffer.from(signature, "utf8");

  if (expectedSignature.length !== providedSignature.length) {
    return null;
  }

  if (!timingSafeEqual(expectedSignature, providedSignature)) {
    return null;
  }

  try {
    const payload = decodePayload(encodedPayload);

    if (payload.v !== 1) {
      return null;
    }

    if (typeof payload.sid !== "string" || !payload.sid) {
      return null;
    }

    if (typeof payload.exp !== "number" || payload.exp <= Date.now()) {
      return null;
    }

    if (typeof payload.ua !== "string" || payload.ua !== hashUserAgent(userAgent)) {
      return null;
    }

    return payload as UploadSessionPayload;
  } catch {
    return null;
  }
}

export function isAllowedUploadOrigin(request: Request) {
  const secFetchSite = request.headers.get("sec-fetch-site");

  if (secFetchSite && !["same-origin", "same-site", "none"].includes(secFetchSite)) {
    return false;
  }

  const allowedOrigins = getAllowedOrigins(request);
  const origin = normalizeOrigin(request.headers.get("origin"));

  if (origin) {
    return allowedOrigins.has(origin);
  }

  const refererOrigin = normalizeOrigin(request.headers.get("referer"));

  if (refererOrigin) {
    return allowedOrigins.has(refererOrigin);
  }

  return false;
}

export function consumeUploadSessionIssueLimit(request: Request) {
  return consumeRateLimit(
    sessionIssueBuckets,
    `issue:${getClientIdentifier(request)}`,
    SESSION_ISSUE_LIMIT,
    SESSION_ISSUE_WINDOW_MS
  );
}

export function consumeSignedUploadLimit(request: Request, sessionId: string) {
  return consumeRateLimit(
    signedUploadBuckets,
    `sign:${sessionId}:${getClientIdentifier(request)}`,
    SIGNED_UPLOAD_LIMIT,
    SIGNED_UPLOAD_WINDOW_MS
  );
}

export function applyRateLimitHeaders(headers: Headers, rateLimit: RateLimitResult) {
  headers.set("x-ratelimit-limit", String(rateLimit.limit));
  headers.set("x-ratelimit-remaining", String(rateLimit.remaining));
  headers.set("x-ratelimit-reset", String(Math.ceil(rateLimit.resetAt / 1000)));

  if (!rateLimit.allowed) {
    headers.set("retry-after", String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))));
  }
}

export function uploadSessionCookieMaxAgeSeconds() {
  return Math.floor(UPLOAD_SESSION_TTL_MS / 1000);
}
