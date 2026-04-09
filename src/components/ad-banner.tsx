import Image from "next/image";
import Link from "next/link";

interface AdBannerProps {
  position: string;
  className?: string;
}

// 静态广告数据
const staticAds: Record<string, any> = {
  HP_BANNER_01: {
    title: "招聘平台推广",
    type: "IMAGE",
    imageUrl: null,
    linkUrl: "https://example.com",
    altText: "招聘平台广告",
  },
};

export function AdBanner({ position, className = "" }: AdBannerProps) {
  const ad = staticAds[position];
  
  if (!ad) {
    return null;
  }

  // 图片广告
  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <Link
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {ad.imageUrl ? (
          <Image
            src={ad.imageUrl}
            alt={ad.altText || ad.title}
            width={1200}
            height={300}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        ) : (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 text-center">
            <h3 className="text-xl font-bold">{ad.title}</h3>
            <p className="text-sm mt-2">广告位示例 - {position}</p>
          </div>
        )}
      </Link>
    </div>
  );
}
