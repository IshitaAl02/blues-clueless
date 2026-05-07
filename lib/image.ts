// Resize an image File to a JPEG data URL capped at maxDim and a target byte size.
// Keeps payloads small enough for Supabase Realtime broadcast (~256KB hard limit).
export async function fileToCompressedDataUrl(
  file: File,
  maxDim = 800,
  targetBytes = 180_000,
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  let { width, height } = img;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.8;
  let out = canvas.toDataURL("image/jpeg", quality);
  while (out.length > targetBytes && quality > 0.3) {
    quality -= 0.1;
    out = canvas.toDataURL("image/jpeg", quality);
  }
  return out;
}
