import { NextResponse } from "next/server";
import {
  applyRateLimitHeaders,
  consumeSignedUploadLimit,
  isAllowedUploadOrigin,
  isUploadSecurityConfigured,
  missingUploadSecurityMessage,
  UPLOAD_SESSION_COOKIE_NAME,
  verifyUploadSessionToken
} from "@/lib/upload-security";
import {
  describeAllowedUploadFormats,
  getUploadMimePolicy,
  type UploadAssetType
} from "@/lib/upload-policy";

export const runtime = "nodejs";

const ASSET_TYPES: UploadAssetType[] = ["selfie", "dance", "drawing", "singing"];

const MAX_UPLOAD_BYTES: Record<UploadAssetType, number> = {
  dance: 80 * 1024 * 1024,
  drawing: 8 * 1024 * 1024,
  selfie: 12 * 1024 * 1024,
  singing: 25 * 1024 * 1024
};

function isAssetType(value: string): value is UploadAssetType {
  return ASSET_TYPES.includes(value as UploadAssetType);
}

function sanitizeToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function normalizeStorageApiBase(rawUrl: string) {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");

  if (trimmed.endsWith("/storage/v1/s3")) {
    return trimmed.slice(0, -3);
  }

  if (trimmed.endsWith("/storage/v1/object/public")) {
    return `${trimmed.slice(0, -"/storage/v1/object/public".length)}/storage/v1`;
  }

  if (trimmed.endsWith("/storage/v1/object")) {
    return `${trimmed.slice(0, -"/storage/v1/object".length)}/storage/v1`;
  }

  if (trimmed.endsWith("/storage/v1")) {
    return trimmed;
  }

  return `${trimmed}/storage/v1`;
}

