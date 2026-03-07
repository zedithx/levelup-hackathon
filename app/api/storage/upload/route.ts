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

function normalizeStorageRoot(rawUrl: string) {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  const suffixes = ["/storage/v1/s3", "/storage/v1/object/public", "/storage/v1/object", "/storage/v1"];

  for (const suffix of suffixes) {
    if (trimmed.endsWith(suffix)) {
      return trimmed.slice(0, -suffix.length);
    }
  }

  return trimmed;
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

function extensionForFile(file: File) {
  const maybeNameExtension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (/^[a-z0-9]{1,10}$/.test(maybeNameExtension)) {
    return maybeNameExtension;
  }

  return extensionForMimeType(file.type);
}

function buildObjectPath(assetType: AssetType, file: File, playerName: string | null) {
  const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
  const id = crypto.randomUUID();
  const extension = extensionForFile(file);

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

export async function POST(request: Request) {
  const storageUrl = process.env.SUPABASE_STORAGE_URL;
  const storageServiceKey = process.env.SUPABASE_STORAGE_SERVICE_KEY;
  const storageBucket = process.env.SUPABASE_STORAGE_BUCKET;

  if (!storageUrl || !storageServiceKey || !storageBucket) {
    return NextResponse.json({ error: missingStorageEnvMessage() }, { status: 500 });
  }

  const formData = await request.formData();
  const assetTypeRaw = formData.get("assetType");
  const fileEntry = formData.get("file");
  const playerNameEntry = formData.get("playerName");

  const assetType = typeof assetTypeRaw === "string" ? assetTypeRaw.trim() : "";

  if (!isAssetType(assetType)) {
    return NextResponse.json({ error: "assetType must be one of: selfie, dance, drawing, singing." }, { status: 400 });
  }

  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (fileEntry.size <= 0) {
    return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 });
  }

  if (fileEntry.size > MAX_UPLOAD_BYTES[assetType]) {
    return NextResponse.json({ error: `File is too large for ${assetType}.` }, { status: 413 });
  }

  if (!isMimeAllowed(assetType, fileEntry.type)) {
    return NextResponse.json({ error: `Unsupported file type for ${assetType}.` }, { status: 415 });
  }

  const playerName = typeof playerNameEntry === "string" ? playerNameEntry.trim() : null;
  const objectPath = buildObjectPath(assetType, fileEntry, playerName);
  const encodedObjectPath = encodeObjectPath(objectPath);
  const encodedBucket = encodeURIComponent(storageBucket);
  const storageRoot = normalizeStorageRoot(storageUrl);
  const uploadUrl = `${storageRoot}/storage/v1/object/${encodedBucket}/${encodedObjectPath}`;
  const publicBase = process.env.SUPABASE_STORAGE_PUBLIC_URL_BASE?.trim().replace(/\/+$/, "")
    || `${storageRoot}/storage/v1/object/public`;
  const publicUrl = `${publicBase}/${encodedBucket}/${encodedObjectPath}`;

  try {
    const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());
    const upstreamResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${storageServiceKey}`,
        apikey: storageServiceKey,
        "cache-control": "31536000",
        "content-type": fileEntry.type || "application/octet-stream",
        "x-upsert": "true"
      },
      body: fileBuffer
    });

    if (!upstreamResponse.ok) {
      const upstreamError = await upstreamResponse.text();

      return NextResponse.json(
        {
          error: "Upload to storage failed.",
          details: upstreamError.slice(0, 500)
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      objectPath,
      publicUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload error";
    return NextResponse.json({ error: "Upload failed.", details: message }, { status: 500 });
  }
}
