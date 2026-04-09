import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

interface AdBannerProps {
  position: string;
  className?: string;
}

export async function AdBanner({ position, className = "" }: AdBannerProps) {
  const ad = await prisma.ad.findFirst({
    where: {
      position: { name: position },
      status: "ACTIVE",
      startDate: { lte: new Date() },
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
    },
  });

  // 如果没有广告，显示占位（开发调试用）
  if (!ad) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-400 text-sm">广告位: {position}</p>
        <p className="text-gray-300 text-xs mt-1">暂无广告</p>
      </div>
    );
  }

  // 图片广告
  if (ad.type === "IMAGE" && ad.imageUrl) {
    return (
      <div className={`relative overflow-hidden rounded-lg ${className}`}>
        <Link
          href={ad.linkUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Image
            src={ad.imageUrl}
            alt={ad.altText || ad.title}
            width={1200}
            height={300}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </Link>
      </div>
    );
  }

  // 文字广告
  if (ad.type === "TEXT") {
    return (
      <div className={`bg-gray-100 p-4 rounded-lg ${className}`}>
        <Link
          href={ad.linkUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {ad.title}
        </Link>
        {ad.textContent && (
          <p className="text-sm text-gray-600 mt-1">{ad.textContent}</p>
        )}
      </div>
    );
  }

  return null;
}
