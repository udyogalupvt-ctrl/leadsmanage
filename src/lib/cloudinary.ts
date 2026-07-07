const CLOUD_NAME = "dcoimqij";
const UPLOAD_PRESET = "leadmanage";

export type CloudinaryUpload = {
  url: string;
  publicId: string;
  resourceType: string;
  format?: string;
  bytes: number;
  originalName: string;
};

export async function uploadToCloudinary(file: File): Promise<CloudinaryUpload> {
  const resourceType = file.type.startsWith("image/")
    ? "image"
    : file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("audio/")
        ? "video" // Cloudinary treats audio under 'video' endpoint
        : "raw";

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(endpoint, { method: "POST", body: fd });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Cloudinary upload failed: ${t}`);
  }
  const data = await res.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type,
    format: data.format,
    bytes: data.bytes,
    originalName: file.name,
  };
}
