import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env";
import { logger } from "../config/logger";

/** Where local uploads live and the URL path they are served from (see index.ts). */
export const LOCAL_UPLOAD_DIR = resolve(process.cwd(), "uploads");
export const LOCAL_UPLOAD_ROUTE = "/uploads";
const AVATAR_DIR = "avatars";

export const MAX_AVATAR_BYTES = 1024 * 1024;

const s3 = env.S3_BUCKET
  ? new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials:
        env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
          ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
          : undefined,
    })
  : null;

const TYPES = [
  {
    mime: "image/webp",
    ext: "webp",
    test: (b: Buffer) =>
      b.subarray(0, 4).toString("ascii") === "RIFF" &&
      b.subarray(8, 12).toString("ascii") === "WEBP",
  },
  {
    mime: "image/png",
    ext: "png",
    test: (b: Buffer) =>
      b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: "image/jpeg",
    ext: "jpg",
    test: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
];

/** Identifies an image by its first bytes rather than trusting the Content-Type header. */
export function sniffImage(body: Buffer) {
  return TYPES.find((t) => t.test(body)) ?? null;
}

function publicUrl(key: string) {
  return s3
    ? `${env.S3_PUBLIC_URL!.replace(/\/$/, "")}/${key}`
    : `${env.BETTER_AUTH_URL}${LOCAL_UPLOAD_ROUTE}/${key}`;
}

/** Stores the picture under a new random name (so caches never show an old one) and returns its URL. */
export async function saveAvatar(
  userId: string,
  body: Buffer,
  type: NonNullable<ReturnType<typeof sniffImage>>,
) {
  const key = `${AVATAR_DIR}/${userId}-${randomUUID().slice(0, 8)}.${type.ext}`;
  if (s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: type.mime,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  } else {
    await mkdir(join(LOCAL_UPLOAD_DIR, AVATAR_DIR), { recursive: true });
    await writeFile(join(LOCAL_UPLOAD_DIR, key), body);
  }
  return publicUrl(key);
}

/** Deletes a picture this service stored earlier. URLs from elsewhere (Google, GitHub) are left alone. */
export async function deleteAvatar(url: string | null | undefined) {
  if (!url) return;
  const base = publicUrl("");
  if (!url.startsWith(base)) return;
  const key = url.slice(base.length);
  if (!key.startsWith(`${AVATAR_DIR}/`) || key.includes("..")) return;
  try {
    if (s3) await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
    else await unlink(join(LOCAL_UPLOAD_DIR, key));
  } catch (err) {
    logger.warn({ err, key }, "Couldn't delete the old profile picture");
  }
}
