export type UploadAssetType = "selfie" | "dance" | "drawing" | "singing";

type UploadResponse = {
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

export async function uploadGameAsset({ assetType, file, playerName }: UploadOptions): Promise<UploadResponse> {
  const response = await fetch("/api/storage/upload", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      assetType,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      playerName: playerName?.trim() || undefined
    })
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(uploadErrorMessage("Upload failed.", payload));
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Upload failed: invalid server response.");
  }

  const result = payload as Partial<SignedUploadResponse>;

  if (!result.publicUrl || !result.objectPath || !result.signedUrl) {
    throw new Error("Upload failed: missing signed upload data from server.");
  }

  const directUploadBody = new FormData();
  directUploadBody.append("cacheControl", "31536000");
  directUploadBody.append("", file);

  const directUploadResponse = await fetch(result.signedUrl, {
    method: "PUT",
    headers: {
      "x-upsert": "true"
    },
    body: directUploadBody
  });

  if (!directUploadResponse.ok) {
    const upstreamText = await directUploadResponse.text().catch(() => "");
    throw new Error(upstreamText ? `Upload failed. ${upstreamText.slice(0, 300)}` : "Upload failed.");
  }

  return {
    objectPath: result.objectPath,
    publicUrl: result.publicUrl
  };
}
