import React, { useEffect, useRef, useState } from "react";
import type { CloudinaryAsset } from "../types";
import { ImageWithFallback } from "./ImageWithFallback";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

interface CloudinaryUploadProps {
  label: string;
  assets: CloudinaryAsset[];
  onChange: (assets: CloudinaryAsset[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  multiple?: boolean;
  altText?: string;
}

interface UploadResponse {
  secure_url?: unknown;
  public_id?: unknown;
  width?: unknown;
  height?: unknown;
  error?: { message?: unknown };
}

const upload = (
  file: File,
  preset: string,
  cloudName: string,
  onProgress: (value: number) => void,
): Promise<CloudinaryAsset> => new Promise((resolve, reject) => {
  const request = new XMLHttpRequest();
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", preset);
  request.open("POST", `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`);
  request.responseType = "json";
  request.upload.onprogress = (event) => {
    if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
  };
  request.onerror = () => reject(new Error("Network error while uploading to Cloudinary. Check the connection and retry."));
  request.onabort = () => reject(new Error("Upload was cancelled."));
  request.onload = () => {
    const result = request.response as UploadResponse | null;
    if (request.status < 200 || request.status >= 300) {
      const message = typeof result?.error?.message === "string"
        ? result.error.message
        : `Cloudinary rejected the upload (${request.status}). Check the unsigned preset and account limits.`;
      reject(new Error(message));
      return;
    }
    if (
      typeof result?.secure_url !== "string" ||
      typeof result.public_id !== "string" ||
      typeof result.width !== "number" ||
      typeof result.height !== "number"
    ) {
      reject(new Error("Cloudinary returned an incomplete image record."));
      return;
    }
    resolve({
      url: result.secure_url,
      publicId: result.public_id,
      alt: file.name.replace(/\.[^.]+$/, ""),
      width: result.width,
      height: result.height,
    });
  };
  request.send(data);
});

export const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
  label,
  assets,
  onChange,
  onUploadingChange,
  multiple = false,
  altText = "",
}) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const processingSelectionRef = useRef(false);
  const assetsRef = useRef(assets);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [retryFile, setRetryFile] = useState<File | null>(null);
  const [cloudinaryError, setCloudinaryError] = useState(false);

  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  const performUpload = async (file: File, currentAssets: CloudinaryAsset[] = assets): Promise<CloudinaryAsset | null> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() ?? "";
    const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim() ?? "";
    if (!cloudName || !preset) {
      setError("Cloudinary uploads are not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET, then rebuild.");
      return null;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cloudName)) {
      setError("The configured Cloudinary cloud name has an invalid format.");
      return null;
    }
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Choose a JPEG, PNG, WebP, or AVIF image.");
      return null;
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      setError("Images must be larger than 0 bytes and no bigger than 10 MB.");
      return null;
    }

    uploadingRef.current = true;
    setUploading(true);
    setError("");
    setRetryFile(null);
    setProgress(0);
    try {
      const item = { ...await upload(file, preset, cloudName, setProgress), alt: altText || file.name.replace(/\.[^.]+$/, "") };
      const nextAssets = multiple
        ? [...currentAssets, item]
        : [item];
      assetsRef.current = nextAssets;
      onChange(nextAssets);
      return item;
    } catch (reason) {
      setRetryFile(file);
      setError(reason instanceof Error ? reason.message : "Cloudinary upload failed.");
      return null;
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  };

  const onFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (!selectedFiles.length || uploadingRef.current || processingSelectionRef.current) return;
    processingSelectionRef.current = true;
    onUploadingChange?.(true);
    setCloudinaryError(false);
    setRetryFile(null);
    try {
      let currentAssets = assetsRef.current;
      for (const file of selectedFiles) {
        const uploadedAsset = await performUpload(file, currentAssets);
        if (!uploadedAsset) break;
        if (multiple) currentAssets = [...currentAssets, uploadedAsset];
      }
    } finally {
      processingSelectionRef.current = false;
      onUploadingChange?.(false);
    }
  };

  const retry = async () => {
    if (!retryFile || uploadingRef.current) return;
    onUploadingChange?.(true);
    try {
      await performUpload(retryFile, assetsRef.current);
    } finally {
      onUploadingChange?.(false);
    }
  };

  return (
    <div className="cloudinary-upload">
      <span className="cms-field-label">{label}</span>
      {assets.map((item) => (
        <article className="cloudinary-asset" key={item.publicId || item.url}>
          <ImageWithFallback
            src={item.url}
            alt={item.alt || "Uploaded image preview"}
            loading="lazy"
            onError={() => setCloudinaryError(true)}
          />
          <div className="cloudinary-asset-info">
            <span>{item.publicId || item.url}</span>
            <small>{item.width} × {item.height}</small>
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              const remaining = assets.filter((asset) => asset !== item);
              assetsRef.current = remaining;
              onChange(remaining);
            }}
          >
            REMOVE
          </button>
        </article>
      ))}
      {cloudinaryError && <p className="cms-error" role="status">An image could not be previewed. The saved Cloudinary asset is unchanged.</p>}
      <div className="cloudinary-upload-actions">
        <button
          type="button"
          style={{ border: "1px solid #d4d4d4", padding: "10px 14px", background: "#fff", cursor: "pointer" }}
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
        >
          {uploading
            ? `UPLOADING ${progress}%`
            : multiple
              ? assets.length ? "ADD IMAGES" : "UPLOAD IMAGE"
              : assets.length ? "REPLACE IMAGE" : "UPLOAD IMAGE"}
        </button>
        {retryFile && !uploading && <button type="button" onClick={() => void retry()}>RETRY {retryFile.name}</button>}
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple={multiple}
          hidden
          onChange={(event) => void onFilesSelected(event)}
        />
      </div>
      {uploading && <progress className="cloudinary-upload-progress" max={100} value={progress} aria-label="Image upload progress" />}
      {error && <p className="cms-error" role="alert">{error}</p>}
      <p className="cms-muted">JPEG, PNG, WebP, or AVIF · max 10 MB per image. Removing an image detaches it here; the Cloudinary asset is not deleted.</p>
    </div>
  );
};
