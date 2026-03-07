export type UploadAssetType = "selfie" | "dance" | "drawing" | "singing";

type UploadResponse = {
  objectPath: string;
  publicUrl: string;
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
  const formData = new FormData();
  formData.append("assetType", assetType);
  formData.append("file", file);

  if (playerName?.trim()) {
    formData.append("playerName", playerName.trim());
  }

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(uploadErrorMessage("Upload failed.", payload));
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Upload failed: invalid server response.");
  }

  const result = payload as Partial<UploadResponse>;

  if (!result.publicUrl || !result.objectPath) {
    throw new Error("Upload failed: missing URL from server.");
  }

  return {
    objectPath: result.objectPath,
    publicUrl: result.publicUrl
  };
}
