import React, { useEffect, useState } from "react";
import { isValidImageUrl } from "../imageUrls";

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
  ...imageProps
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!isValidImageUrl(src) || failed) {
    return <>{fallback ?? <span className={`image-url-fallback${className ? ` ${className}` : ""}`} style={style} aria-label={alt || undefined} role={alt ? "img" : undefined}>Image unavailable</span>}</>;
  }

  return <img {...imageProps} className={className} style={style} src={src} alt={alt} onError={() => setFailed(true)} />;
};
