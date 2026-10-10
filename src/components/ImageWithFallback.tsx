import React, { useEffect, useState } from "react";
import {
  getCloudinaryImageSrcSet,
  isValidImageUrl,
  optimizeCloudinaryImageUrl,
} from "../imageUrls";

interface ImageWithFallbackProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string;
  fallback?: React.ReactNode;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src = "",
  fallback,
  alt,
  className,
  style,
  onError,
  ...imageProps
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!isValidImageUrl(src) || failed) {
    return <>{fallback ?? <span className={`image-url-fallback${className ? ` ${className}` : ""}`} style={style} aria-label={alt || undefined} role={alt ? "img" : undefined}>Image unavailable</span>}</>;
  }

  const srcSet = getCloudinaryImageSrcSet(src);
  return <img
    {...imageProps}
    className={className}
    style={style}
    src={optimizeCloudinaryImageUrl(src)}
    srcSet={imageProps.srcSet ?? srcSet}
    sizes={imageProps.sizes ?? (srcSet ? "(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 640px" : undefined)}
    decoding={imageProps.decoding ?? "async"}
    alt={alt}
    onError={(event) => {
      setFailed(true);
      onError?.(event);
    }}
  />;
};