function encodeObjectPath(path: string) {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildObjectPath(assetType: UploadAssetType, extension: string, playerName: string | null) {
  const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
  const id = crypto.randomUUID();

  if (assetType === "selfie") {
    return `selfie/${timestamp}-${id}.${extension}`;
  }

  if (assetType === "dance") {
    return `dance/${timestamp}-${id}.${extension}`;
  }

  if (assetType === "drawing") {
    const author = playerName ? sanitizeToken(playerName) || "player" : "player";
    return `drawings/${author}/${timestamp}-${id}.${extension}`;
  }

  return `singing/${timestamp}-${id}.${extension}`;
}

function missingStorageEnvMessage() {
  return "Storage is not configured. Add SUPABASE_STORAGE_URL, SUPABASE_STORAGE_SERVICE_KEY, and SUPABASE_STORAGE_BUCKET.";
}

function buildSignedUploadUrl(storageApiBase: string, urlPath: string) {
  if (urlPath.startsWith("http://") || urlPath.startsWith("https://")) {
    return urlPath;
  }

  if (urlPath.startsWith("/")) {
    return `${storageApiBase}${urlPath}`;
  }

  return `${storageApiBase}/${urlPath}`;
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return undefined;
  }

  for (const rawCookie of cookieHeader.split(";")) {
    const [cookieName, ...rawValue] = rawCookie.trim().split("=");

    if (cookieName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return undefined;
}

function jsonResponse(body: unknown, status: number, rateLimit?: { allowed: boolean; limit: number; remaining: number; resetAt: number }) {
  const response = NextResponse.json(body, { status });
  response.headers.set("cache-control", "no-store");

  if (rateLimit) {
    applyRateLimitHeaders(response.headers, rateLimit);
  }

  return response;
}

function logUploadFailure(message: string, details?: unknown) {
  console.error("[upload]", message, details);
}

export async function POST(request: Request) {
  if (!isUploadSecurityConfigured()) {
    return jsonResponse({ error: missingUploadSecurityMessage() }, 500);
  }

  if (!isAllowedUploadOrigin(request)) {
    return jsonResponse({ error: "Upload requests must originate from this site." }, 403);
  }

  const uploadSessionToken = readCookie(request, UPLOAD_SESSION_COOKIE_NAME);
  const uploadSession = verifyUploadSessionToken(uploadSessionToken, request.headers.get("user-agent"));

  if (!uploadSession) {
    return jsonResponse({ error: "Upload session is missing or expired. Refresh the page and try again." }, 401);
  }

  const signingRateLimit = consumeSignedUploadLimit(request, uploadSession.sid);

  if (!signingRateLimit.allowed) {
    return jsonResponse(
      {
        error: "Upload limit reached for this session. Please wait a few minutes and try again."
      },
      429,
      signingRateLimit
    );
  }

  const storageUrl = process.env.SUPABASE_STORAGE_URL;
  const storageServiceKey = process.env.SUPABASE_STORAGE_SERVICE_KEY;
  const storageBucket = process.env.SUPABASE_STORAGE_BUCKET;

  if (!storageUrl || !storageServiceKey || !storageBucket) {
    return jsonResponse({ error: missingStorageEnvMessage() }, 500, signingRateLimit);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse(
      {
        error: "Invalid JSON body. Send assetType, mimeType, and size."
      },
      400,
      signingRateLimit
    );
  }

  if (!payload || typeof payload !== "object") {
    return jsonResponse({ error: "Request body must be a JSON object." }, 400, signingRateLimit);
  }

  const record = payload as Record<string, unknown>;
  const assetTypeRaw = typeof record.assetType === "string" ? record.assetType.trim() : "";
  const mimeType = typeof record.mimeType === "string" ? record.mimeType.trim() : "";
  const size = typeof record.size === "number" ? record.size : Number.NaN;
  const playerName = typeof record.playerName === "string" ? record.playerName.trim() : null;

  if (!isAssetType(assetTypeRaw)) {
    return jsonResponse({ error: "assetType must be one of: selfie, dance, drawing, singing." }, 400, signingRateLimit);
  }

  if (!mimeType) {
    return jsonResponse({ error: "mimeType is required." }, 400, signingRateLimit);
  }

  if (!Number.isFinite(size) || size <= 0) {
    return jsonResponse({ error: "size must be a positive number." }, 400, signingRateLimit);
  }

  if (size > MAX_UPLOAD_BYTES[assetTypeRaw]) {
    return jsonResponse({ error: `File is too large for ${assetTypeRaw}.` }, 413, signingRateLimit);
  }

  const mimePolicy = getUploadMimePolicy(assetTypeRaw, mimeType);

  if (!mimePolicy) {
    return jsonResponse(
      {
        error: `Unsupported ${assetTypeRaw} format. Allowed formats: ${describeAllowedUploadFormats(assetTypeRaw)}.`
      },
      415,
      signingRateLimit
    );
  }

  const objectPath = buildObjectPath(assetTypeRaw, mimePolicy.extension, playerName);
  const encodedObjectPath = encodeObjectPath(objectPath);
  const encodedBucket = encodeURIComponent(storageBucket);
  const storageApiBase = normalizeStorageApiBase(storageUrl);
  const createSignedUploadUrl = `${storageApiBase}/object/upload/sign/${encodedBucket}/${encodedObjectPath}`;
  const publicBase = process.env.SUPABASE_STORAGE_PUBLIC_URL_BASE?.trim().replace(/\/+$/, "")
    || `${storageApiBase}/object/public`;
  const publicUrl = `${publicBase}/${encodedBucket}/${encodedObjectPath}`;

  try {
    const upstreamResponse = await fetch(createSignedUploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${storageServiceKey}`,
        apikey: storageServiceKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({})
    });

    if (!upstreamResponse.ok) {
      const upstreamError = await upstreamResponse.text();
      logUploadFailure("Failed to create signed upload URL", {
        status: upstreamResponse.status,
        upstreamError: upstreamError.slice(0, 200)
      });

      return jsonResponse({ error: "Failed to create signed upload URL." }, 502, signingRateLimit);
    }

    const upstreamPayload = (await upstreamResponse.json().catch(() => null)) as Record<string, unknown> | null;
    const signedPath = typeof upstreamPayload?.url === "string" ? upstreamPayload.url : "";

    if (!signedPath) {
      return NextResponse.json(
        {
          error: "Storage did not return a signed upload URL."
        },
        {
          status: 502,
          headers: {
            "cache-control": "no-store"
          }
        }
      );
    }

    const signedUrl = buildSignedUploadUrl(storageApiBase, signedPath);
    const response = NextResponse.json({
      contentType: mimePolicy.contentType,
      objectPath,
      publicUrl,
      signedUrl
    });
    response.headers.set("cache-control", "no-store");
    applyRateLimitHeaders(response.headers, signingRateLimit);

    return response;
  } catch (error) {
    logUploadFailure("Failed to prepare upload.", error instanceof Error ? error.message : error);
    return jsonResponse({ error: "Failed to prepare upload." }, 500, signingRateLimit);
  }
}
