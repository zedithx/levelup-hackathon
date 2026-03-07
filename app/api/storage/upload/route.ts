import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ASSET_TYPES = ["selfie", "dance", "drawing", "singing"] as const;

type AssetType = (typeof ASSET_TYPES)[number];

const MAX_UPLOAD_BYTES: Record<AssetType, number> = {
  selfie: 12 * 1024 * 1024,
  dance: 80 * 1024 * 1024,
  drawing: 8 * 1024 * 1024,
  singing: 25 * 1024 * 1024
};

function isAssetType(value: string): value is AssetType {
  return ASSET_TYPES.includes(value as AssetType);
}

function isMimeAllowed(assetType: AssetType, mimeType: string) {
  if (assetType === "selfie" || assetType === "drawing") {
    return mimeType.startsWith("image/");
  }

  if (assetType === "dance") {
    return mimeType.startsWith("video/");
  }

  if (assetType === "singing") {
    return mimeType.startsWith("audio/");
  }

  return false;
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

function extensionForMimeType(mimeType: string) {
  if (mimeType.includes("jpeg")) return "jpg";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("mpeg")) return "mp3";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("ogg")) return "ogg";

  return "bin";
}

function extensionForFile(filename: string, mimeType: string) {
  const maybeNameExtension = filename.split(".").pop()?.toLowerCase() ?? "";

  if (/^[a-z0-9]{1,10}$/.test(maybeNameExtension)) {
    return maybeNameExtension;
  }

  return extensionForMimeType(mimeType);
}

function buildObjectPath(assetType: AssetType, filename: string, mimeType: string, playerName: string | null) {
  const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
  const id = crypto.randomUUID();
  const extension = extensionForFile(filename, mimeType);

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

export async function POST(request: Request) {
  const storageUrl = process.env.SUPABASE_STORAGE_URL;
  const storageServiceKey = process.env.SUPABASE_STORAGE_SERVICE_KEY;
  const storageBucket = process.env.SUPABASE_STORAGE_BUCKET;

  if (!storageUrl || !storageServiceKey || !storageBucket) {
    return NextResponse.json({ error: missingStorageEnvMessage() }, { status: 500 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON body. Send assetType, filename, mimeType, and size."
      },
      { status: 400 }
    );
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const record = payload as Record<string, unknown>;
  const assetTypeRaw = typeof record.assetType === "string" ? record.assetType.trim() : "";
  const filename = typeof record.filename === "string" ? record.filename.trim() : "";
  const mimeType = typeof record.mimeType === "string" ? record.mimeType.trim() : "";
  const size = typeof record.size === "number" ? record.size : Number.NaN;
  const playerName = typeof record.playerName === "string" ? record.playerName.trim() : null;

  if (!isAssetType(assetTypeRaw)) {
    return NextResponse.json({ error: "assetType must be one of: selfie, dance, drawing, singing." }, { status: 400 });
  }

  if (!filename) {
    return NextResponse.json({ error: "filename is required." }, { status: 400 });
  }

  if (!mimeType) {
    return NextResponse.json({ error: "mimeType is required." }, { status: 400 });
  }

  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "size must be a positive number." }, { status: 400 });
  }

  if (size > MAX_UPLOAD_BYTES[assetTypeRaw]) {
    return NextResponse.json({ error: `File is too large for ${assetTypeRaw}.` }, { status: 413 });
  }

  if (!isMimeAllowed(assetTypeRaw, mimeType)) {
    return NextResponse.json({ error: `Unsupported file type for ${assetTypeRaw}.` }, { status: 415 });
  }

  const objectPath = buildObjectPath(assetTypeRaw, filename, mimeType, playerName);
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

      return NextResponse.json(
        {
          error: "Failed to create signed upload URL.",
          details: upstreamError.slice(0, 500)
        },
        { status: 502 }
      );
    }

    const upstreamPayload = (await upstreamResponse.json().catch(() => null)) as Record<string, unknown> | null;
    const signedPath = typeof upstreamPayload?.url === "string" ? upstreamPayload.url : "";

    if (!signedPath) {
      return NextResponse.json(
        {
          error: "Storage did not return a signed upload URL."
        },
        { status: 502 }
      );
    }

    const signedUrl = buildSignedUploadUrl(storageApiBase, signedPath);

    return NextResponse.json({
      objectPath,
      publicUrl,
      signedUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown signed upload error";
    return NextResponse.json({ error: "Failed to prepare upload.", details: message }, { status: 500 });
  }
}
