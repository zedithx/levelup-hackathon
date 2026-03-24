const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.85;

/**
 * Resizes and recompresses an image file to a JPEG at MAX_DIMENSION on the
 * long edge. Uses createImageBitmap() for off-thread decoding to avoid
 * blocking the main thread with large camera photos.
 * Falls back to the original file if the browser cannot decode the image.
 */
export async function compressImageFile(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Fallback for unsupported formats (e.g. HEIC on some Android browsers)
    return file;
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  // bitmap is already decoded off-thread so this drawImage is just a fast GPU blit
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { resolve(file); return; }
        resolve(
          new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
          })
        );
      },
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}
