import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

interface AdBannerProps {
  position: string;
  className?: string;
}

async function getAds(position: string) {
  const now = new Date();
  
  return await prisma.ad.findMany({
    where: {
      position: {
        name: position,
      },
      status: "ACTIVE",
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    },
    take: 1,
    orderBy: { createdAt: "desc" },
  });
}

export async function AdBanner({ position, className = "" }: AdBannerProps) {
  const ads = await getAds(position);
  
  if (ads.length === 0) {
    return null;
  }

  const ad = ads[0];

  // 文字链广告
  if (ad.type === "TEXT") {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <Link
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {ad.textContent || ad.title}
        </Link>
      </div>
    );
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
          </div>
        )}
      </Link>
    </div>
  );
}
