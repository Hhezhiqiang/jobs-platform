"use client";

import { useEffect } from "react";
import Link from "next/link";

export function AdTrack({ adId, href, children }: { adId: string; href: string; children: React.ReactNode }) {
  // 曝光追踪
  useEffect(() => {
    navigator.sendBeacon?.("/api/ads/track", JSON.stringify({ adId, type: "view" }));
  }, [adId]);

  const handleClick = () => {
    navigator.sendBeacon?.("/api/ads/track", JSON.stringify({ adId, type: "click" }));
  };

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="block"
    >
      {children}
    </Link>
  );
}
