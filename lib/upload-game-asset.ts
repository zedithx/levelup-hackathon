import { validateUploadFileSignature, type UploadAssetType } from "@/lib/upload-policy";

const UPLOAD_SESSION_REFRESH_MS = 10 * 60 * 1000;

let uploadSessionRequest: Promise<void> | null = null;
let uploadSessionValidUntil = 0;

type UploadResponse = {
  contentType: string;
  objectPath: string;
  publicUrl: string;
};

type SignedUploadResponse = UploadResponse & {
  signedUrl: string;
};

type UploadOptions = {
  assetType: UploadAssetType;
  file: File;
  playerName?: string;
  signal?: AbortSignal;
};

function uploadErrorMessage(fallback: string, payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const error = typeof record.error === "string" ? record.error : "";
  const details = typeof record.details === "string" ? record.details : "";

  if (error && details) {
    return `${error} ${details}`;
  }

  if (error) {
    return error;
  }

  return fallback;
}

async function ensureUploadSession() {
  if (Date.now() < uploadSessionValidUntil) {
    return;
  }

  if (!uploadSessionRequest) {
    uploadSessionRequest = (async () => {
      const response = await fetch("/api/storage/upload/session", {
        cache: "no-store",
        credentials: "same-origin",
        method: "POST"
      });
      const payload = response.status === 204 ? null : ((await response.json().catch(() => null)) as unknown);

      if (!response.ok) {
        throw new Error(uploadErrorMessage("Unable to start upload session.", payload));
      }

      uploadSessionValidUntil = Date.now() + UPLOAD_SESSION_REFRESH_MS;
    })();
  }

  try {
    await uploadSessionRequest;
  } finally {
    uploadSessionRequest = null;
  }
}

export async function uploadGameAsset({ assetType, file, playerName, signal }: UploadOptions): Promise<UploadResponse> {
  const validationMessage = await validateUploadFileSignature(assetType, file);

  if (validationMessage) {
    throw new Error(validationMessage);
  }

  await ensureUploadSession();

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      assetType,
      mimeType: file.type,
      size: file.size,
      playerName: playerName?.trim() || undefined
    }),
    signal
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(uploadErrorMessage("Upload failed.", payload));
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Upload failed: invalid server response.");
  }

  const result = payload as Partial<SignedUploadResponse>;

  if (!result.contentType || !result.publicUrl || !result.objectPath || !result.signedUrl) {
    throw new Error("Upload failed: missing signed upload data from server.");
  }

  const directUploadResponse = await fetch(result.signedUrl, {
    method: "PUT",
    headers: {
      "cache-control": "31536000",
      "content-type": result.contentType,
      "x-upsert": "true"
    },
    body: file,
    signal
  });

  if (!directUploadResponse.ok) {
    const upstreamText = await directUploadResponse.text().catch(() => "");
    throw new Error(upstreamText ? `Upload failed. ${upstreamText.slice(0, 300)}` : "Upload failed.");
  }

  return {
    contentType: result.contentType,
    objectPath: result.objectPath,
    publicUrl: result.publicUrl
  };
}
