export const isValidImageUrl = (value: string): boolean => {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const cloudinaryUploadIndex = (value: string): number => {
  const uploadMarker = "/image/upload/";
  return isValidImageUrl(value) && value.includes("res.cloudinary.com/")
    ? value.indexOf(uploadMarker)
    : -1;
};

const cloudinaryVariant = (value: string, width?: number): string => {
  const markerIndex = cloudinaryUploadIndex(value);
  if (markerIndex < 0) return value;
  const transformStart = markerIndex + "/image/upload/".length;
  const nextSlash = value.indexOf("/", transformStart);
  const firstSegment = value.slice(transformStart, nextSlash < 0 ? undefined : nextSlash);
  const isVersion = /^v\d+$/.test(firstSegment);
  const hasTransforms = firstSegment.includes(",") || /^(?:f|q|w|h|c|g|dpr|e|fl|ar|a)_/.test(firstSegment);
  const isPathSegment = isVersion || !hasTransforms;
  const existingTransforms = hasTransforms ? firstSegment.split(",") : [];
  const transforms = new Set(existingTransforms);
  transforms.add("f_auto");
  transforms.add("q_auto");
  if (width) {
    transforms.add(`w_${width}`);
    transforms.add("c_limit");
  }
  const nextPath = isPathSegment
    ? `${[...transforms].join(",")}/${value.slice(transformStart)}`
    : `${[...transforms].join(",")}/${value.slice(nextSlash < 0 ? value.length : nextSlash + 1)}`;
  return `${value.slice(0, transformStart)}${nextPath}`;
};

export const optimizeCloudinaryImageUrl = (value: string): string => cloudinaryVariant(value);

export const getCloudinaryImageSrcSet = (value: string): string | undefined => {
  if (cloudinaryUploadIndex(value) < 0) return undefined;
  return [320, 640, 960, 1280]
    .map((width) => `${cloudinaryVariant(value, width)} ${width}w`)
    .join(", ");
};
