"use client";

import Image from "next/image";
import { useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  objectFit = "cover",
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // 骨架屏样式
  const skeletonClass = isLoading ? "animate-pulse bg-gray-200" : "";
  
  // 错误处理
  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={!fill ? { width, height } : undefined}
      >
        <span className="text-gray-400 text-sm">{alt.charAt(0)}</span>
      </div>
    );
  }

  const imageStyle = {
    objectFit,
    transition: "opacity 0.3s ease-in-out",
    opacity: isLoading ? 0 : 1,
  };

  if (fill) {
    return (
      <div className={`relative ${className} ${skeletonClass}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          quality={80}
          style={imageStyle}
          onLoad={() => setIsLoading(false)}
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden ${skeletonClass} ${className}`}
      style={{ width, height }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        quality={80}
        style={imageStyle}
        onLoad={() => setIsLoading(false)}
        onError={() => setError(true)}
      />
    </div>
  );
}

// 带模糊占位图的图片组件
interface BlurImageProps extends OptimizedImageProps {
  blurDataUrl?: string;
}

export function BlurImage({
  src,
  alt,
  blurDataUrl,
  className = "",
  ...props
}: BlurImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      {...props}
    />
  );
}

// 懒加载图片（用于长列表）
interface LazyImageProps extends OptimizedImageProps {
  threshold?: number;
  rootMargin?: string;
}

export function LazyImage({
  threshold = 0.1,
  rootMargin = "50px",
  ...props
}: LazyImageProps) {
  // Next.js Image 组件已经内置了懒加载功能
  // 这里只是封装一层，确保使用 lazy loading
  return (
    <OptimizedImage
      {...props}
      priority={false}
    />
  );
}
