export type UploadAssetType = "selfie" | "dance" | "drawing" | "singing";

type UploadMimePolicy = {
  contentType: string;
  extension: string;
  label: string;
  matchesSignature: (bytes: Uint8Array) => boolean;
};

type UploadAssetPolicy = {
  inputAccept: string;
  mimeTypes: Record<string, UploadMimePolicy>;
};

const MIME_ALIASES: Record<string, string> = {
  "audio/mp3": "audio/mpeg",
  "audio/wave": "audio/wav",
  "audio/x-m4a": "audio/mp4",
  "audio/x-wav": "audio/wav",
  "image/jpg": "image/jpeg",
  "video/x-m4v": "video/mp4"
};

function matchesBytes(bytes: Uint8Array, signature: number[], offset = 0) {
  if (bytes.length < offset + signature.length) {
    return false;
  }

  return signature.every((value, index) => bytes[offset + index] === value);
}

function readAscii(bytes: Uint8Array, start: number, length: number) {
  if (bytes.length < start + length) {
    return "";
  }

  return String.fromCharCode(...bytes.slice(start, start + length));
}

function matchesRiffChunk(bytes: Uint8Array, formType: string) {
  return readAscii(bytes, 0, 4) === "RIFF" && readAscii(bytes, 8, 4) === formType;
}

function matchesIsoBmffBrand(bytes: Uint8Array, brands: string[]) {
  if (readAscii(bytes, 4, 4) !== "ftyp") {
    return false;
  }

  const brand = readAscii(bytes, 8, 4);
  return brands.includes(brand);
}

function matchesJpeg(bytes: Uint8Array) {
  return matchesBytes(bytes, [0xff, 0xd8, 0xff]);
}

function matchesPng(bytes: Uint8Array) {
  return matchesBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

function matchesWebp(bytes: Uint8Array) {
  return matchesRiffChunk(bytes, "WEBP");
}

function matchesGif(bytes: Uint8Array) {
  return readAscii(bytes, 0, 6) === "GIF87a" || readAscii(bytes, 0, 6) === "GIF89a";
}

function matchesHeic(bytes: Uint8Array) {
  return matchesIsoBmffBrand(bytes, ["heic", "heix", "heif", "hevc", "hevx", "mif1", "msf1"]);
}

function matchesWebm(bytes: Uint8Array) {
  return matchesBytes(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
}

function matchesMp4Family(bytes: Uint8Array) {
  return matchesIsoBmffBrand(bytes, ["M4A ", "M4B ", "M4P ", "M4V ", "avc1", "dash", "isom", "iso2", "mp41", "mp42", "qt  "]);
}

function matchesMp3(bytes: Uint8Array) {
  return readAscii(bytes, 0, 3) === "ID3" || (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
}

function matchesWav(bytes: Uint8Array) {
  return matchesRiffChunk(bytes, "WAVE");
}

function matchesOgg(bytes: Uint8Array) {
  return readAscii(bytes, 0, 4) === "OggS";
}

const UPLOAD_POLICIES: Record<UploadAssetType, UploadAssetPolicy> = {
  selfie: {
    inputAccept: "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif",
    mimeTypes: {
      "image/gif": {
        contentType: "image/gif",
        extension: "gif",
        label: "GIF",
        matchesSignature: matchesGif
      },
      "image/heic": {
        contentType: "image/heic",
        extension: "heic",
        label: "HEIC",
        matchesSignature: matchesHeic
      },
      "image/heif": {
        contentType: "image/heif",
        extension: "heif",
        label: "HEIF",
        matchesSignature: matchesHeic
      },
      "image/jpeg": {
        contentType: "image/jpeg",
        extension: "jpg",
        label: "JPEG",
        matchesSignature: matchesJpeg
      },
      "image/png": {
        contentType: "image/png",
        extension: "png",
        label: "PNG",
        matchesSignature: matchesPng
      },
      "image/webp": {
        contentType: "image/webp",
        extension: "webp",
        label: "WebP",
        matchesSignature: matchesWebp
      }
    }
  },
  drawing: {
    inputAccept: "image/png",
    mimeTypes: {
      "image/png": {
        contentType: "image/png",
        extension: "png",
        label: "PNG",
        matchesSignature: matchesPng
      }
    }
  },
  dance: {
    inputAccept: "video/mp4,video/quicktime,video/webm",
    mimeTypes: {
      "video/mp4": {
        contentType: "video/mp4",
        extension: "mp4",
        label: "MP4",
        matchesSignature: matchesMp4Family
      },
      "video/quicktime": {
        contentType: "video/quicktime",
        extension: "mov",
        label: "MOV",
        matchesSignature: matchesMp4Family
      },
      "video/webm": {
        contentType: "video/webm",
        extension: "webm",
        label: "WebM",
        matchesSignature: matchesWebm
      }
    }
  },
  singing: {
    inputAccept: "audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm",
    mimeTypes: {
      "audio/mpeg": {
        contentType: "audio/mpeg",
        extension: "mp3",
        label: "MP3",
        matchesSignature: matchesMp3
      },
      "audio/mp4": {
        contentType: "audio/mp4",
        extension: "m4a",
        label: "M4A",
        matchesSignature: matchesMp4Family
      },
      "audio/ogg": {
        contentType: "audio/ogg",
        extension: "ogg",
        label: "OGG",
        matchesSignature: matchesOgg
      },
      "audio/wav": {
        contentType: "audio/wav",
        extension: "wav",
        label: "WAV",
        matchesSignature: matchesWav
      },
      "audio/webm": {
        contentType: "audio/webm",
        extension: "webm",
        label: "WebM",
        matchesSignature: matchesWebm
      }
    }
  }
};

export function normalizeUploadMimeType(value: string) {
  const baseMimeType = value.trim().toLowerCase().split(";")[0] || "";
  return MIME_ALIASES[baseMimeType] || baseMimeType;
}

export function getAllowedUploadMimeTypes(assetType: UploadAssetType) {
  return Object.keys(UPLOAD_POLICIES[assetType].mimeTypes);
}

export function getUploadAcceptAttribute(assetType: UploadAssetType) {
  return UPLOAD_POLICIES[assetType].inputAccept;
}

export function getUploadMimePolicy(assetType: UploadAssetType, mimeType: string) {
  const normalizedMimeType = normalizeUploadMimeType(mimeType);
  return UPLOAD_POLICIES[assetType].mimeTypes[normalizedMimeType] || null;
}

export function describeAllowedUploadFormats(assetType: UploadAssetType) {
  return Object.values(UPLOAD_POLICIES[assetType].mimeTypes)
    .map((policy) => policy.label)
    .join(", ");
}

export async function validateUploadFileSignature(assetType: UploadAssetType, file: File) {
  const mimePolicy = getUploadMimePolicy(assetType, file.type);

  if (!mimePolicy) {
    return `Unsupported ${assetType} format. Allowed formats: ${describeAllowedUploadFormats(assetType)}.`;
  }

  const headerBytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());

  if (!mimePolicy.matchesSignature(headerBytes)) {
    return `The selected ${assetType} file does not match its declared format. Please choose a valid ${mimePolicy.label} file.`;
  }

  return null;
}
