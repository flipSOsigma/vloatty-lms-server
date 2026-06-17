import { UTApi } from "uploadthing/server";

export const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });

export function extractKey(url: string): string {
  const segments = url.split("/");
  return segments[segments.length - 1];
}

export async function deleteUploadthingFile(url: string): Promise<void> {
  const key = extractKey(url);
  try {
    await utapi.deleteFiles([key]);
  } catch (err) {
    console.error("Failed to delete file from UploadThing:", err);
  }
}
