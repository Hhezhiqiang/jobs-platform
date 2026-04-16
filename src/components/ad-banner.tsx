import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ensureHttpProtocol } from "@/lib/utils";
import { AdTrack } from "@/components/ad-track";

interface AdBannerProps {
  position: string;
  className?: string;
}

export async function AdBanner({ position, className = "" }: AdBannerProps) {
  const ad = await prisma.ads.findFirst({
    where: {
      ad_positions: { name: position },
      status: "ACTIVE",
      startDate: { lte: new Date() },
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
    },
  });

  if (!ad) return null;

  const linkUrl = ensureHttpProtocol(ad.linkUrl);

  // 图片广告
  if (ad.type === "IMAGE" && ad.imageUrl) {
    return (
      <div className={`overflow-hidden rounded-lg ${className}`}>
        <AdTrack adId={ad.id} href={linkUrl}>
          <Image
            src={ad.imageUrl}
            alt={ad.altText || ad.title}
            width={1200}
            height={300}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </AdTrack>
      </div>
    );
  }

  // 文字广告
  if (ad.type === "TEXT") {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-lg ${className}`}>
        <AdTrack adId={ad.id} href={linkUrl}>
          <span className="text-blue-600 hover:text-blue-800 font-medium">{ad.title}</span>
        </AdTrack>
        {ad.textContent && (
          <p className="text-sm text-gray-600 mt-1">{ad.textContent}</p>
        )}
      </div>
    );
  }

  return null;
}
