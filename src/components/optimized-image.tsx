import Image from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

/**
 * SEO优化图片组件
 * - 自动添加合适的sizes属性
 * - 支持WebP格式自动转换
 * - 懒加载优化
 * - 添加结构化数据属性
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: OptimizedImageProps) {
  // 确保alt文本不为空（SEO要求）
  const safeAlt = alt || "图片";

  return (
    <div className={cn("relative overflow-hidden", fill ? "w-full h-full" : "", className)}>
      <Image
        src={src}
        alt={safeAlt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        quality={80}
        className="object-cover"
        unoptimized={src.startsWith("http") && !src.includes("unsplash.com")}
      />
    </div>
  );
}

/**
 * 博客封面图组件
 */
export function BlogCoverImage({
  src,
  alt,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <span className="text-white text-2xl font-bold">JobQuip</span>
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="100vw"
    />
  );
}

/**
 * 公司Logo组件
 */
export function CompanyLogo({
  src,
  alt,
  size = 48,
}: {
  src?: string | null;
  alt: string;
  size?: number;
}) {
  if (!src) {
    return (
      <div
        className="bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-medium"
        style={{ width: size, height: size }}
      >
        {alt.slice(0, 2)}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={`${alt} Logo`}
      width={size}
      height={size}
      className="rounded-lg"
      sizes={`${size}px`}
    />
  );
}
