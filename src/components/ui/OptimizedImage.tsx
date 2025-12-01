/**
 * Optimized Image component with lazy loading and error handling
 */
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/componentUtils";
import { ImageIcon } from "lucide-react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Elite Coffee Shop Optimized Image Component
 *
 * Features:
 * - Automatic lazy loading
 * - Error handling with fallback
 * - Loading states
 * - Accessibility improvements
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/images/coffee.jpg"
 *   alt="Delicious coffee"
 *   width={300}
 *   height={200}
 *   className="rounded-lg"
 * />
 * ```
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  priority = false,
  quality = 85,
  placeholder = "empty",
  blurDataURL,
  fallbackSrc = "/images/placeholder.jpg",
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setImageError(true);
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
    onError?.();
  };

  // If image failed to load and we don't have a fallback, show placeholder
  if (imageError && imageSrc === fallbackSrc) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-elite-light-gray border border-elite-gray rounded",
          className,
        )}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      >
        <ImageIcon className="w-8 h-8 text-elite-gray" />
        <span className="sr-only">{alt} - Image not available</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && (
        <div
          className="absolute inset-0 bg-elite-light-gray animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <ImageIcon className="w-8 h-8 text-elite-gray" />
        </div>
      )}
      <Image
        src={imageSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};
