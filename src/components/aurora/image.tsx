import { useState, useEffect, useRef, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface AuroraImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  priority?: boolean;
  className?: string;
}

/**
 * AuroraImage - 支持懒加载和模糊占位符的图片组件
 */
export function AuroraImage({
  src,
  alt,
  width,
  height,
  placeholder = "empty",
  blurDataURL,
  priority = false,
  className,
  ...props
}: AuroraImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      {/* 占位符 */}
      {(!isLoaded || !isInView) && (
        <div
          className={cn(
            "absolute inset-0",
            placeholder === "blur" && blurDataURL
              ? "bg-cover blur-xl scale-110"
              : "bg-gray-200 animate-pulse"
          )}
          style={placeholder === "blur" && blurDataURL ? { backgroundImage: `url(${blurDataURL})` } : undefined}
        />
      )}
      
      {/* 图片 */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          {...props}
        />
      )}
    </div>
  );
}

/**
 * useLazyLoad - 懒加载 Hook
 */
export function useLazyLoad<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      options || { rootMargin: "100px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options]);

  return { ref, isInView };
}

/**
 * LazyComponent - 懒加载组件
 */
export function LazyComponent({
  children,
  className,
  rootMargin = "200px",
}: {
  children: React.ReactNode;
  className?: string;
  rootMargin?: string;
}) {
  const { ref, isInView } = useLazyLoad<HTMLDivElement>({ rootMargin });

  return (
    <div ref={ref} className={className}>
      {isInView && (
        <div className="animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}
