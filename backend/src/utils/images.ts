import fs from "fs";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
import { ENV } from "../config/env.js";

export interface StoredImage {
  url: string;
  public_id: string;
}

/** Uploads a temp file to Cloudinary, always removes the temp file afterwards. */
export async function uploadImageFile(path: string, folder = ""): Promise<StoredImage> {
  try {
    if (!isCloudinaryConfigured) throw new Error("CLOUDINARY_NOT_CONFIGURED");
    const result = await cloudinary.uploader.upload(path, {
      folder: folder ? `${ENV.CLOUDINARY_FOLDER}/${folder}` : ENV.CLOUDINARY_FOLDER,
      resource_type: "image",
      // keep originals from getting huge: never wider than 2400px
      transformation: [{ width: 2400, crop: "limit" }],
    });
    return { url: result.secure_url, public_id: result.public_id };
  } finally {
    fs.promises.unlink(path).catch(() => {});
  }
}

export async function deleteImage(publicId?: string | null) {
  if (!publicId || !isCloudinaryConfigured) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn("Could not delete image from Cloudinary:", publicId, (err as Error).message);
  }
}

/** Accepts the {url, public_id} shape the admin sends, rejects anything else. */
export function cleanImage(value: unknown): StoredImage | null {
  if (!value || typeof value !== "object") return null;
  const { url, public_id } = value as Record<string, unknown>;
  if (typeof url !== "string" || (!/^https?:\/\//.test(url) && !url.startsWith("/"))) return null;
  return { url: url.slice(0, 800), public_id: typeof public_id === "string" ? public_id.slice(0, 300) : "" };
}

/** Finds every {url, public_id} image inside any JSON value (used for page content clean-up). */
export function collectImages(value: unknown, found: StoredImage[] = []): StoredImage[] {
  if (Array.isArray(value)) value.forEach((v) => collectImages(v, found));
  else if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.url === "string" && typeof o.public_id === "string") found.push({ url: o.url, public_id: o.public_id });
    else Object.values(o).forEach((v) => collectImages(v, found));
  }
  return found;
}
