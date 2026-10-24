import { env } from "./env";

const SIZE = 256;

/**
 * Crops the picture to a centred square and scales it to 256x256 WebP in the
 * browser, so uploads are small and the server never has to decode images.
 */
export async function toAvatarBlob(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 15 * 1024 * 1024)
    throw new Error("That image is over 15 MB. Choose a smaller one.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("That image couldn't be read. Try a PNG or JPEG.");
  }
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9),
  );
  // Safari can't encode WebP and falls back to PNG, which the server also accepts.
  if (!blob) throw new Error("That image couldn't be processed.");
  return blob;
}

async function request(method: "PUT" | "DELETE", body?: Blob) {
  const res = await fetch(`${env.serverUrl}/api/me/avatar`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": body.type } : undefined,
    body,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "The picture couldn't be saved. Try again.");
  }
  return (await res.json()) as { image: string | null };
}

export const uploadAvatar = (blob: Blob) => request("PUT", blob);
export const removeAvatar = () => request("DELETE");
